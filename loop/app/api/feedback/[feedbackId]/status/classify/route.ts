import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { classifyFeedback } from "@/services/classification-service";
import { assignFeedbackTheme } from "@/services/theme-service";

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
    console.log("CLASSIFY START:", feedbackId);

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

    console.log("FEEDBACK CONTENT:", feedback.content);

    await db.feedback.update({
      where: {
        id: feedbackId,
      },
      data: {
        classificationStatus: "PROCESSING",
        classificationAttempts: {
          increment: 1,
        },
        classificationError: null,
      },
    });

    console.log("CALLING GEMINI...");

    const classification = await classifyFeedback(
      feedback.content,
    );

    console.log("GEMINI RESULT:", classification);

    /*
     * Save sentiment + feature information
     */
    const updatedFeedback =
      await db.feedback.update({
        where: {
          id: feedbackId,
        },
        data: {
          sentiment: classification.sentiment,
          sentimentScore: classification.sentimentScore,
          featureArea: classification.featureArea,
          classificationRationale:
            classification.rationale,
          classificationStatus: "COMPLETED",
          classificationError: null,
          classifiedAt: new Date(),
        },
      });

    console.log(
      "DATABASE UPDATED:",
      updatedFeedback.id,
      updatedFeedback.sentiment,
    );

    /*
     * DAY 13
     *
     * Assign feedback to the AI-generated theme.
     */
    const theme = await assignFeedbackTheme(
      feedback.id,
      feedback.workspaceId,
      classification,
    );

    console.log(
      "THEME ASSIGNED:",
      theme.id,
      theme.name,
      classification.themeConfidence,
    );

    return NextResponse.json({
      success: true,

      classification,

      theme: {
        id: theme.id,
        name: theme.name,
        description: theme.description,
        color: theme.color,
        confidence: classification.themeConfidence,
      },

      feedback: updatedFeedback,
    });
  } catch (error) {
    console.error("CLASSIFICATION FAILED:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unknown classification error";

    try {
      await db.feedback.update({
        where: {
          id: feedbackId,
        },
        data: {
          classificationStatus: "FAILED",
          classificationError: message,
        },
      });
    } catch (dbError) {
      console.error(
        "FAILED TO SAVE CLASSIFICATION ERROR:",
        dbError,
      );
    }

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