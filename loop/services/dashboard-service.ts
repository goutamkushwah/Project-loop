import "server-only";

import { db } from "@/lib/db";
import type { DashboardAnalyticsQuery } from "@/lib/dashboard-validation";
import type {
  DashboardAnalytics,
  DashboardSentimentBreakdown,
  DashboardVolumePoint,
} from "@/types/dashboard";

const RANGE_DAYS: Record<DashboardAnalyticsQuery["range"], number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

function startOfDayUtc(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function getWorkspaceDashboardAnalytics(
  workspaceId: string,
  query: DashboardAnalyticsQuery,
): Promise<DashboardAnalytics> {
  const days = RANGE_DAYS[query.range];
  const now = new Date();
  const rangeStart = startOfDayUtc(new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000));
  const weekStart = startOfDayUtc(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000));

  const [totalItems, negativeItems, newThisWeek, rangeItems, topThemeRows] =
    await db.$transaction([
      db.feedback.count({ where: { workspaceId } }),
      db.feedback.count({ where: { workspaceId, sentiment: "NEG" } }),
      db.feedback.count({ where: { workspaceId, createdAt: { gte: weekStart } } }),
      db.feedback.findMany({
        where: { workspaceId, createdAt: { gte: rangeStart } },
        select: { createdAt: true, sentiment: true },
      }),
      db.feedbackTheme.groupBy({
        by: ["themeId"],
        where: { workspaceId, feedback: { createdAt: { gte: rangeStart } } },
        _count: { themeId: true },
        orderBy: { _count: { themeId: "desc" } },
        take: 5,
      }),
    ]);

  // Volume over time — one bucket per day across the selected range.
  const volumeByDay = new Map<string, number>();
  for (let i = 0; i < days; i += 1) {
    const day = new Date(rangeStart.getTime() + i * 24 * 60 * 60 * 1000);
    volumeByDay.set(toIsoDate(day), 0);
  }

  const sentimentBreakdown: DashboardSentimentBreakdown = {
    positive: 0,
    neutral: 0,
    negative: 0,
    unclassified: 0,
  };

  for (const item of rangeItems) {
    const key = toIsoDate(startOfDayUtc(item.createdAt));
    if (volumeByDay.has(key)) {
      volumeByDay.set(key, (volumeByDay.get(key) ?? 0) + 1);
    }

    switch (item.sentiment) {
      case "POSITIVE":
        sentimentBreakdown.positive += 1;
        break;
      case "NEUTRAL":
        sentimentBreakdown.neutral += 1;
        break;
      case "NEG":
        sentimentBreakdown.negative += 1;
        break;
      default:
        sentimentBreakdown.unclassified += 1;
    }
  }

  const volumeOverTime: DashboardVolumePoint[] = Array.from(volumeByDay.entries()).map(
    ([date, count]) => ({ date, count }),
  );

  const themeIds = topThemeRows.map((row: { themeId: string }) => row.themeId);
  const themes: { id: string; name: string; color: string }[] = themeIds.length
    ? await db.theme.findMany({
        where: { id: { in: themeIds } },
        select: { id: true, name: true, color: true },
      })
    : [];
  const themeById = new Map(themes.map((theme) => [theme.id, theme]));

  const topThemes = topThemeRows
    .map((row: { themeId: string; _count: { themeId: number } }) => {
      const theme = themeById.get(row.themeId);
      if (!theme) {
        return null;
      }
      return {
        themeId: theme.id,
        name: theme.name,
        color: theme.color,
        count: row._count.themeId,
      };
    })
    .filter((value: unknown): value is NonNullable<typeof value> => value !== null);

  const negativePercentage = totalItems === 0 ? 0 : Math.round((negativeItems / totalItems) * 1000) / 10;

  return {
    range: query.range,
    stats: {
      totalItems,
      negativePercentage,
      newThisWeek,
    },
    volumeOverTime,
    sentimentBreakdown,
    topThemes,
  };
}