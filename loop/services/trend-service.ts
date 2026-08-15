import "server-only";

import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import type { TrendQuery } from "@/lib/trend-validation";
import type {
  TrendAnalyticsData,
  TrendSeriesTheme,
  TrendThemeSummary,
  TrendVolumePoint,
} from "@/types/trend";

const MILLISECONDS_PER_DAY = 86_400_000;
const MAX_CHART_THEMES = 6;
const SPIKE_MIN_CURRENT_COUNT = 3;
const SPIKE_MIN_ABSOLUTE_INCREASE = 2;
const SPIKE_MIN_GROWTH_PERCENT = 50;

type ThemeComparisonRow = {
  id: string;
  name: string;
  color: string;
  currentCount: bigint;
  previousCount: bigint;
};

type ThemeDailyRow = {
  themeId: string;
  date: Date;
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

function formatUtcDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatVolumeLabel(date: Date): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function dayCountInclusive(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / MILLISECONDS_PER_DAY) + 1;
}

function getPreviousPeriod(currentStart: Date, dayCount: number): {
  start: Date;
  end: Date;
  endExclusive: Date;
} {
  const end = new Date(currentStart);
  end.setUTCDate(end.getUTCDate() - 1);

  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (dayCount - 1));

  const endExclusive = new Date(end);
  endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);

  return { start, end, endExclusive };
}

