//import "server-only";

import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import {
  embedFeedbackDocuments,
  EmbeddingProviderError,
} from "@/lib/embedding";
import {
  GEMINI_EMBEDDING_DIMENSIONS,
  GEMINI_EMBEDDING_MODEL,
} from "@/lib/gemini";
import type {
  FeedbackEmbeddingBatchSummary,
  WorkspaceEmbeddingCoverage,
} from "@/types/embedding";

const EMBEDDING_PROVIDER = "GOOGLE_GEMINI" as const;

// ↓ Reduced from 32 to 8
const EMBEDDING_BATCH_SIZE = 8;

// Retry configuration
const MAX_EMBEDDING_RETRIES = 4;
const BASE_DELAY_MS = 2000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function embedWithRetry(
  contents: readonly string[],
): Promise<number[][]> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_EMBEDDING_RETRIES; attempt++) {
    try {
      return await embedFeedbackDocuments(contents);
    } catch (error) {
      lastError = error;

      if (
        !(error instanceof EmbeddingProviderError) ||
        !error.retryable ||
        attempt === MAX_EMBEDDING_RETRIES
      ) {
        throw error;
      }

      const delay = Math.min(
        BASE_DELAY_MS * Math.pow(2, attempt),
        30000,
      );

      console.warn(
        `Gemini rate limited. Retrying in ${delay / 1000}s... (${attempt + 1}/${MAX_EMBEDDING_RETRIES})`,
      );

      await sleep(delay);
    }
  }

  throw lastError;
}

function vectorLiteral(values: readonly number[]): string {
  return `[${values.join(",")}]`;
}

async function persistEmbeddingBatch(
  workspaceId: string,
  rows: readonly { feedbackId: string; vector: readonly number[] }[],
): Promise<void> {
  if (rows.length === 0) return;

  const values = rows.map((row) => Prisma.sql`(
    gen_random_uuid(),
    CAST(${row.feedbackId} AS uuid),
    CAST(${workspaceId} AS uuid),
    CAST(${vectorLiteral(row.vector)} AS vector(768)),
    ${EMBEDDING_PROVIDER},
    ${GEMINI_EMBEDDING_MODEL},
    ${GEMINI_EMBEDDING_DIMENSIONS},
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )`);

  await db.$executeRaw(Prisma.sql`
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
    VALUES ${Prisma.join(values)}
    ON CONFLICT ("feedbackId") DO UPDATE SET
      "vector" = EXCLUDED."vector",
      "provider" = EXCLUDED."provider",
      "model" = EXCLUDED."model",
      "dimensions" = EXCLUDED."dimensions",
      "updatedAt" = CURRENT_TIMESTAMP
    WHERE "Embedding"."workspaceId" = EXCLUDED."workspaceId"
  `);
}

