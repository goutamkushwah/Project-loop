import {
  ClassificationStatus,
  type Prisma,
} from "@prisma/client";

import { db } from "../lib/db";
import { classifyWorkspaceFeedbackBatch } from "../services/feedback-classification-service";
import type { FeedbackClassificationBatchSummary } from "../types/feedback-classification";

const DEFAULT_WORKSPACE_SLUG = "acme-cloud";
const FETCH_BATCH_SIZE = 500;

type BackfillOptions = {
  workspaceSlug: string;
  limit: number | null;
  includeCompleted: boolean;
};

type FeedbackCursorRecord = Prisma.FeedbackGetPayload<{
  select: {
    id: true;
    createdAt: true;
  };
}>;

function parsePositiveInteger(value: string, flag: string): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${flag} must be a positive integer.`);
  }

  return parsed;
}

function parseOptions(argv: readonly string[]): BackfillOptions {
  let workspaceSlug = DEFAULT_WORKSPACE_SLUG;
  let limit: number | null = null;
  let includeCompleted = false;

  for (const argument of argv) {
    if (argument.startsWith("--workspace=")) {
      const value = argument.slice("--workspace=".length).trim();

      if (!value) {
        throw new Error("--workspace must contain a workspace slug.");
      }

      workspaceSlug = value;
      continue;
    }

    if (argument.startsWith("--limit=")) {
      limit = parsePositiveInteger(
        argument.slice("--limit=".length),
        "--limit",
      );
      continue;
    }

    if (argument === "--include-completed") {
      includeCompleted = true;
      continue;
    }

    throw new Error(`Unknown backfill argument: ${argument}`);
  }

  return {
    workspaceSlug,
    limit,
    includeCompleted,
  };
}

function emptySummary(): FeedbackClassificationBatchSummary {
  return {
    requestedRows: 0,
    claimedRows: 0,
    completedRows: 0,
    reviewRequiredRows: 0,
    failedRows: 0,
    skippedRows: 0,
  };
}

function addSummary(
  total: FeedbackClassificationBatchSummary,
  next: FeedbackClassificationBatchSummary,
): FeedbackClassificationBatchSummary {
  return {
    requestedRows: total.requestedRows + next.requestedRows,
    claimedRows: total.claimedRows + next.claimedRows,
    completedRows: total.completedRows + next.completedRows,
    reviewRequiredRows:
      total.reviewRequiredRows + next.reviewRequiredRows,
    failedRows: total.failedRows + next.failedRows,
    skippedRows: total.skippedRows + next.skippedRows,
  };
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));

  const workspace = await db.workspace.findUnique({
    where: {
      slug: options.workspaceSlug,
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  if (!workspace) {
    throw new Error(
      `Workspace "${options.workspaceSlug}" was not found.`,
    );
  }

  const eligibleStatuses = options.includeCompleted
    ? [
        ClassificationStatus.PENDING,
        ClassificationStatus.FAILED,
        ClassificationStatus.REVIEW_REQUIRED,
        ClassificationStatus.COMPLETED,
      ]
    : [
        ClassificationStatus.PENDING,
        ClassificationStatus.FAILED,
        ClassificationStatus.REVIEW_REQUIRED,
      ];

  const totalEligible = await db.feedback.count({
    where: {
      workspaceId: workspace.id,
      classificationStatus: {
        in: eligibleStatuses,
      },
    },
  });

  const targetCount = options.limit
    ? Math.min(totalEligible, options.limit)
    : totalEligible;

  console.info(
    `LOOP classification backfill: ${workspace.name} (${workspace.slug})`,
  );
  console.info(`Eligible feedback: ${totalEligible}`);
  console.info(`Target feedback: ${targetCount}`);

  if (targetCount === 0) {
    console.info("No feedback requires classification.");
    return;
  }

  let processed = 0;
  let summary = emptySummary();

  let cursorCreatedAt: Date | null = null;
  let cursorId: string | null = null;

  while (processed < targetCount) {
    const remaining = targetCount - processed;
    const take = Math.min(FETCH_BATCH_SIZE, remaining);

    const feedback: FeedbackCursorRecord[] =
      await db.feedback.findMany({
        where: {
          workspaceId: workspace.id,
          classificationStatus: {
            in: eligibleStatuses,
          },
          ...(cursorCreatedAt && cursorId
            ? {
                OR: [
                  {
                    createdAt: {
                      gt: cursorCreatedAt,
                    },
                  },
                  {
                    createdAt: cursorCreatedAt,
                    id: {
                      gt: cursorId,
                    },
                  },
                ],
              }
            : {}),
        },
        select: {
          id: true,
          createdAt: true,
        },
        orderBy: [
          { createdAt: "asc" },
          { id: "asc" },
        ],
        take,
      });

    if (feedback.length === 0) {
      break;
    }

    const lastFeedback: FeedbackCursorRecord =
      feedback[feedback.length - 1]!;

    cursorCreatedAt = lastFeedback.createdAt;
    cursorId = lastFeedback.id;

    const batchSummary =
      await classifyWorkspaceFeedbackBatch(
        workspace.id,
        feedback.map(
          (item: FeedbackCursorRecord) => item.id,
        ),
      );

    summary = addSummary(summary, batchSummary);
    processed += feedback.length;

    console.info(
      `Processed ${processed}/${targetCount}: ${batchSummary.completedRows} completed, ${batchSummary.reviewRequiredRows} review required, ${batchSummary.failedRows} failed, ${batchSummary.skippedRows} skipped.`,
    );
  }

  console.info("Classification backfill complete.");
  console.info(JSON.stringify(summary, null, 2));

  if (
    summary.reviewRequiredRows > 0 ||
    summary.failedRows > 0
  ) {
    process.exitCode = 1;
  }
}

main()
  .catch((error: unknown) => {
    console.error(
      "LOOP classification backfill failed.",
      error instanceof Error
        ? error.message
        : error,
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });