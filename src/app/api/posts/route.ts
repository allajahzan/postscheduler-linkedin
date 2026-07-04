import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";
import { ObjectId } from "mongodb";
import { PostDocument } from "@/types";
import {
  validateAndTransformImageUrl,
  checkImageAccessible,
} from "@/lib/validation";

export async function GET() {
  try {
    const session = await getSession();

    if (!session || !session.userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const posts = await db
      .collection<PostDocument>("posts")
      .find({
        user_id: new ObjectId(session.userId),
        is_deleted: { $ne: true },
      })
      .sort({ created_at: 1 }) // Sort by creation time ascending
      .toArray();

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Fetch posts error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session || !session.userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const {
      date,
      time,
      title,
      description,
      image_url,
      generate_image,
      prompt,
    } = await request.json();

    if (!date || !time || !title || !description) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 },
      );
    }

    let finalImageUrl = image_url || "";
    if (finalImageUrl && !generate_image) {
      const validation = validateAndTransformImageUrl(finalImageUrl);
      if (!validation.isValid) {
        return NextResponse.json(
          { message: validation.reason },
          { status: 400 },
        );
      }

      const isAccessible = await checkImageAccessible(validation.finalUrl);
      if (!isAccessible) {
        return NextResponse.json(
          { message: "This image URL is not publicly accessible." },
          { status: 400 },
        );
      }

      finalImageUrl = validation.finalUrl;
    }

    const db = await getDb();

    // Critical Logic: Enforce 3-day rolling quota limit
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const postCount = await db
      .collection<PostDocument>("posts")
      .countDocuments({
        user_id: new ObjectId(session.userId),
        created_at: { $gte: threeDaysAgo },
      });

    if (postCount >= 3) {
      return NextResponse.json(
        {
          message:
            "You have reached your limit of 3 posts per 72 hours. Please wait until your quota resets.",
        },
        { status: 403 },
      );
    }

    const newPost: PostDocument = {
      user_id: new ObjectId(session.userId),
      date,
      time,
      title,
      description,
      image_url: finalImageUrl,
      generate_image: generate_image || false,
      prompt: prompt || "",
      status: "pending",
      created_at: new Date(),
      updated_at: new Date(),
    };

    const result = await db
      .collection<PostDocument>("posts")
      .insertOne(newPost);

    return NextResponse.json({
      success: true,
      post: { ...newPost, _id: result.insertedId },
    });
  } catch (error) {
    console.error("Create post error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
