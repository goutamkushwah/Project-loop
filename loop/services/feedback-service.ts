//import "server-only";

import { FeedbackStatus, Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { classifyWorkspaceFeedback } from "@/services/feedback-classification-service";
import { embedWorkspaceFeedback } from "@/services/embedding-service";
import type {
  FeedbackCreateInput,
  FeedbackListQuery,
  FeedbackStatusUpdateInput,
} from "@/lib/feedback-validation";
import type { ApiErrorCode, ApiFieldErrors } from "@/types/api";
import type {
  FeedbackListItem,
  FeedbackPage,
  FeedbackStatusUpdateResult,
  FeedbackStatusValue,
  FeedbackThemeOption,
} from "@/types/feedback";

export class FeedbackServiceError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly status: number,
    public readonly fieldErrors?: ApiFieldErrors,
  ) {
    super(message);
    this.name = "FeedbackServiceError";
  }
}

const feedbackSelect = Prisma.validator<Prisma.FeedbackSelect>()({
  id: true,
  content: true,
  channel: true,
  sourceRef: true,
  customerLabel: true,
  sentiment: true,
  sentimentScore: true,
  featureArea: true,
  classificationRationale: true,
  classificationStatus: true,
  classificationAttempts: true,
  classificationError: true,
  classifiedAt: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  themes: {
    orderBy: [{ confidence: "desc" }, { themeId: "asc" }],
    select: {
      confidence: true,
      theme: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
    },
  },
});

type SelectedFeedback = Prisma.FeedbackGetPayload<{
  select: typeof feedbackSelect;
}>;

type FeedbackCountRow = {
  count: bigint;
};

type FeedbackIdRow = {
  id: string;
};

const NEXT_STATUS: Record<FeedbackStatusValue, FeedbackStatusValue | null> = {
  NEW: "REVIEWED",
  REVIEWED: "ACTIONED",
  ACTIONED: null,
};

function serializeFeedback(feedback: SelectedFeedback): FeedbackListItem {
  return {
    id: feedback.id,
    content: feedback.content,
    channel: feedback.channel,
    sourceRef: feedback.sourceRef,
    customerLabel: feedback.customerLabel,
    sentiment: feedback.sentiment,
    sentimentScore: feedback.sentimentScore?.toNumber() ?? null,
    featureArea: feedback.featureArea,
    themes: feedback.themes.map((assignment) => ({
      id: assignment.theme.id,
      name: assignment.theme.name,
      color: assignment.theme.color,
      confidence: assignment.confidence.toNumber(),
    })),
    classificationRationale: feedback.classificationRationale,
    classificationStatus: feedback.classificationStatus,
    classificationAttempts: feedback.classificationAttempts,
    classificationError: feedback.classificationError,
    classifiedAt: feedback.classifiedAt?.toISOString() ?? null,
    status: feedback.status,
    createdAt: feedback.createdAt.toISOString(),
    updatedAt: feedback.updatedAt.toISOString(),
  };
}

