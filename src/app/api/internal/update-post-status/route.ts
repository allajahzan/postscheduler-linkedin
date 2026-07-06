import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("x-internal-secret");

    if (
      !process.env.INTERNAL_API_SECRET ||
      authHeader !== process.env.INTERNAL_API_SECRET
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { post_id, status } = await request.json().catch(() => ({}));

    if (!post_id) {
      return NextResponse.json(
        { error: "Missing post_id in request body" },
        { status: 400 },
      );
    }

    if (!ObjectId.isValid(post_id)) {
      return NextResponse.json(
        { error: "Invalid post ID format" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const result = await db
      .collection("posts")
      .updateOne(
        { _id: new ObjectId(post_id) },
        { $set: { status: status, updated_at: new Date() } },
      );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (status === "done") {
      const post = await db
        .collection("posts")
        .findOne({ _id: new ObjectId(post_id) });
      if (post && post.user_id) {
        await db.collection("notifications").insertOne({
          user_id: post.user_id,
          post_id: post._id,
          type: "success",
          title: "Post Published Successfully",
          message: `Your post '${post.title}' was published to LinkedIn successfully.`,
          is_read: false,
          created_at: new Date(),
        });
      }
    }

    return NextResponse.json({
      success: true,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Update post status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
