import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { embedWorkspaceFeedback } from "@/services/embedding-service";

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

    const success = await embedWorkspaceFeedback(
      feedback.workspaceId,
      feedback.id,
    );

    if (!success) {
      throw new Error("Embedding generation failed");
    }

    console.log("EMBEDDING STORED:", feedback.id);

    return NextResponse.json({
      success: true,
      feedbackId: feedback.id,
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