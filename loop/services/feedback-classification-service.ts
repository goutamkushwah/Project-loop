import "server-only";

import { ClassificationStatus, Prisma } from "@prisma/client";

import { AiProviderError, classifyFeedback, classifyFeedbackBatch } from "@/lib/ai";
import { AI_CLASSIFICATION_BATCH_SIZE } from "@/lib/ai-schemas";
import { db } from "@/lib/db";
import { GEMINI_CLASSIFICATION_MODEL } from "@/lib/gemini";
import {
  normalizeThemeName,
  themeColorForName,
  themeDescriptionForName,
} from "@/lib/theme-presentation";
import type { FeedbackClassification } from "@/types/ai";
import type { ApiErrorCode } from "@/types/api";
import type {
  FeedbackClassificationBatchSummary,
  FeedbackClassificationRunResult,
} from "@/types/feedback-classification";

const CLASSIFICATION_STALE_AFTER_MS = 15 * 60 * 1_000;
const BATCH_CONCURRENCY = 3;
const PROVIDER = "GOOGLE_GEMINI" as const;

export class FeedbackClassificationServiceError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "FeedbackClassificationServiceError";
  }
}

type ClaimedFeedback = {
  id: string;
  content: string;
  hasStoredClassification: boolean;
};

type PersistableClassification = FeedbackClassification & {
  feedbackId: string;
};

type BatchProcessResult = {
  completedRows: number;
  reviewRequiredRows: number;
  failedRows: number;
  discoveredThemeNames: string[];
};

