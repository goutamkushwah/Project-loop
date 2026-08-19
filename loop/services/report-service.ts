import "server-only";

import { ApiError } from "@google/genai";
import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { GEMINI_REPORT_MODEL, gemini } from "@/lib/gemini";
import {
  buildVoiceOfCustomerPrompt,
  VOC_REPORT_SYSTEM_INSTRUCTION,
} from "@/lib/report-prompts";
import {
  createReportShareToken,
  hashReportShareToken,
} from "@/lib/report-sharing";
import {
  reportNarrativeModelResponseJsonSchema,
  reportNarrativeModelResponseSchema,
  storedReportContentSchema,
  type ReportNarrativeModelResponse,
} from "@/lib/report-schemas";
import type {
  CreateReportInput,
  ReportListQuery,
} from "@/lib/report-validation";
import type { ApiErrorCode } from "@/types/api";
import type {
  ReportEvidenceItem,
  ReportListItem,
  ReportPage,
  ReportPeriodSnapshot,
  ReportSentimentMetric,
  ReportThemeMetric,
  SharedVoiceOfCustomerReportDetail,
  VoiceOfCustomerReportContent,
  VoiceOfCustomerReportDetail,
} from "@/types/report";

const AI_PROVIDER = "GOOGLE_GEMINI" as const;

const MAX_REPORT_ATTEMPTS = 2;
const MAX_TOP_THEMES = 5;
const MAX_EVIDENCE_ITEMS = 8;
const MAX_EVIDENCE_CANDIDATES = 200;
const MILLISECONDS_PER_DAY = 86_400_000;

const SENTIMENT_LABELS = {
  POS: "Positive",
  NEU: "Neutral",
  NEG: "Negative",
} as const;

export class ReportServiceError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ReportServiceError";
  }
}

type SentimentRow = {
  sentiment: "POS" | "NEU" | "NEG";
  count: bigint;
};

type ThemeRow = {
  id: string;
  name: string;
  color: string;
  count: bigint;
};

type EvidenceCandidate = {
  id: string;
  content: string;
  channel: ReportEvidenceItem["channel"];
  customerLabel: string | null;
  sentiment: ReportEvidenceItem["sentiment"];
  sentimentScore: Prisma.Decimal | null;
  featureArea: string | null;
  createdAt: Date;
  themes: {
    confidence: Prisma.Decimal;
    theme: {
      id: string;
      name: string;
    };
  }[];
};

type PrecomputedReportData = {
  period: ReportPeriodSnapshot;
  stats: VoiceOfCustomerReportContent["stats"];
  sentiment: ReportSentimentMetric[];
  topThemes: ReportThemeMetric[];
  evidence: ReportEvidenceItem[];
};

/* -------------------------------------------------------------------------- */
/* Date helpers                                                               */
/* -------------------------------------------------------------------------- */

