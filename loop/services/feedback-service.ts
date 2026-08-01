import "server-only";

import { FeedbackStatus, Prisma } from "@prisma/client";

import { db } from "@/lib/db";
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
  classificationStatus: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

type SelectedFeedback = Prisma.FeedbackGetPayload<{
  select: typeof feedbackSelect;
}>;

type FeedbackCountRow = {
  count: bigint;
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
    classificationStatus: feedback.classificationStatus,
    status: feedback.status,
    createdAt: feedback.createdAt.toISOString(),
    updatedAt: feedback.updatedAt.toISOString(),
  };
}

async function searchWorkspaceFeedback(
  workspaceId: string,
  query: FeedbackListQuery,
  skip: number,
): Promise<{ totalItems: number; feedbackItems: SelectedFeedback[] }> {
  const sortDirection = query.sortOrder === "asc" ? Prisma.sql`ASC` : Prisma.sql`DESC`;
  const search = query.search;

  const [countRows, feedbackItems] = await db.$transaction([
    db.$queryRaw<FeedbackCountRow[]>(Prisma.sql`
      SELECT COUNT(*)::bigint AS "count"
      FROM "Feedback"
      WHERE "workspaceId" = CAST(${workspaceId} AS uuid)
        AND to_tsvector('english', "content") @@ plainto_tsquery('english', ${search})
    `),
    db.$queryRaw<SelectedFeedback[]>(Prisma.sql`
      SELECT
        "id",
        "content",
        "channel",
        "sourceRef",
        "customerLabel",
        "sentiment",
        "sentimentScore",
        "featureArea",
        "classificationStatus",
        "status",
        "createdAt",
        "updatedAt"
      FROM "Feedback"
      WHERE "workspaceId" = CAST(${workspaceId} AS uuid)
        AND to_tsvector('english', "content") @@ plainto_tsquery('english', ${search})
      ORDER BY "createdAt" ${sortDirection}, "id" ASC
      LIMIT ${query.pageSize}
      OFFSET ${skip}
    `),
  ]);

  return {
    totalItems: countRows[0] ? Number(countRows[0].count) : 0,
    feedbackItems,
  };
}

export async function listWorkspaceFeedback(
  workspaceId: string,
  query: FeedbackListQuery,
): Promise<FeedbackPage> {
  const skip = (query.page - 1) * query.pageSize;

  let totalItems: number;
  let feedbackItems: SelectedFeedback[];

  if (query.search) {
    const searchResult = await searchWorkspaceFeedback(workspaceId, query, skip);
    totalItems = searchResult.totalItems;
    feedbackItems = searchResult.feedbackItems;
  } else {
    const where: Prisma.FeedbackWhereInput = {
      workspaceId,
    };

    [totalItems, feedbackItems] = await db.$transaction([
      db.feedback.count({ where }),
      db.feedback.findMany({
        where,
        select: feedbackSelect,
        orderBy: [{ createdAt: query.sortOrder }, { id: "asc" }],
        skip,
        take: query.pageSize,
      }),
    ]);
  }

  const totalPages = Math.max(1, Math.ceil(totalItems / query.pageSize));
  const effectivePage = Math.min(query.page, totalPages);

  if (effectivePage !== query.page && totalItems > 0) {
    return listWorkspaceFeedback(workspaceId, {
      ...query,
      page: effectivePage,
    });
  }

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
      sortOrder: query.sortOrder,
    },
  };
}

export async function createWorkspaceFeedback(
  workspaceId: string,
  input: FeedbackCreateInput,
): Promise<FeedbackListItem> {
  try {
    const feedback = await db.feedback.create({
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
      select: feedbackSelect,
    });

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