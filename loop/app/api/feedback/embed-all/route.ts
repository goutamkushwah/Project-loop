import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { embedFeedback } from "@/services/embedding-service";

const BATCH_SIZE = 20;

export async function POST() {
  try {
    console.log("EMBED-ALL START");

    const pending = await db.feedback.findMany({
      where: {
        embedding: null,
      },
    });

    console.log("EMBED-ALL PENDING COUNT:", pending.length);

    let succeeded = 0;
    let failed = 0;
    const errors: { feedbackId: string; error: string }[] = [];

    for (let i = 0; i < pending.length; i += BATCH_SIZE) {
      const batch = pending.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (feedback) => {
          try {
            await embedFeedback(feedback.content);

            succeeded += 1;
          } catch (error) {
            failed += 1;

            const message =
              error instanceof Error
                ? error.message
                : "Unknown embedding error";

            console.error(
              "EMBED-ALL ITEM FAILED:",
              feedback.id,
              message,
            );

            errors.push({
              feedbackId: feedback.id,
              error: message,
            });
          }
        }),
      );
    }

    console.log("EMBED-ALL DONE:", {
      total: pending.length,
      succeeded,
      failed,
    });

    return NextResponse.json({
      success: true,
      total: pending.length,
      succeeded,
      failed,
      errors,
    });
  } catch (error) {
    console.error("EMBED-ALL FAILED:", error);

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