function chunk<T>(items: readonly T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function roundDatabaseScore(value: number): number {
  return Number(value.toFixed(3));
}

async function listWorkspaceThemeNames(workspaceId: string): Promise<string[]> {
  const themes = await db.theme.findMany({
    where: {
      workspaceId,
    },
    select: {
      name: true,
    },
    orderBy: [{ name: "asc" }, { id: "asc" }],
  });

  return themes.map((theme) => theme.name);
}

async function claimFeedbackForClassification(
  workspaceId: string,
  feedbackIds: readonly string[],
): Promise<ClaimedFeedback[]> {
  if (feedbackIds.length === 0) {
    return [];
  }

  const staleBefore = new Date(Date.now() - CLASSIFICATION_STALE_AFTER_MS);
  const idSql = Prisma.join(
    feedbackIds.map((feedbackId) => Prisma.sql`CAST(${feedbackId} AS uuid)`),
  );

  return db.$queryRaw<ClaimedFeedback[]>(Prisma.sql`
    UPDATE "Feedback"
    SET
      "classificationStatus" = 'PROCESSING'::"ClassificationStatus",
      "classificationAttempts" = 0,
      "classificationError" = NULL,
      "updatedAt" = CURRENT_TIMESTAMP
    WHERE "workspaceId" = CAST(${workspaceId} AS uuid)
      AND "id" IN (${idSql})
      AND (
        "classificationStatus" <> 'PROCESSING'::"ClassificationStatus"
        OR "updatedAt" < ${staleBefore}
      )
    RETURNING
      "id",
      "content",
      (
        "classifiedAt" IS NOT NULL
        AND "sentiment" IS NOT NULL
        AND "sentimentScore" IS NOT NULL
      ) AS "hasStoredClassification"
  `);
}

async function markClassificationFailureState(
  workspaceId: string,
  feedback: readonly ClaimedFeedback[],
  status: "FAILED" | "REVIEW_REQUIRED",
  attempts: number,
  message: string,
): Promise<void> {
  if (feedback.length === 0) {
    return;
  }

  const feedbackWithStoredClassification = feedback
    .filter((item) => item.hasStoredClassification)
    .map((item) => item.id);
  const feedbackWithoutStoredClassification = feedback
    .filter((item) => !item.hasStoredClassification)
    .map((item) => item.id);

  await db.$transaction([
    db.feedback.updateMany({
      where: {
        workspaceId,
        id: {
          in: feedbackWithoutStoredClassification,
        },
        classificationStatus: ClassificationStatus.PROCESSING,
      },
      data: {
        classificationStatus: status,
        classificationAttempts: attempts,
        classificationError: message,
      },
    }),
    db.feedback.updateMany({
      where: {
        workspaceId,
        id: {
          in: feedbackWithStoredClassification,
        },
        classificationStatus: ClassificationStatus.PROCESSING,
      },
      data: {
        classificationStatus: ClassificationStatus.COMPLETED,
        classificationAttempts: attempts,
        classificationError: message,
      },
    }),
  ]);
}

async function persistSuccessfulClassifications(
  workspaceId: string,
  classifications: readonly PersistableClassification[],
  attempts: number,
): Promise<void> {
  if (classifications.length === 0) {
    return;
  }

  await db.$transaction(async (transaction) => {
    // Serialize theme creation per workspace so parallel AI batches cannot create
    // case-variant duplicates before either transaction can observe the other.
    await transaction.$queryRaw(Prisma.sql`
      SELECT pg_advisory_xact_lock(hashtext(${workspaceId}))
    `);

    const existingThemes = await transaction.theme.findMany({
      where: {
        workspaceId,
      },
      select: {
        id: true,
        name: true,
      },
    });
    const themeByNormalizedName = new Map(
      existingThemes.map((theme) => [normalizeThemeName(theme.name), theme]),
    );
    const missingThemeByNormalizedName = new Map<string, string>();

    classifications.forEach((classification) => {
      classification.themes.forEach((theme) => {
        const normalizedName = normalizeThemeName(theme.name);

        if (
          !themeByNormalizedName.has(normalizedName) &&
          !missingThemeByNormalizedName.has(normalizedName)
        ) {
          missingThemeByNormalizedName.set(normalizedName, theme.name.trim().replace(/\s+/g, " "));
        }
      });
    });

    if (missingThemeByNormalizedName.size > 0) {
      await transaction.theme.createMany({
        data: Array.from(missingThemeByNormalizedName.values()).map((name) => ({
          workspaceId,
          name,
          description: themeDescriptionForName(name),
          color: themeColorForName(name),
        })),
        skipDuplicates: true,
      });
    }

    const resolvedThemes = await transaction.theme.findMany({
      where: {
        workspaceId,
      },
      select: {
        id: true,
        name: true,
      },
    });
    const resolvedThemeByNormalizedName = new Map(
      resolvedThemes.map((theme) => [normalizeThemeName(theme.name), theme]),
    );
    const feedbackIds = classifications.map((classification) => classification.feedbackId);

    await transaction.feedbackTheme.deleteMany({
      where: {
        workspaceId,
        feedbackId: {
          in: feedbackIds,
        },
      },
    });

    const classifiedAt = new Date();

    for (const classification of classifications) {
      const updated = await transaction.feedback.updateMany({
        where: {
          id: classification.feedbackId,
          workspaceId,
          classificationStatus: ClassificationStatus.PROCESSING,
        },
        data: {
          sentiment: classification.sentiment,
          sentimentScore: roundDatabaseScore(classification.sentimentScore),
          featureArea: classification.featureArea.trim(),
          classificationRationale: classification.rationale.trim(),
          classificationStatus: ClassificationStatus.COMPLETED,
          classificationAttempts: attempts,
          classificationError: null,
          classifiedAt,
        },
      });

      if (updated.count !== 1) {
        throw new Error(
          `Feedback ${classification.feedbackId} could not be finalized because its classification state changed.`,
        );
      }
    }

    const assignments = classifications.flatMap((classification) =>
      classification.themes.map((theme) => {
        const resolvedTheme = resolvedThemeByNormalizedName.get(normalizeThemeName(theme.name));

        if (!resolvedTheme) {
          throw new Error(`Theme ${theme.name} could not be resolved inside the workspace.`);
        }

        return {
          workspaceId,
          feedbackId: classification.feedbackId,
          themeId: resolvedTheme.id,
          confidence: roundDatabaseScore(theme.confidence),
        };
      }),
    );

    if (assignments.length > 0) {
      await transaction.feedbackTheme.createMany({
        data: assignments,
        skipDuplicates: true,
      });
    }
  });
}

function toPersistableClassification(
  feedbackId: string,
  classification: FeedbackClassification,
): PersistableClassification {
  return {
    feedbackId,
    ...classification,
  };
}

async function processClaimedBatch(
  workspaceId: string,
  batch: readonly ClaimedFeedback[],
  existingThemeNames: readonly string[],
): Promise<BatchProcessResult> {
  const feedbackIds = batch.map((feedback) => feedback.id);
  let attempts = 0;

  try {
    const result = await classifyFeedbackBatch({
      items: batch.map((feedback) => ({
        feedbackId: feedback.id,
        content: feedback.content,
      })),
      existingThemeNames,
    });
    attempts = result.attempts;

    if (!result.ok) {
      await markClassificationFailureState(
        workspaceId,
        batch,
        "REVIEW_REQUIRED",
        result.attempts,
        "Gemini returned output that could not be validated after one retry. Manual review is required.",
      );

      return {
        completedRows: 0,
        reviewRequiredRows: batch.length,
        failedRows: 0,
        discoveredThemeNames: [],
      };
    }

    await persistSuccessfulClassifications(
      workspaceId,
      result.classifications,
      result.attempts,
    );

    return {
      completedRows: result.classifications.length,
      reviewRequiredRows: 0,
      failedRows: 0,
      discoveredThemeNames: result.classifications.flatMap((classification) =>
        classification.themes.map((theme) => theme.name),
      ),
    };
  } catch (error: unknown) {
    const providerError = error instanceof AiProviderError ? error : null;
    const message = providerError
      ? providerError.message
      : "The classification result could not be processed safely.";
    attempts = providerError?.attempts ?? attempts;

    console.error("Feedback batch classification failed.", {
      workspaceId,
      feedbackIds,
      error,
    });

    await markClassificationFailureState(workspaceId, batch, "FAILED", attempts, message);

    return {
      completedRows: 0,
      reviewRequiredRows: 0,
      failedRows: batch.length,
      discoveredThemeNames: [],
    };
  }
}

export async function classifyWorkspaceFeedbackBatch(
  workspaceId: string,
  feedbackIds: readonly string[],
): Promise<FeedbackClassificationBatchSummary> {
  const uniqueFeedbackIds = Array.from(new Set(feedbackIds));
  const claimedFeedback = await claimFeedbackForClassification(workspaceId, uniqueFeedbackIds);
  const batches = chunk(claimedFeedback, AI_CLASSIFICATION_BATCH_SIZE);
  const themeNameSet = new Map<string, string>();

  (await listWorkspaceThemeNames(workspaceId)).forEach((name) => {
    themeNameSet.set(normalizeThemeName(name), name);
  });

  let completedRows = 0;
  let reviewRequiredRows = 0;
  let failedRows = 0;

  for (let index = 0; index < batches.length; index += BATCH_CONCURRENCY) {
    const wave = batches.slice(index, index + BATCH_CONCURRENCY);
    const themeNamesForWave = Array.from(themeNameSet.values());
    const results = await Promise.all(
      wave.map((batch) => processClaimedBatch(workspaceId, batch, themeNamesForWave)),
    );

    results.forEach((result) => {
      completedRows += result.completedRows;
      reviewRequiredRows += result.reviewRequiredRows;
      failedRows += result.failedRows;
      result.discoveredThemeNames.forEach((name) => {
        const normalizedName = normalizeThemeName(name);

        if (!themeNameSet.has(normalizedName)) {
          themeNameSet.set(normalizedName, name.trim().replace(/\s+/g, " "));
        }
      });
    });
  }

  return {
    requestedRows: uniqueFeedbackIds.length,
    claimedRows: claimedFeedback.length,
    completedRows,
    reviewRequiredRows,
    failedRows,
    skippedRows: uniqueFeedbackIds.length - claimedFeedback.length,
  };
}

export async function classifyWorkspaceFeedback(
  workspaceId: string,
  feedbackId: string,
): Promise<FeedbackClassificationRunResult> {
  const claimed = await claimFeedbackForClassification(workspaceId, [feedbackId]);

  if (claimed.length === 0) {
    const existing = await db.feedback.findFirst({
      where: {
        id: feedbackId,
        workspaceId,
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      throw new FeedbackClassificationServiceError(
        "FEEDBACK_NOT_FOUND",
        "The requested feedback item was not found in this workspace.",
        404,
      );
    }

    throw new FeedbackClassificationServiceError(
      "FEEDBACK_CLASSIFICATION_IN_PROGRESS",
      "This feedback item is already being classified. Wait for the current run to finish and try again if needed.",
      409,
    );
  }

  const [feedback] = claimed;
  const existingThemeNames = await listWorkspaceThemeNames(workspaceId);
  let attempts = 0;

  try {
    const result = await classifyFeedback({
      content: feedback.content,
      existingThemeNames,
    });
    attempts = result.attempts;

    if (!result.ok) {
      const message =
        "Gemini returned output that could not be validated after one retry. Manual review is required.";

      await markClassificationFailureState(
        workspaceId,
        claimed,
        "REVIEW_REQUIRED",
        result.attempts,
        message,
      );

      return {
        feedbackId,
        status: "REVIEW_REQUIRED",
        attempts: result.attempts,
        provider: result.provider,
        model: result.model,
        message,
      };
    }

    await persistSuccessfulClassifications(
      workspaceId,
      [toPersistableClassification(feedbackId, result.classification)],
      result.attempts,
    );

    return {
      feedbackId,
      status: "COMPLETED",
      attempts: result.attempts,
      provider: result.provider,
      model: result.model,
      message: null,
    };
  } catch (error: unknown) {
    const providerError = error instanceof AiProviderError ? error : null;
    const message = providerError
      ? providerError.message
      : "The classification result could not be processed safely.";
    attempts = providerError?.attempts ?? attempts;

    console.error("Feedback classification failed.", {
      workspaceId,
      feedbackId,
      error,
    });

    await markClassificationFailureState(workspaceId, claimed, "FAILED", attempts, message);

    return {
      feedbackId,
      status: "FAILED",
      attempts,
      provider: PROVIDER,
      model: GEMINI_CLASSIFICATION_MODEL,
      message,
    };
  }
}