import "server-only";

import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import type {
  FeedbackCreateInput,
  FeedbackListQuery,
} from "@/lib/feedback-validation";
import type { ApiErrorCode, ApiFieldErrors } from "@/types/api";
import type { FeedbackListItem, FeedbackPage } from "@/types/feedback";

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

export async function listWorkspaceFeedback(
  workspaceId: string,
  query: FeedbackListQuery,
): Promise<FeedbackPage> {
  const where: Prisma.FeedbackWhereInput = {
    workspaceId,
  };

  const skip = (query.page - 1) * query.pageSize;
  const [totalItems, feedbackItems] = await db.$transaction([
    db.feedback.count({ where }),
    db.feedback.findMany({
      where,
      select: feedbackSelect,
      orderBy: [{ createdAt: query.sortOrder }, { id: "asc" }],
      skip,
      take: query.pageSize,
    }),
  ]);

  return {
    items: feedbackItems.map(serializeFeedback),
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / query.pageSize)),
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