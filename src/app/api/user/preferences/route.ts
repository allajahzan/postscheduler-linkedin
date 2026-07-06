import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function PATCH(request: Request) {
  try {
    const session = await getSession();

    if (!session || !session.userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { suggestions_enabled, topics } = body;

    // Validate
    if (typeof suggestions_enabled !== "boolean" || !Array.isArray(topics)) {
      return NextResponse.json(
        { message: "Invalid payload format" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(session.userId) },
      {
        $set: {
          "preferences.suggestions_enabled": suggestions_enabled,
          "preferences.topics": topics,
        },
      }
    );

    return NextResponse.json({
      message: "Preferences updated successfully",
      success: true,
    });
  } catch (error) {
    console.error("Update preferences error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