function buildFeedbackFilterSql(
  workspaceId: string,
  query: TrendQuery,
  periodStart: Date,
  periodEndExclusive: Date,
): Prisma.Sql {
  let whereSql = Prisma.sql`
    f."workspaceId" = CAST(${workspaceId} AS uuid)
    AND f."createdAt" >= ${periodStart}
    AND f."createdAt" < ${periodEndExclusive}
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

function roundPercentage(value: number): number {
  return Math.round(value * 10) / 10;
}

function calculatePercentageChange(currentCount: number, previousCount: number): number | null {
  if (previousCount === 0) {
    return currentCount === 0 ? 0 : null;
  }

  return roundPercentage(((currentCount - previousCount) / previousCount) * 100);
}

function isThemeSpiking(
  currentCount: number,
  previousCount: number,
  percentageChange: number | null,
): boolean {
  if (currentCount < SPIKE_MIN_CURRENT_COUNT) {
    return false;
  }

  if (previousCount === 0) {
    return true;
  }

  return (
    currentCount - previousCount >= SPIKE_MIN_ABSOLUTE_INCREASE &&
    percentageChange !== null &&
    percentageChange >= SPIKE_MIN_GROWTH_PERCENT
  );
}

function seriesKeyForTheme(themeId: string): string {
  return `theme_${themeId.replaceAll("-", "")}`;
}

export async function getWorkspaceThemeTrends(
  workspaceId: string,
  query: TrendQuery,
): Promise<TrendAnalyticsData> {
  const currentStart = utcDateStart(query.dateFrom);
  const currentEnd = utcDateStart(query.dateTo);
  const currentEndExclusive = utcDayAfter(query.dateTo);
  const dayCount = dayCountInclusive(currentStart, currentEnd);
  const previous = getPreviousPeriod(currentStart, dayCount);

  const currentWhereSql = buildFeedbackFilterSql(
    workspaceId,
    query,
    currentStart,
    currentEndExclusive,
  );
  const previousWhereSql = buildFeedbackFilterSql(
    workspaceId,
    query,
    previous.start,
    previous.endExclusive,
  );

  return db.$transaction(
    async (transaction) => {
      const comparisonRows = await transaction.$queryRaw<ThemeComparisonRow[]>(Prisma.sql`
        WITH current_counts AS (
          SELECT ft."themeId", COUNT(*)::bigint AS "count"
          FROM "FeedbackTheme" AS ft
          INNER JOIN "Feedback" AS f
            ON f."id" = ft."feedbackId"
            AND f."workspaceId" = CAST(${workspaceId} AS uuid)
          WHERE ft."workspaceId" = CAST(${workspaceId} AS uuid)
            AND ${currentWhereSql}
          GROUP BY ft."themeId"
        ), previous_counts AS (
          SELECT ft."themeId", COUNT(*)::bigint AS "count"
          FROM "FeedbackTheme" AS ft
          INNER JOIN "Feedback" AS f
            ON f."id" = ft."feedbackId"
            AND f."workspaceId" = CAST(${workspaceId} AS uuid)
          WHERE ft."workspaceId" = CAST(${workspaceId} AS uuid)
            AND ${previousWhereSql}
          GROUP BY ft."themeId"
        )
        SELECT
          t."id",
          t."name",
          t."color",
          COALESCE(current_counts."count", 0)::bigint AS "currentCount",
          COALESCE(previous_counts."count", 0)::bigint AS "previousCount"
        FROM "Theme" AS t
        LEFT JOIN current_counts ON current_counts."themeId" = t."id"
        LEFT JOIN previous_counts ON previous_counts."themeId" = t."id"
        WHERE t."workspaceId" = CAST(${workspaceId} AS uuid)
          AND (
            COALESCE(current_counts."count", 0) > 0
            OR COALESCE(previous_counts."count", 0) > 0
          )
        ORDER BY
          COALESCE(current_counts."count", 0) DESC,
          COALESCE(previous_counts."count", 0) DESC,
          t."name" ASC
      `);

      const themes: TrendThemeSummary[] = comparisonRows
        .map((row) => {
          const currentCount = Number(row.currentCount);
          const previousCount = Number(row.previousCount);
          const percentageChange = calculatePercentageChange(currentCount, previousCount);

          return {
            id: row.id,
            name: row.name,
            color: row.color,
            currentCount,
            previousCount,
            absoluteChange: currentCount - previousCount,
            percentageChange,
            isSpiking: isThemeSpiking(currentCount, previousCount, percentageChange),
          };
        })
        .sort((first, second) => {
          if (first.isSpiking !== second.isSpiking) {
            return first.isSpiking ? -1 : 1;
          }

          if (first.currentCount !== second.currentCount) {
            return second.currentCount - first.currentCount;
          }

          return first.name.localeCompare(second.name);
        });

      const seriesThemes: TrendSeriesTheme[] = themes
        .filter((theme) => theme.currentCount > 0)
        .sort((first, second) => second.currentCount - first.currentCount || first.name.localeCompare(second.name))
        .slice(0, MAX_CHART_THEMES)
        .map((theme) => ({
          id: theme.id,
          name: theme.name,
          color: theme.color,
          seriesKey: seriesKeyForTheme(theme.id),
          currentCount: theme.currentCount,
        }));

      const seriesThemeIds = seriesThemes.map((theme) => theme.id);
      const dailyRows =
        seriesThemeIds.length === 0
          ? []
          : await transaction.$queryRaw<ThemeDailyRow[]>(Prisma.sql`
              SELECT
                ft."themeId",
                date_trunc('day', f."createdAt" AT TIME ZONE 'UTC')::date AS "date",
                COUNT(*)::bigint AS "count"
              FROM "FeedbackTheme" AS ft
              INNER JOIN "Feedback" AS f
                ON f."id" = ft."feedbackId"
                AND f."workspaceId" = CAST(${workspaceId} AS uuid)
              INNER JOIN "Theme" AS t
                ON t."id" = ft."themeId"
                AND t."workspaceId" = CAST(${workspaceId} AS uuid)
              WHERE ft."workspaceId" = CAST(${workspaceId} AS uuid)
                AND ft."themeId" IN (${Prisma.join(
                  seriesThemeIds.map((themeId) => Prisma.sql`CAST(${themeId} AS uuid)`),
                )})
                AND ${currentWhereSql}
              GROUP BY ft."themeId", 2
              ORDER BY 2 ASC, ft."themeId" ASC
            `);

      const countsByDate = new Map<string, Map<string, number>>();

      for (const row of dailyRows) {
        const date = formatUtcDate(row.date);
        const themeCounts = countsByDate.get(date) ?? new Map<string, number>();
        themeCounts.set(row.themeId, Number(row.count));
        countsByDate.set(date, themeCounts);
      }

      const volume: TrendVolumePoint[] = [];

      for (let offset = 0; offset < dayCount; offset += 1) {
        const date = new Date(currentStart);
        date.setUTCDate(date.getUTCDate() + offset);
        const dateKey = formatUtcDate(date);
        const themeCounts = countsByDate.get(dateKey);
        const point: TrendVolumePoint = {
          date: dateKey,
          label: formatVolumeLabel(date),
        };

        for (const theme of seriesThemes) {
          point[theme.seriesKey] = themeCounts?.get(theme.id) ?? 0;
        }

        volume.push(point);
      }

      const currentAssignments = themes.reduce((sum, theme) => sum + theme.currentCount, 0);
      const previousAssignments = themes.reduce((sum, theme) => sum + theme.previousCount, 0);

      return {
        query,
        currentPeriod: {
          dateFrom: query.dateFrom,
          dateTo: query.dateTo,
          dayCount,
        },
        previousPeriod: {
          dateFrom: formatUtcDate(previous.start),
          dateTo: formatUtcDate(previous.end),
          dayCount,
        },
        summary: {
          activeThemes: themes.filter((theme) => theme.currentCount > 0).length,
          spikingThemes: themes.filter((theme) => theme.isSpiking).length,
          currentAssignments,
          previousAssignments,
        },
        themes,
        seriesThemes,
        volume,
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
    },
  );
}