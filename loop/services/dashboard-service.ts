import "server-only";

import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import type { DashboardQuery } from "@/lib/dashboard-validation";
import type {
  DashboardAnalyticsData,
  DashboardSentimentPoint,
  DashboardThemePoint,
  DashboardVolumePoint,
} from "@/types/dashboard";

const MILLISECONDS_PER_DAY = 86_400_000;

const SENTIMENT_LABELS = {
  POS: "Positive",
  NEU: "Neutral",
  NEG: "Negative",
} as const;

type CountRow = {
  count: bigint;
};

type VolumeRow = {
  date: Date;
  count: bigint;
};

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

function utcDateStart(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function utcDayAfter(value: string): Date {
  const date = utcDateStart(value);
  date.setUTCDate(date.getUTCDate() + 1);
  return date;
}

function maxDate(first: Date, second: Date): Date {
  return first > second ? first : second;
}

function startOfCurrentUtcWeek(now = new Date()): Date {
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = date.getUTCDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  date.setUTCDate(date.getUTCDate() - daysSinceMonday);
  return date;
}

function buildFeedbackWhereSql(workspaceId: string, query: DashboardQuery): Prisma.Sql {
  let whereSql = Prisma.sql`
    f."workspaceId" = CAST(${workspaceId} AS uuid)
    AND f."createdAt" >= ${utcDateStart(query.dateFrom)}
    AND f."createdAt" < ${utcDayAfter(query.dateTo)}
  `;

  if (query.channel) {
    whereSql = Prisma.sql`${whereSql}
      AND f."channel" = CAST(${query.channel} AS "FeedbackChannel")`;
  }

  if (query.status) {
    whereSql = Prisma.sql`${whereSql}
      AND f."status" = CAST(${query.status} AS "FeedbackStatus")`;
  }

  return whereSql;
}

function buildPrismaWhere(workspaceId: string, query: DashboardQuery): Prisma.FeedbackWhereInput {
  return {
    workspaceId,
    createdAt: {
      gte: utcDateStart(query.dateFrom),
      lt: utcDayAfter(query.dateTo),
    },
    ...(query.channel ? { channel: query.channel } : {}),
    ...(query.status ? { status: query.status } : {}),
  };
}

function roundPercentage(numerator: number, denominator: number): number {
  if (denominator <= 0) {
    return 0;
  }

  return Math.round((numerator / denominator) * 10_000) / 100;
}

function formatVolumeLabel(date: Date): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export async function getWorkspaceDashboardAnalytics(
  workspaceId: string,
  query: DashboardQuery,
): Promise<DashboardAnalyticsData> {
  const whereSql = buildFeedbackWhereSql(workspaceId, query);
  const prismaWhere = buildPrismaWhere(workspaceId, query);
  const periodStart = utcDateStart(query.dateFrom);
  const periodEnd = utcDateStart(query.dateTo);
  const dayCount = Math.floor((periodEnd.getTime() - periodStart.getTime()) / MILLISECONDS_PER_DAY) + 1;
  const currentWeekStart = startOfCurrentUtcWeek();
  const weekWindowStart = maxDate(periodStart, currentWeekStart);

 
      const [
        totalItems,
        classifiedItems,
        negativeItems,
        newThisWeek,
        volumeRows,
        sentimentRows,
        themeRows,
      ] = await Promise.all([
        db.feedback.count({ where: prismaWhere }),
        db.feedback.count({
          where: {
            ...prismaWhere,
            sentiment: { not: null },
          },
        }),
        db.feedback.count({
          where: {
            ...prismaWhere,
            sentiment: "NEG",
          },
        }),
        weekWindowStart >= utcDayAfter(query.dateTo)
          ? Promise.resolve(0)
          : db.feedback.count({
              where: {
                ...prismaWhere,
                createdAt: {
                  gte: weekWindowStart,
                  lt: utcDayAfter(query.dateTo),
                },
              },
            }),
        db.$queryRaw<VolumeRow[]>(Prisma.sql`
          WITH dates AS (
            SELECT generate_series(
              CAST(${periodStart} AS date),
              CAST(${periodEnd} AS date),
              INTERVAL '1 day'
            )::date AS "date"
          ), counts AS (
            SELECT date_trunc('day', f."createdAt" AT TIME ZONE 'UTC')::date AS "date",
                   COUNT(*)::bigint AS "count"
            FROM "Feedback" AS f
            WHERE ${whereSql}
            GROUP BY 1
          )
          SELECT dates."date", COALESCE(counts."count", 0)::bigint AS "count"
          FROM dates
          LEFT JOIN counts ON counts."date" = dates."date"
          ORDER BY dates."date" ASC
        `),
        db.$queryRaw<SentimentRow[]>(Prisma.sql`
          SELECT f."sentiment", COUNT(*)::bigint AS "count"
          FROM "Feedback" AS f
          WHERE ${whereSql}
            AND f."sentiment" IS NOT NULL
          GROUP BY f."sentiment"
        `),
        db.$queryRaw<ThemeRow[]>(Prisma.sql`
          SELECT t."id", t."name", t."color", COUNT(*)::bigint AS "count"
          FROM "FeedbackTheme" AS ft
          INNER JOIN "Feedback" AS f
            ON f."id" = ft."feedbackId"
            AND f."workspaceId" = CAST(${workspaceId} AS uuid)
          INNER JOIN "Theme" AS t
            ON t."id" = ft."themeId"
            AND t."workspaceId" = CAST(${workspaceId} AS uuid)
          WHERE ft."workspaceId" = CAST(${workspaceId} AS uuid)
            AND ${whereSql}
          GROUP BY t."id", t."name", t."color"
          ORDER BY "count" DESC, t."name" ASC
          LIMIT 8
        `),
      ]);

      const volume: DashboardVolumePoint[] = volumeRows.map((row) => ({
        date: row.date.toISOString().slice(0, 10),
        label: formatVolumeLabel(row.date),
        count: Number(row.count),
      }));

      const sentimentCountMap = new Map(
        sentimentRows.map((row) => [row.sentiment, Number(row.count)]),
      );
      const sentiment: DashboardSentimentPoint[] = (["POS", "NEU", "NEG"] as const).map(
        (value) => {
          const count = sentimentCountMap.get(value) ?? 0;

          return {
            sentiment: value,
            label: SENTIMENT_LABELS[value],
            count,
            percentage: roundPercentage(count, classifiedItems),
          };
        },
      );

      const topThemes: DashboardThemePoint[] = themeRows.map((row) => {
        const count = Number(row.count);

        return {
          id: row.id,
          name: row.name,
          color: row.color,
          count,
          percentage: roundPercentage(count, totalItems),
        };
      });

      return {
        query,
        period: {
          dateFrom: query.dateFrom,
          dateTo: query.dateTo,
          dayCount,
        },
        stats: {
          totalItems,
          classifiedItems,
          negativeItems,
          negativePercentage: roundPercentage(negativeItems, classifiedItems),
          newThisWeek,
          classificationCoverage: roundPercentage(classifiedItems, totalItems),
        },
        volume,
        sentiment,
        topThemes,
      };
    
}