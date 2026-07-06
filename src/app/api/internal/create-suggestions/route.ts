import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { SuggestionTopic } from "@/types";

interface IncomingSuggestionTopic {
  topic: string;
  suggestions: {
    title: string;
    description: string;
    style_prompt?: string;
    based_on?: string;
  }[];
  suggestion_count?: number;
  generated_at?: string;
  valid_until?: string;
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("x-internal-secret");

    if (
      !process.env.INTERNAL_API_SECRET ||
      authHeader !== process.env.INTERNAL_API_SECRET
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);

    if (!body || !Array.isArray(body)) {
      return NextResponse.json(
        { error: "Request body must be an array of topic objects" },
        { status: 400 },
      );
    }

    const incomingTopics: IncomingSuggestionTopic[] = body;

    if (incomingTopics.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No topics provided",
      });
    }

    const db = await getDb();
    const documentsToInsert: SuggestionTopic[] = [];

    for (const item of incomingTopics) {
      if (!item.topic || !Array.isArray(item.suggestions)) {
        continue; // Skip invalid entries
      }

      // Default to now and 3 days from now if not provided
      const generatedAt = item.generated_at
        ? new Date(item.generated_at)
        : new Date();
      const validUntil = item.valid_until
        ? new Date(item.valid_until)
        : new Date(generatedAt.getTime() + 3 * 24 * 60 * 60 * 1000);

      documentsToInsert.push({
        topic: item.topic,
        suggestions: item.suggestions.filter((s) => s.title && s.description), // ensure nested valid
        generated_at: generatedAt,
        valid_until: validUntil,
      });
    }

    if (documentsToInsert.length === 0) {
      return NextResponse.json(
        { error: "No valid suggestion topics found to insert" },
        { status: 400 },
      );
    }

    const result = await db
      .collection("suggestions")
      .insertMany(documentsToInsert);

    return NextResponse.json({
      success: true,
      insertedCount: result.insertedCount,
      topicsInserted: documentsToInsert.map((d) => d.topic),
    });
  } catch (error) {
    console.error("Create suggestions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