function utcDateStart(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function utcDayAfter(value: string): Date {
  const date = utcDateStart(value);
  date.setUTCDate(date.getUTCDate() + 1);
  return date;
}

function buildFeedbackWhereSql(
  workspaceId: string,
  query: FeedbackListQuery,
): Prisma.Sql {
  let whereSql = Prisma.sql`f."workspaceId" = CAST(${workspaceId} AS uuid)`;

  if (query.search) {
    whereSql = Prisma.sql`${whereSql}
      AND to_tsvector('english', f."content") @@ plainto_tsquery('english', ${query.search})`;
  }

  if (query.channel) {
    whereSql = Prisma.sql`${whereSql}
      AND f."channel" = CAST(${query.channel} AS "FeedbackChannel")`;
  }

  if (query.sentiment) {
    whereSql = Prisma.sql`${whereSql}
      AND f."sentiment" = CAST(${query.sentiment} AS "FeedbackSentiment")`;
  }

  if (query.status) {
    whereSql = Prisma.sql`${whereSql}
      AND f."status" = CAST(${query.status} AS "FeedbackStatus")`;
  }

  if (query.dateFrom) {
    whereSql = Prisma.sql`${whereSql}
      AND f."createdAt" >= ${utcDateStart(query.dateFrom)}`;
  }

  if (query.dateTo) {
    whereSql = Prisma.sql`${whereSql}
      AND f."createdAt" < ${utcDayAfter(query.dateTo)}`;
  }

  if (query.themeId) {
    whereSql = Prisma.sql`${whereSql}
      AND EXISTS (
        SELECT 1
        FROM "FeedbackTheme" AS ft
        WHERE ft."feedbackId" = f."id"
          AND ft."workspaceId" = CAST(${workspaceId} AS uuid)
          AND ft."themeId" = CAST(${query.themeId} AS uuid)
      )`;
  }

  return whereSql;
}

export async function listWorkspaceThemeOptions(
  workspaceId: string,
): Promise<FeedbackThemeOption[]> {
  return db.theme.findMany({
    where: {
      workspaceId,
    },
    select: {
      id: true,
      name: true,
      color: true,
    },
    orderBy: [{ name: "asc" }, { id: "asc" }],
  });
}

export async function listWorkspaceFeedback(
  workspaceId: string,
  query: FeedbackListQuery,
): Promise<FeedbackPage> {
  const whereSql = buildFeedbackWhereSql(workspaceId, query);
  const sortDirection = query.sortOrder === "asc" ? Prisma.sql`ASC` : Prisma.sql`DESC`;

  return db.$transaction(
    async (transaction) => {
      const countRows = await transaction.$queryRaw<FeedbackCountRow[]>(Prisma.sql`
        SELECT COUNT(*)::bigint AS "count"
        FROM "Feedback" AS f
        WHERE ${whereSql}
      `);
      const totalItems = countRows[0] ? Number(countRows[0].count) : 0;
      const totalPages = Math.max(1, Math.ceil(totalItems / query.pageSize));
      const effectivePage = Math.min(query.page, totalPages);
      const skip = (effectivePage - 1) * query.pageSize;

      const idRows =
        totalItems === 0
          ? []
          : await transaction.$queryRaw<FeedbackIdRow[]>(Prisma.sql`
              SELECT f."id"
              FROM "Feedback" AS f
              WHERE ${whereSql}
              ORDER BY f."createdAt" ${sortDirection}, f."id" ASC
              LIMIT ${query.pageSize}
              OFFSET ${skip}
            `);

      const orderedIds = idRows.map((row) => row.id);
      const selectedFeedback =
        orderedIds.length === 0
          ? []
          : await transaction.feedback.findMany({
              where: {
                workspaceId,
                id: {
                  in: orderedIds,
                },
              },
              select: feedbackSelect,
            });
      const feedbackById = new Map(
        selectedFeedback.map((feedback) => [feedback.id, feedback]),
      );
      const feedbackItems = orderedIds.flatMap((id) => {
        const feedback = feedbackById.get(id);
        return feedback ? [feedback] : [];
      });

      return {
        items: feedbackItems.map(serializeFeedback),
        pagination: {
          page: effectivePage,
          pageSize: query.pageSize,
          totalItems,
          totalPages,
        },
        query: {
          search: query.search,
          channel: query.channel ?? null,
          sentiment: query.sentiment ?? null,
          themeId: query.themeId ?? null,
          status: query.status ?? null,
          dateFrom: query.dateFrom ?? null,
          dateTo: query.dateTo ?? null,
          sortOrder: query.sortOrder,
        },
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
    },
  );
}

export async function createWorkspaceFeedback(
  workspaceId: string,
  input: FeedbackCreateInput,
): Promise<FeedbackListItem> {
  try {
    const createdFeedback = await db.feedback.create({
      data: {
        workspaceId,
        content: input.content,
        channel: input.channel,
        customerLabel: input.customerLabel ?? null,
        sourceRef: input.sourceRef ?? null,
        status: "NEW",
        classificationStatus: "PENDING",
        classificationAttempts: 0,
      },
      select: {
        id: true,
      },
    });

    const [, embedded] = await Promise.all([
      classifyWorkspaceFeedback(workspaceId, createdFeedback.id),
      embedWorkspaceFeedback(workspaceId, createdFeedback.id),
    ]);

    if (!embedded) {
      console.error("Feedback embedding failed after ingestion.", {
        workspaceId,
        feedbackId: createdFeedback.id,
      });
    }

    const feedback = await db.feedback.findFirst({
      where: {
        id: createdFeedback.id,
        workspaceId,
      },
      select: feedbackSelect,
    });

    if (!feedback) {
      throw new FeedbackServiceError(
        "FEEDBACK_NOT_FOUND",
        "The feedback item could not be reloaded after classification.",
        404,
      );
    }

    return serializeFeedback(feedback);
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new FeedbackServiceError(
        "FEEDBACK_SOURCE_REF_CONFLICT",
        "A feedback item with this channel and source reference already exists in the workspace.",
        409,
        {
          sourceRef: [
            "Use a different source reference or leave the field blank for manually entered feedback.",
          ],
        },
      );
    }

    throw error;
  }
}

export async function getWorkspaceFeedbackById(
  workspaceId: string,
  feedbackId: string,
): Promise<FeedbackListItem | null> {
  const feedback = await db.feedback.findFirst({
    where: {
      id: feedbackId,
      workspaceId,
    },
    select: feedbackSelect,
  });

  return feedback ? serializeFeedback(feedback) : null;
}

export async function updateWorkspaceFeedbackStatus(
  workspaceId: string,
  feedbackId: string,
  input: FeedbackStatusUpdateInput,
): Promise<FeedbackStatusUpdateResult> {
  const existingFeedback = await db.feedback.findFirst({
    where: {
      id: feedbackId,
      workspaceId,
    },
    select: feedbackSelect,
  });

  if (!existingFeedback) {
    throw new FeedbackServiceError(
      "FEEDBACK_NOT_FOUND",
      "The requested feedback item was not found in this workspace.",
      404,
    );
  }

  if (existingFeedback.status === input.status) {
    return {
      feedback: serializeFeedback(existingFeedback),
      previousStatus: existingFeedback.status,
      changed: false,
    };
  }

  const expectedStatus = NEXT_STATUS[existingFeedback.status];

  if (expectedStatus !== input.status) {
    const expectedMessage = expectedStatus
      ? `The next valid status is ${expectedStatus}.`
      : "Actioned feedback is already at the end of the workflow.";

    throw new FeedbackServiceError(
      "FEEDBACK_STATUS_TRANSITION_INVALID",
      `Feedback must follow NEW → REVIEWED → ACTIONED. ${expectedMessage}`,
      409,
      {
        status: [expectedMessage],
      },
    );
  }

  const updatedCount = await db.feedback.updateMany({
    where: {
      id: feedbackId,
      workspaceId,
      status: existingFeedback.status,
    },
    data: {
      status: input.status as FeedbackStatus,
    },
  });

  if (updatedCount.count !== 1) {
    throw new FeedbackServiceError(
      "FEEDBACK_STATUS_TRANSITION_CONFLICT",
      "This feedback item changed while you were updating it. Refresh the inbox and try again.",
      409,
    );
  }

  const updatedFeedback = await db.feedback.findFirst({
    where: {
      id: feedbackId,
      workspaceId,
    },
    select: feedbackSelect,
  });

  if (!updatedFeedback) {
    throw new FeedbackServiceError(
      "FEEDBACK_NOT_FOUND",
      "The feedback item is no longer available in this workspace.",
      404,
    );
  }

  return {
    feedback: serializeFeedback(updatedFeedback),
    previousStatus: existingFeedback.status,
    changed: true,
  };
}