export async function embedWorkspaceFeedbackBatch(
  workspaceId: string,
  feedbackIds: readonly string[],
): Promise<FeedbackEmbeddingBatchSummary> {
  const requestedIds = Array.from(new Set(feedbackIds));

  if (requestedIds.length === 0) {
    return {
      requestedRows: 0,
      completedRows: 0,
      failedRows: 0,
      provider: EMBEDDING_PROVIDER,
      model: GEMINI_EMBEDDING_MODEL,
      dimensions: GEMINI_EMBEDDING_DIMENSIONS,
    };
  }

  const feedback = await db.feedback.findMany({
    where: {
      workspaceId,
      id: {
        in: requestedIds,
      },
    },
    select: {
      id: true,
      content: true,
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });

  let completedRows = 0;

  for (
    let index = 0;
    index < feedback.length;
    index += EMBEDDING_BATCH_SIZE
  ) {
    const batch = feedback.slice(
      index,
      index + EMBEDDING_BATCH_SIZE,
    );

    try {
      console.info(
        `Embedding batch ${Math.floor(index / EMBEDDING_BATCH_SIZE) + 1} (${batch.length} records)...`,
      );

      const vectors = await embedWithRetry(
        batch.map((item) => item.content),
      );

      await persistEmbeddingBatch(
        workspaceId,
        batch.map((item, i) => ({
          feedbackId: item.id,
          vector: vectors[i],
        })),
      );

      completedRows += batch.length;

      console.info(
        `✓ Completed ${completedRows}/${requestedIds.length}`,
      );

      // Small pause between successful batches
      await sleep(1000);
    } catch (error) {
      console.error("Feedback embedding batch failed.", {
        workspaceId,
        feedbackIds: batch.map((item) => item.id),
        error,
      });
    }
  }

  return {
    requestedRows: requestedIds.length,
    completedRows,
    failedRows: requestedIds.length - completedRows,
    provider: EMBEDDING_PROVIDER,
    model: GEMINI_EMBEDDING_MODEL,
    dimensions: GEMINI_EMBEDDING_DIMENSIONS,
  };
}

export async function embedWorkspaceFeedback(
  workspaceId: string,
  feedbackId: string,
): Promise<boolean> {
  const summary = await embedWorkspaceFeedbackBatch(workspaceId, [
    feedbackId,
  ]);
  return summary.completedRows === 1;
}

type CoverageRow = {
  totalFeedback: bigint;
  embeddedFeedback: bigint;
};

export async function getWorkspaceEmbeddingCoverage(
  workspaceId: string,
): Promise<WorkspaceEmbeddingCoverage> {
  const rows = await db.$queryRaw<CoverageRow[]>(Prisma.sql`
    SELECT
      COUNT(f."id")::bigint AS "totalFeedback",
      COUNT(e."id") FILTER (
        WHERE e."provider" = ${EMBEDDING_PROVIDER}
          AND e."model" = ${GEMINI_EMBEDDING_MODEL}
          AND e."dimensions" = ${GEMINI_EMBEDDING_DIMENSIONS}
      )::bigint AS "embeddedFeedback"
    FROM "Feedback" AS f
    LEFT JOIN "Embedding" AS e
      ON e."feedbackId" = f."id"
      AND e."workspaceId" = f."workspaceId"
    WHERE f."workspaceId" = CAST(${workspaceId} AS uuid)
  `);

  const totalFeedback = Number(rows[0]?.totalFeedback ?? 0n);
  const embeddedFeedback = Number(
    rows[0]?.embeddedFeedback ?? 0n,
  );

  return {
    totalFeedback,
    embeddedFeedback,
    missingFeedback: Math.max(
      0,
      totalFeedback - embeddedFeedback,
    ),
    coveragePercentage:
      totalFeedback === 0
        ? 0
        : Number(
            (
              (embeddedFeedback / totalFeedback) *
              100
            ).toFixed(1),
          ),
    model: GEMINI_EMBEDDING_MODEL,
    dimensions: GEMINI_EMBEDDING_DIMENSIONS,
  };
}

type BackfillCandidateRow = {
  id: string;
};

export async function listWorkspaceEmbeddingBackfillCandidates(
  workspaceId: string,
  limit: number,
): Promise<string[]> {
  const rows = await db.$queryRaw<BackfillCandidateRow[]>(Prisma.sql`
    SELECT f."id"
    FROM "Feedback" AS f
    LEFT JOIN "Embedding" AS e
      ON e."feedbackId" = f."id"
      AND e."workspaceId" = f."workspaceId"
    WHERE f."workspaceId" = CAST(${workspaceId} AS uuid)
      AND (
        e."id" IS NULL
        OR e."provider" <> ${EMBEDDING_PROVIDER}
        OR e."model" <> ${GEMINI_EMBEDDING_MODEL}
        OR e."dimensions" <> ${GEMINI_EMBEDDING_DIMENSIONS}
      )
    ORDER BY f."createdAt" ASC, f."id" ASC
    LIMIT ${limit}
  `);

  return rows.map((row) => row.id);
}