function utcDateStart(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function utcDayAfter(value: string): Date {
  const date = utcDateStart(value);
  date.setUTCDate(date.getUTCDate() + 1);
  return date;
}

function formatUtcDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function dayCountInclusive(
  start: Date,
  end: Date,
): number {
  return (
    Math.floor(
      (end.getTime() - start.getTime()) /
        MILLISECONDS_PER_DAY,
    ) + 1
  );
}

function previousPeriod(
  currentStart: Date,
  dayCount: number,
): {
  start: Date;
  end: Date;
  endExclusive: Date;
} {
  const end = new Date(currentStart);

  end.setUTCDate(end.getUTCDate() - 1);

  const start = new Date(end);

  start.setUTCDate(
    start.getUTCDate() - (dayCount - 1),
  );

  const endExclusive = new Date(end);

  endExclusive.setUTCDate(
    endExclusive.getUTCDate() + 1,
  );

  return {
    start,
    end,
    endExclusive,
  };
}

/* -------------------------------------------------------------------------- */
/* Metric helpers                                                             */
/* -------------------------------------------------------------------------- */

function percentage(
  numerator: number,
  denominator: number,
): number {
  if (denominator <= 0) {
    return 0;
  }

  return (
    Math.round(
      (numerator / denominator) * 1_000,
    ) / 10
  );
}

function percentagePointDelta(
  current: number,
  previous: number,
): number {
  return (
    Math.round((current - previous) * 10) / 10
  );
}

/* -------------------------------------------------------------------------- */
/* Evidence helpers                                                           */
/* -------------------------------------------------------------------------- */

function serializeEvidence(
  candidate: EvidenceCandidate,
): ReportEvidenceItem {
  return {
    feedbackId: candidate.id,
    content: candidate.content,
    channel: candidate.channel,
    customerLabel: candidate.customerLabel,
    sentiment: candidate.sentiment,

    sentimentScore:
      candidate.sentimentScore === null
        ? null
        : Number(candidate.sentimentScore),

    featureArea: candidate.featureArea,

    createdAt:
      candidate.createdAt.toISOString(),

    themes: candidate.themes.map(
      (assignment) => ({
        id: assignment.theme.id,
        name: assignment.theme.name,
        confidence: Number(
          assignment.confidence,
        ),
      }),
    ),
  };
}

function compareEvidenceCandidates(
  first: EvidenceCandidate,
  second: EvidenceCandidate,
  themeRank: ReadonlyMap<string, number>,
): number {
  const firstRank = Math.min(
    ...first.themes.map(
      (assignment) =>
        themeRank.get(
          assignment.theme.id,
        ) ?? 999,
    ),
    999,
  );

  const secondRank = Math.min(
    ...second.themes.map(
      (assignment) =>
        themeRank.get(
          assignment.theme.id,
        ) ?? 999,
    ),
    999,
  );

  if (firstRank !== secondRank) {
    return firstRank - secondRank;
  }

  const firstNegative =
    first.sentiment === "NEG" ? 1 : 0;

  const secondNegative =
    second.sentiment === "NEG" ? 1 : 0;

  if (firstNegative !== secondNegative) {
    return secondNegative - firstNegative;
  }

  const firstStrength = Math.abs(
    first.sentimentScore === null
      ? 0
      : Number(first.sentimentScore),
  );

  const secondStrength = Math.abs(
    second.sentimentScore === null
      ? 0
      : Number(second.sentimentScore),
  );

  if (firstStrength !== secondStrength) {
    return secondStrength - firstStrength;
  }

  return (
    second.createdAt.getTime() -
    first.createdAt.getTime()
  );
}

function selectEvidence(
  candidates: readonly EvidenceCandidate[],
  topThemes: readonly ReportThemeMetric[],
): ReportEvidenceItem[] {
  const themeRank = new Map(
    topThemes.map((theme, index) => [
      theme.id,
      index,
    ]),
  );

  const selected =
    new Map<string, EvidenceCandidate>();

  for (const theme of topThemes) {
    const candidate = candidates
      .filter((item) =>
        item.themes.some(
          (assignment) =>
            assignment.theme.id === theme.id,
        ),
      )
      .sort((first, second) =>
        compareEvidenceCandidates(
          first,
          second,
          themeRank,
        ),
      )[0];

    if (candidate) {
      selected.set(candidate.id, candidate);
    }

    if (
      selected.size >=
      MAX_EVIDENCE_ITEMS
    ) {
      break;
    }
  }

  if (
    selected.size <
    MAX_EVIDENCE_ITEMS
  ) {
    const ranked = [...candidates].sort(
      (first, second) =>
        compareEvidenceCandidates(
          first,
          second,
          themeRank,
        ),
    );

    for (const candidate of ranked) {
      selected.set(
        candidate.id,
        candidate,
      );

      if (
        selected.size >=
        MAX_EVIDENCE_ITEMS
      ) {
        break;
      }
    }
  }

  return [...selected.values()]
    .slice(0, MAX_EVIDENCE_ITEMS)
    .map(serializeEvidence);
}

/* -------------------------------------------------------------------------- */
/* Report precomputation                                                      */
/* -------------------------------------------------------------------------- */

async function precomputeWorkspaceReport(
  workspaceId: string,
  input: CreateReportInput,
): Promise<PrecomputedReportData> {
  const currentStart = utcDateStart(
    input.dateFrom,
  );

  const currentEnd = utcDateStart(
    input.dateTo,
  );

  const currentEndExclusive =
    utcDayAfter(input.dateTo);

  const dayCount = dayCountInclusive(
    currentStart,
    currentEnd,
  );

  const previous = previousPeriod(
    currentStart,
    dayCount,
  );

  const currentWhere: Prisma.FeedbackWhereInput =
    {
      workspaceId,

      createdAt: {
        gte: currentStart,
        lt: currentEndExclusive,
      },
    };

  const previousWhere: Prisma.FeedbackWhereInput =
    {
      workspaceId,

      createdAt: {
        gte: previous.start,
        lt: previous.endExclusive,
      },
    };

  /*
   * IMPORTANT:
   * The return statement must be INSIDE this function.
   */
  return db.$transaction(
    async (transaction) => {
      const [
        totalFeedback,
        previousTotalFeedback,
        classifiedFeedback,
        previousClassifiedFeedback,
        currentSentimentRows,
        previousSentimentRows,
        themeRows,
        evidenceCandidates,
      ] = await Promise.all([
        transaction.feedback.count({
          where: currentWhere,
        }),

        transaction.feedback.count({
          where: previousWhere,
        }),

        transaction.feedback.count({
          where: {
            ...currentWhere,
            sentiment: {
              not: null,
            },
          },
        }),

        transaction.feedback.count({
          where: {
            ...previousWhere,
            sentiment: {
              not: null,
            },
          },
        }),

        transaction.$queryRaw<
          SentimentRow[]
        >(
          Prisma.sql`
            SELECT
              f."sentiment",
              COUNT(*)::bigint AS "count"
            FROM "Feedback" AS f
            WHERE f."workspaceId" =
              CAST(${workspaceId} AS uuid)
              AND f."createdAt" >= ${currentStart}
              AND f."createdAt" < ${currentEndExclusive}
              AND f."sentiment" IS NOT NULL
            GROUP BY f."sentiment"
          `,
        ),

        transaction.$queryRaw<
          SentimentRow[]
        >(
          Prisma.sql`
            SELECT
              f."sentiment",
              COUNT(*)::bigint AS "count"
            FROM "Feedback" AS f
            WHERE f."workspaceId" =
              CAST(${workspaceId} AS uuid)
              AND f."createdAt" >= ${previous.start}
              AND f."createdAt" < ${previous.endExclusive}
              AND f."sentiment" IS NOT NULL
            GROUP BY f."sentiment"
          `,
        ),

        transaction.$queryRaw<ThemeRow[]>(
          Prisma.sql`
            SELECT
              t."id",
              t."name",
              t."color",
              COUNT(*)::bigint AS "count"
            FROM "FeedbackTheme" AS ft
            INNER JOIN "Feedback" AS f
              ON f."id" = ft."feedbackId"
              AND f."workspaceId" =
                CAST(${workspaceId} AS uuid)
            INNER JOIN "Theme" AS t
              ON t."id" = ft."themeId"
              AND t."workspaceId" =
                CAST(${workspaceId} AS uuid)
            WHERE ft."workspaceId" =
              CAST(${workspaceId} AS uuid)
              AND f."createdAt" >= ${currentStart}
              AND f."createdAt" < ${currentEndExclusive}
            GROUP BY
              t."id",
              t."name",
              t."color"
            ORDER BY
              "count" DESC,
              t."name" ASC
            LIMIT ${MAX_TOP_THEMES}
          `,
        ),

        transaction.feedback.findMany({
          where: currentWhere,

          select: {
            id: true,
            content: true,
            channel: true,
            customerLabel: true,
            sentiment: true,
            sentimentScore: true,
            featureArea: true,
            createdAt: true,

            themes: {
              where: {
                workspaceId,
              },

              select: {
                confidence: true,

                theme: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },

          orderBy: [
            {
              createdAt: "desc",
            },
            {
              id: "asc",
            },
          ],

          take: MAX_EVIDENCE_CANDIDATES,
        }),
      ]);

      if (totalFeedback === 0) {
        throw new ReportServiceError(
          "REPORT_PERIOD_EMPTY",
          "There is no feedback in the selected period, so LOOP cannot generate an evidence-backed report.",
          422,
        );
      }

      const currentSentiment =
        new Map<
          "POS" | "NEU" | "NEG",
          number
        >(
          currentSentimentRows.map(
            (row) => [
              row.sentiment,
              Number(row.count),
            ],
          ),
        );

      const previousSentiment =
        new Map<
          "POS" | "NEU" | "NEG",
          number
        >(
          previousSentimentRows.map(
            (row) => [
              row.sentiment,
              Number(row.count),
            ],
          ),
        );

      const sentiment: ReportSentimentMetric[] =
        (
          ["POS", "NEU", "NEG"] as const
        ).map((value) => {
          const count =
            currentSentiment.get(value) ??
            0;

          const previousCount =
            previousSentiment.get(value) ??
            0;

          const currentPercentage =
            percentage(
              count,
              classifiedFeedback,
            );

          const previousPercentage =
            percentage(
              previousCount,
              previousClassifiedFeedback,
            );

          return {
            sentiment: value,
            label: SENTIMENT_LABELS[value],
            count,
            percentage:
              currentPercentage,
            previousCount,
            previousPercentage,

            deltaPercentagePoints:
              percentagePointDelta(
                currentPercentage,
                previousPercentage,
              ),
          };
        });

      const topThemes: ReportThemeMetric[] =
        themeRows.map((row) => ({
          id: row.id,
          name: row.name,
          color: row.color,
          count: Number(row.count),

          percentage: percentage(
            Number(row.count),
            totalFeedback,
          ),
        }));

      return {
        period: {
          dateFrom: input.dateFrom,
          dateTo: input.dateTo,
          dayCount,

          previousDateFrom:
            formatUtcDate(
              previous.start,
            ),

          previousDateTo:
            formatUtcDate(
              previous.end,
            ),
        },

        stats: {
          totalFeedback,
          previousTotalFeedback,
          classifiedFeedback,
          previousClassifiedFeedback,

          classificationCoverage:
            percentage(
              classifiedFeedback,
              totalFeedback,
            ),

          previousClassificationCoverage:
            percentage(
              previousClassifiedFeedback,
              previousTotalFeedback,
            ),
        },

        sentiment,

        topThemes,

        evidence: selectEvidence(
          evidenceCandidates,
          topThemes,
        ),
      };
    },

    {
      isolationLevel:
        Prisma.TransactionIsolationLevel
          .RepeatableRead,

      timeout: 15000,
    },
  );
}

/* -------------------------------------------------------------------------- */
/* Gemini helpers                                                             */
/* -------------------------------------------------------------------------- */

function stripMarkdownCodeFence(
  value: string,
): string {
  const trimmed = value.trim();

  const fenced = trimmed.match(
    /^```(?:json)?\s*([\s\S]*?)\s*```$/i,
  );

  return (
    fenced?.[1]?.trim() ??
    trimmed
  );
}

function validateNarrativeReferences(
  narrative: ReportNarrativeModelResponse,
  data: PrecomputedReportData,
): boolean {
  const evidenceIds = new Set(
    data.evidence.map(
      (item) => item.feedbackId,
    ),
  );

  const themeIds = new Set(
    data.topThemes.map(
      (theme) => theme.id,
    ),
  );

  if (
    narrative.notableQuoteIds.some(
      (id) => !evidenceIds.has(id),
    )
  ) {
    return false;
  }

  if (
    narrative.themeInsights.some(
      (item) => !themeIds.has(
        item.themeId,
      ),
    )
  ) {
    return false;
  }

  return narrative.recommendedActions.every(
    (action) =>
      action.relatedThemeIds.every(
        (id) => themeIds.has(id),
      ) &&
      action.evidenceFeedbackIds.every(
        (id) => evidenceIds.has(id),
      ),
  );
}

async function generateNarrative(
  data: PrecomputedReportData,
): Promise<{
  narrative: ReportNarrativeModelResponse;
  model: string;
}> {
  for (
    let attempt = 1;
    attempt <= MAX_REPORT_ATTEMPTS;
    attempt += 1
  ) {
    try {
      const response =
        await gemini.models.generateContent(
          {
            model: GEMINI_REPORT_MODEL,

            contents:
              buildVoiceOfCustomerPrompt(
                data,
              ),

            config: {
              systemInstruction:
                VOC_REPORT_SYSTEM_INSTRUCTION,

              responseMimeType:
                "application/json",

              responseJsonSchema:
                reportNarrativeModelResponseJsonSchema,
            },
          },
        );

      const rawText =
        response.text?.trim();

      if (rawText) {
        try {
          const parsedJson =
            JSON.parse(
              stripMarkdownCodeFence(
                rawText,
              ),
            ) as unknown;

          const parsed =
            reportNarrativeModelResponseSchema.safeParse(
              parsedJson,
            );

          if (
            parsed.success &&
            validateNarrativeReferences(
              parsed.data,
              data,
            )
          ) {
            return {
              narrative: parsed.data,

              model:
                response.modelVersion ??
                GEMINI_REPORT_MODEL,
            };
          }
        } catch {
          // Invalid structured output.
        }
      }

      if (
        attempt ===
        MAX_REPORT_ATTEMPTS
      ) {
        throw new ReportServiceError(
          "REPORT_INVALID_RESPONSE",
          "Gemini returned a Voice-of-Customer narrative that LOOP could not validate.",
          502,
        );
      }
    } catch (error: unknown) {
      if (
        error instanceof
        ReportServiceError
      ) {
        throw error;
      }

      if (error instanceof ApiError) {
        const status =
          typeof error.status === "number"
            ? error.status
            : null;

        const retryable =
          status === 408 ||
          status === 429 ||
          (status !== null &&
            status >= 500);

        if (
          retryable &&
          attempt <
            MAX_REPORT_ATTEMPTS
        ) {
          continue;
        }

        if (retryable) {
          throw new ReportServiceError(
            "REPORT_PROVIDER_UNAVAILABLE",
            "Google Gemini is temporarily unavailable, so the report could not be generated.",
            503,
          );
        }
      }

      console.error(
        "Voice-of-Customer narrative generation failed.",
        {
          attempt,
          error,
        },
      );

      throw new ReportServiceError(
        "REPORT_GENERATE_FAILED",
        "LOOP could not generate the Voice-of-Customer report. Please try again.",
        500,
      );
    }
  }

  throw new ReportServiceError(
    "REPORT_GENERATE_FAILED",
    "LOOP could not generate the Voice-of-Customer report. Please try again.",
    500,
  );
}

/* -------------------------------------------------------------------------- */
/* Report creation                                                            */
/* -------------------------------------------------------------------------- */

function defaultReportTitle(
  dateFrom: string,
  dateTo: string,
): string {
  const formatter =
    new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });

  const start =
    formatter.format(
      utcDateStart(dateFrom),
    );

  const end =
    formatter.format(
      utcDateStart(dateTo),
    );

  return `Voice of Customer · ${start} – ${end}`;
}

export async function generateWorkspaceVoiceOfCustomerReport(
  workspaceId: string,
  generatedById: string,
  input: CreateReportInput,
): Promise<VoiceOfCustomerReportDetail> {
  const precomputed =
    await precomputeWorkspaceReport(
      workspaceId,
      input,
    );

  const generated =
    await generateNarrative(
      precomputed,
    );

  const generatedAt =
    new Date().toISOString();

  const content: VoiceOfCustomerReportContent =
    {
      schemaVersion: "1",
      generatedAt,
      provider: AI_PROVIDER,
      model: generated.model,

      ...precomputed,

      narrative:
        generated.narrative,
    };

  const stored =
    await db.report.create({
      data: {
        title:
          input.title ??
          defaultReportTitle(
            input.dateFrom,
            input.dateTo,
          ),

        periodStart:
          utcDateStart(
            input.dateFrom,
          ),

        periodEnd: new Date(
          `${input.dateTo}T23:59:59.999Z`,
        ),

        contentJson:
          content as unknown as Prisma.InputJsonValue,

        workspaceId,
        generatedById,
      },

      select: {
        id: true,
      },
    });

  const report =
    await getWorkspaceReport(
      workspaceId,
      stored.id,
    );

  if (!report) {
    throw new ReportServiceError(
      "REPORT_GENERATE_FAILED",
      "The report was generated but could not be loaded after saving.",
      500,
    );
  }

  return report;
}

/* -------------------------------------------------------------------------- */
/* Report list                                                                */
/* -------------------------------------------------------------------------- */

function buildReportWhere(
  workspaceId: string,
  query: ReportListQuery,
): Prisma.ReportWhereInput {
  return {
    workspaceId,

    ...(query.search
      ? {
          title: {
            contains: query.search,
            mode: Prisma.QueryMode
              .insensitive,
          },
        }
      : {}),

    ...(query.periodFrom ||
    query.periodTo
      ? {
          AND: [
            ...(query.periodFrom
              ? [
                  {
                    periodEnd: {
                      gte: utcDateStart(
                        query.periodFrom,
                      ),
                    },
                  },
                ]
              : []),

            ...(query.periodTo
              ? [
                  {
                    periodStart: {
                      lt: utcDayAfter(
                        query.periodTo,
                      ),
                    },
                  },
                ]
              : []),
          ],
        }
      : {}),
  };
}

function buildReportOrder(
  query: ReportListQuery,
): Prisma.ReportOrderByWithRelationInput[] {
  const direction =
    query.sortOrder;

  switch (query.sortBy) {
    case "title":
      return [
        {
          title: direction,
        },
        {
          createdAt: "desc",
        },
        {
          id: "asc",
        },
      ];

    case "periodStart":
      return [
        {
          periodStart: direction,
        },
        {
          createdAt: "desc",
        },
        {
          id: "asc",
        },
      ];

    case "createdAt":
      return [
        {
          createdAt: direction,
        },
        {
          id: "asc",
        },
      ];

    default:
      return [
        {
          createdAt: "desc",
        },
        {
          id: "asc",
        },
      ];
  }
}

export async function listWorkspaceReports(
  workspaceId: string,
  query: ReportListQuery,
): Promise<ReportPage> {
  const where =
    buildReportWhere(
      workspaceId,
      query,
    );

  return db.$transaction(
    async (transaction) => {
      const totalItems =
        await transaction.report.count({
          where,
        });

      const totalPages =
        Math.max(
          1,
          Math.ceil(
            totalItems /
              query.pageSize,
          ),
        );

      const page = Math.min(
        query.page,
        totalPages,
      );

      const rows =
        await transaction.report.findMany(
          {
            where,

            select: {
              id: true,
              title: true,
              periodStart: true,
              periodEnd: true,
              createdAt: true,

              generatedBy: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },

            orderBy:
              buildReportOrder(
                query,
              ),

            skip:
              (page - 1) *
              query.pageSize,

            take:
              query.pageSize,
          },
        );

      return {
        items: rows.map(
          (
            row,
          ): ReportListItem => ({
            id: row.id,
            title: row.title,

            periodStart:
              row.periodStart.toISOString(),

            periodEnd:
              row.periodEnd.toISOString(),

            createdAt:
              row.createdAt.toISOString(),

            generatedBy:
              row.generatedBy,
          }),
        ),

        pagination: {
          page,
          pageSize:
            query.pageSize,
          totalItems,
          totalPages,
        },

        query: {
          page,
          pageSize:
            query.pageSize,

          search:
            query.search,

          periodFrom:
            query.periodFrom ??
            null,

          periodTo:
            query.periodTo ??
            null,

          sortBy:
            query.sortBy,

          sortOrder:
            query.sortOrder,
        },
      };
    },

    {
      isolationLevel:
        Prisma.TransactionIsolationLevel
          .RepeatableRead,
    },
  );
}

/* -------------------------------------------------------------------------- */
/* Get report                                                                 */
/* -------------------------------------------------------------------------- */

export async function getWorkspaceReport(
  workspaceId: string,
  reportId: string,
): Promise<VoiceOfCustomerReportDetail | null> {
  const row =
    await db.report.findFirst({
      where: {
        id: reportId,
        workspaceId,
      },

      select: {
        id: true,
        title: true,
        periodStart: true,
        periodEnd: true,
        contentJson: true,
        createdAt: true,
        updatedAt: true,
        shareEnabled: true,
        shareCreatedAt: true,

        generatedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

  if (!row) {
    return null;
  }

  const parsedContent =
    storedReportContentSchema.safeParse(
      row.contentJson,
    );

  if (!parsedContent.success) {
    console.error(
      "Stored Voice-of-Customer report content failed validation.",
      {
        workspaceId,
        reportId,

        issues:
          parsedContent.error.issues,
      },
    );

    throw new ReportServiceError(
      "REPORT_CONTENT_INVALID",
      "This saved report could not be validated. Generate a new report or contact an administrator.",
      500,
    );
  }

  return {
    id: row.id,
    title: row.title,

    periodStart:
      row.periodStart.toISOString(),

    periodEnd:
      row.periodEnd.toISOString(),

    createdAt:
      row.createdAt.toISOString(),

    updatedAt:
      row.updatedAt.toISOString(),

    generatedBy:
      row.generatedBy,

    sharing: {
      enabled:
        row.shareEnabled,

      createdAt:
        row.shareCreatedAt
          ?.toISOString() ??
        null,
    },

    content:
      parsedContent.data,
  };
}

/* -------------------------------------------------------------------------- */
/* Share report                                                               */
/* -------------------------------------------------------------------------- */

export async function rotateWorkspaceReportShare(
  workspaceId: string,
  reportId: string,
): Promise<{
  token: string;
  createdAt: string;
}> {
  const {
    token,
    tokenHash,
  } =
    createReportShareToken();

  const createdAt =
    new Date();

  const updated =
    await db.report.updateMany({
      where: {
        id: reportId,
        workspaceId,
      },

      data: {
        shareTokenHash:
          tokenHash,

        shareEnabled:
          true,

        shareCreatedAt:
          createdAt,
      },
    });

  if (updated.count === 0) {
    throw new ReportServiceError(
      "REPORT_NOT_FOUND",
      "The requested report was not found in this workspace.",
      404,
    );
  }

  return {
    token,

    createdAt:
      createdAt.toISOString(),
  };
}

export async function revokeWorkspaceReportShare(
  workspaceId: string,
  reportId: string,
): Promise<void> {
  const updated =
    await db.report.updateMany({
      where: {
        id: reportId,
        workspaceId,
      },

      data: {
        shareTokenHash:
          null,

        shareEnabled:
          false,

        shareCreatedAt:
          null,
      },
    });

  if (updated.count === 0) {
    throw new ReportServiceError(
      "REPORT_NOT_FOUND",
      "The requested report was not found in this workspace.",
      404,
    );
  }
}

/* -------------------------------------------------------------------------- */
/* Shared report                                                              */
/* -------------------------------------------------------------------------- */

export async function getSharedVoiceOfCustomerReport(
  token: string,
): Promise<SharedVoiceOfCustomerReportDetail | null> {
  const tokenHash =
    hashReportShareToken(token);

  const row =
    await db.report.findFirst({
      where: {
        shareEnabled: true,
        shareTokenHash:
          tokenHash,
      },

      select: {
        id: true,
        title: true,
        periodStart: true,
        periodEnd: true,
        contentJson: true,
        createdAt: true,
        updatedAt: true,
      },
    });

  if (!row) {
    return null;
  }

  const parsedContent =
    storedReportContentSchema.safeParse(
      row.contentJson,
    );

  if (!parsedContent.success) {
    console.error(
      "Shared Voice-of-Customer report content failed validation.",
      {
        reportId: row.id,

        issues:
          parsedContent.error.issues,
      },
    );

    throw new ReportServiceError(
      "REPORT_CONTENT_INVALID",
      "This shared report could not be validated.",
      500,
    );
  }

  return {
    id: row.id,
    title: row.title,

    periodStart:
      row.periodStart.toISOString(),

    periodEnd:
      row.periodEnd.toISOString(),

    createdAt:
      row.createdAt.toISOString(),

    updatedAt:
      row.updatedAt.toISOString(),

    content:
      parsedContent.data,
  };
}