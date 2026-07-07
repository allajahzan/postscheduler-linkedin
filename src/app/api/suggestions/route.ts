import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { SuggestionTopic, UserDocument } from "@/types";

export async function GET(request: Request) {
  try {
    const session = await getSession();

    if (!session || !session.userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const user = await db
      .collection<UserDocument>("users")
      .findOne({ _id: new ObjectId(session.userId) });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "8");
    const filterTopic = searchParams.get("topic");
    const skip = (page - 1) * limit;

    const topics = user.preferences?.topics || [];

    // If no topics are selected, return empty instantly
    if (topics.length === 0) {
      return NextResponse.json({
        suggestions: [],
        pagination: { total: 0, page, limit, totalPages: 0 },
      });
    }

    const query: any = {
      valid_until: { $gt: new Date() }, // Ensure we don't fetch expired ones if TTL hasn't run yet
    };

    if (filterTopic && topics.includes(filterTopic)) {
      query.topic = filterTopic;
    } else {
      query.topic = { $in: topics };
    }

    const topicDocs = await db
      .collection<SuggestionTopic>("suggestions")
      .find(query)
      .sort({ generated_at: -1 })
      .toArray();

    // Flatten all suggestions
    let allSuggestions: any[] = [];
    for (const doc of topicDocs) {
      for (const [index, sug] of doc.suggestions.entries()) {
        allSuggestions.push({
          _id: `${doc._id}_${index}`,
          topic: doc.topic,
          title: sug.title,
          description: sug.description,
          style_prompt: sug.style_prompt,
          generated_at: doc.generated_at,
          valid_until: doc.valid_until,
        });
      }
    }

    const total = allSuggestions.length;
    const paginatedSuggestions = allSuggestions.slice(skip, skip + limit);

    return NextResponse.json({
      suggestions: paginatedSuggestions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Fetch suggestions error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
