import "server-only";

import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import type { DashboardQuery } from "@/lib/dashboard-validation";
import type {
  DashboardAnalyticsData,
  DashboardSentimentPoint,
  DashboardThemePoint,
  DashboardTrendsData,
  DashboardVolumePoint,
  ThemeTrendSeries,
  TrendSeriesPoint,
  TrendSpike,
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

// --- Trends: theme trend charts + spike detection -------------------------

const TREND_THEME_LIMIT = 6;
const SPIKE_BASELINE_WINDOW_DAYS = 7;
const SPIKE_MIN_COUNT = 3;
const SPIKE_INCREASE_THRESHOLD = 0.75; // 75% above baseline average

type ThemeDayRow = {
  themeId: string;
  themeName: string;
  color: string;
  date: Date;
  count: bigint;
};

export async function getWorkspaceDashboardTrends(
  workspaceId: string,
  query: DashboardQuery,
): Promise<DashboardTrendsData> {
  const whereSql = buildFeedbackWhereSql(workspaceId, query);
  const periodStart = utcDateStart(query.dateFrom);
  const periodEnd = utcDateStart(query.dateTo);
  const dayCount = Math.floor((periodEnd.getTime() - periodStart.getTime()) / MILLISECONDS_PER_DAY) + 1;

  const themeDayRows = await db.$queryRaw<ThemeDayRow[]>(Prisma.sql`
    WITH dates AS (
      SELECT generate_series(
        CAST(${periodStart} AS date),
        CAST(${periodEnd} AS date),
        INTERVAL '1 day'
      )::date AS "date"
    ), top_themes AS (
      SELECT t."id", t."name", t."color", COUNT(*)::bigint AS "totalCount"
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
      ORDER BY "totalCount" DESC, t."name" ASC
      LIMIT ${TREND_THEME_LIMIT}
    ), counts AS (
      SELECT tt."id" AS "themeId", tt."name" AS "themeName", tt."color",
             date_trunc('day', f."createdAt" AT TIME ZONE 'UTC')::date AS "date",
             COUNT(*)::bigint AS "count"
      FROM top_themes AS tt
      INNER JOIN "FeedbackTheme" AS ft ON ft."themeId" = tt."id"
      INNER JOIN "Feedback" AS f
        ON f."id" = ft."feedbackId"
        AND f."workspaceId" = CAST(${workspaceId} AS uuid)
      WHERE ${whereSql}
      GROUP BY tt."id", tt."name", tt."color", date_trunc('day', f."createdAt" AT TIME ZONE 'UTC')::date
    )
    SELECT tt."id" AS "themeId", tt."name" AS "themeName", tt."color",
           dates."date", COALESCE(counts."count", 0)::bigint AS "count"
    FROM top_themes AS tt
    CROSS JOIN dates
    LEFT JOIN counts
      ON counts."themeId" = tt."id" AND counts."date" = dates."date"
    ORDER BY tt."name" ASC, dates."date" ASC
  `);

  const seriesByTheme = new Map<string, ThemeTrendSeries>();

  for (const row of themeDayRows) {
    const existing = seriesByTheme.get(row.themeId);
    const point: TrendSeriesPoint = {
      date: row.date.toISOString().slice(0, 10),
      label: formatVolumeLabel(row.date),
      count: Number(row.count),
    };

    if (existing) {
      existing.points.push(point);
      existing.totalCount += point.count;
    } else {
      seriesByTheme.set(row.themeId, {
        id: row.themeId,
        name: row.themeName,
        color: row.color,
        points: [point],
        totalCount: point.count,
      });
    }
  }

  const themeSeries = Array.from(seriesByTheme.values()).sort(
    (a, b) => b.totalCount - a.totalCount,
  );

  // Spike detection: flag any day where a theme's volume jumps well above its
  // own recent (trailing) average — a simple, explainable moving-baseline check.
  const spikes: TrendSpike[] = [];

  for (const series of themeSeries) {
    for (let i = 0; i < series.points.length; i += 1) {
      const windowStart = Math.max(0, i - SPIKE_BASELINE_WINDOW_DAYS);
      const baselinePoints = series.points.slice(windowStart, i);

      if (baselinePoints.length < 2) {
        continue; // not enough history yet to judge a spike
      }

      const baselineAverage =
        baselinePoints.reduce((sum, point) => sum + point.count, 0) / baselinePoints.length;
      const current = series.points[i];

      if (current.count < SPIKE_MIN_COUNT) {
        continue; // too small to be meaningful
      }

      const increase = baselineAverage === 0 ? current.count : (current.count - baselineAverage) / baselineAverage;

      if (increase >= SPIKE_INCREASE_THRESHOLD) {
        spikes.push({
          themeId: series.id,
          themeName: series.name,
          color: series.color,
          date: current.date,
          label: current.label,
          count: current.count,
          baselineAverage: Math.round(baselineAverage * 10) / 10,
          percentageIncrease: Math.round(increase * 1000) / 10,
        });
      }
    }
  }

  spikes.sort((a, b) => b.percentageIncrease - a.percentageIncrease);

  return {
    period: {
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      dayCount,
    },
    themeSeries,
    spikes,
  };
}