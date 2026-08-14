import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { embedFeedback } from "@/services/embedding-service";

type RouteContext = {
  params: Promise<{
    feedbackId: string;
  }>;
};

export async function POST(
  _request: Request,
  context: RouteContext,
) {
  const { feedbackId } = await context.params;

  try {
    console.log("EMBED START:", feedbackId);

    const feedback = await db.feedback.findUnique({
      where: {
        id: feedbackId,
      },
    });

    if (!feedback) {
      console.log("FEEDBACK NOT FOUND:", feedbackId);

      return NextResponse.json(
        {
          success: false,
          error: "Feedback not found",
        },
        { status: 404 },
      );
    }

    const embedding = await embedFeedback(feedback.content);

    console.log(
      "EMBEDDING GENERATED:",
      feedback.id,
      embedding.length,
    );

    const vectorLiteral = `[${embedding.join(",")}]`;

    await db.$executeRaw`
      INSERT INTO "Embedding" (
        "id",
        "feedbackId",
        "workspaceId",
        "vector",
        "provider",
        "model",
        "dimensions",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        gen_random_uuid(),
        ${feedback.id}::uuid,
        ${feedback.workspaceId}::uuid,
        ${vectorLiteral}::vector,
        'google',
        'gemini-embedding-001',
        ${embedding.length},
        NOW(),
        NOW()
      )
      ON CONFLICT ("feedbackId")
      DO UPDATE SET
        "vector" = EXCLUDED."vector",
        "provider" = EXCLUDED."provider",
        "model" = EXCLUDED."model",
        "dimensions" = EXCLUDED."dimensions",
        "updatedAt" = NOW()
    `;

    console.log(
      "EMBEDDING STORED:",
      feedback.id,
      embedding.length,
    );

    return NextResponse.json({
      success: true,
      feedbackId: feedback.id,
      dimensions: embedding.length,
    });
  } catch (error) {
    console.error("EMBEDDING FAILED:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unknown embedding error";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      {
        status: 500,
      },
    );
  }
}