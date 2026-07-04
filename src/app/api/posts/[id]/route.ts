import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";
import { ObjectId } from "mongodb";
import {
  validateAndTransformImageUrl,
  checkImageAccessible,
} from "@/lib/validation";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();

    if (!session || !session.userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // In Next.js 15+ we have to await params
    const { id } = await params;
    const body = await request.json();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid post ID" }, { status: 400 });
    }

    if (body.image_url && !body.generate_image) {
      const validation = validateAndTransformImageUrl(body.image_url);
      if (!validation.isValid) {
        return NextResponse.json(
          { message: validation.reason },
          { status: 400 },
        );
      }

      const isAccessible = await checkImageAccessible(validation.finalUrl);
      if (!isAccessible) {
        return NextResponse.json(
          { message: "This image URL is not publicly accessible" },
          { status: 400 },
        );
      }

      body.image_url = validation.finalUrl;
    }

    const db = await getDb();

    // Verify ownership
    const existingPost = await db.collection("posts").findOne({
      _id: new ObjectId(id),
      user_id: new ObjectId(session.userId),
    });

    if (!existingPost) {
      return NextResponse.json(
        { message: "Post not found or unauthorized" },
        { status: 404 },
      );
    }

    if (existingPost.status === "done") {
      return NextResponse.json(
        { message: "Cannot edit a post that has already been published." },
        { status: 403 },
      );
    }

    // Only allow updating specific fields
    const allowedFields = [
      "date",
      "time",
      "title",
      "description",
      "image_url",
      "generate_image",
      "prompt",
      "status",
    ];
    const updateData: any = { updated_at: new Date() };

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    await db
      .collection("posts")
      .updateOne({ _id: new ObjectId(id) }, { $set: updateData });

    const updatedPost = await db
      .collection("posts")
      .findOne({ _id: new ObjectId(id) });

    return NextResponse.json({ success: true, post: updatedPost });
  } catch (error) {
    console.error("Update post error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();

    if (!session || !session.userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid post ID" }, { status: 400 });
    }

    const db = await getDb();

    const result = await db
      .collection("posts")
      .updateOne(
        { _id: new ObjectId(id), user_id: new ObjectId(session.userId) },
        { $set: { is_deleted: true, updated_at: new Date() } },
      );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { message: "Post not found or unauthorized" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete post error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
