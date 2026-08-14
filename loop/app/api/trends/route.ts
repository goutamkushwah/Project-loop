import "server-only";

import { NextRequest, NextResponse } from "next/server";

import { getCurrentApiUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateTrendInsight, type TrendMovement } from "@/lib/trend-insight";

type Range = "weekly" | "monthly";

type BucketRow = {
  bucket: Date;
  themeId: string;
  themeName: string;
  count: bigint;
};

export async function GET(req: NextRequest) {
  // --- Auth guard: uses the same helper every other API route in the app uses ---
  const currentUser = await getCurrentApiUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const workspaceId = currentUser.workspaceId;

  const { searchParams } = new URL(req.url);
  const range: Range = searchParams.get("range") === "monthly" ? "monthly" : "weekly";
  const truncUnit = range === "monthly" ? "month" : "week";
  const periodsBack = range === "monthly" ? 6 : 8; // 6 months or 8 weeks of history

  // --- Bucketed theme volume, scoped to workspaceId (tenant isolation) ---
  // FeedbackTheme already carries workspaceId directly (per your schema), so
  // that join condition is included as a belt-and-braces extra scope check.
  const rows = await db.$queryRawUnsafe<BucketRow[]>(
    `
    SELECT
      date_trunc($1, f."createdAt") AS bucket,
      t.id   AS "themeId",
      t.name AS "themeName",
      COUNT(*)::bigint AS count
    FROM "Feedback" f
    JOIN "FeedbackTheme" ft
      ON ft."feedbackId" = f.id
     AND ft."workspaceId" = f."workspaceId"
    JOIN "Theme" t
      ON t.id = ft."themeId"
    WHERE f."workspaceId" = $2::uuid
      AND f."createdAt" >= date_trunc($1, NOW()) - ($3 || ' ' || $1 || 's')::interval
    GROUP BY bucket, t.id, t.name
    ORDER BY bucket ASC;
    `,
    truncUnit,
    workspaceId,
    periodsBack
  );

  // --- Reshape into chart-friendly rows: [{ bucket, ThemeA: 4, ThemeB: 2 }, ...] ---
  const seriesByBucket = new Map<string, Record<string, number | string>>();
  const themeNames = new Set<string>();

  for (const row of rows) {
    const key = row.bucket.toISOString();
    if (!seriesByBucket.has(key)) seriesByBucket.set(key, { bucket: key });
    seriesByBucket.get(key)![row.themeName] = Number(row.count);
    themeNames.add(row.themeName);
  }

  const orderedBuckets = Array.from(seriesByBucket.keys()).sort();
  const chartData = orderedBuckets.map((b) => seriesByBucket.get(b)!);

  // --- Spike / drop detection: latest bucket vs the one before it ---
  const latestKey = orderedBuckets[orderedBuckets.length - 1];
  const previousKey = orderedBuckets[orderedBuckets.length - 2];

  const spikes: TrendMovement[] = [];
  const drops: TrendMovement[] = [];

  if (latestKey && previousKey) {
    const latest = seriesByBucket.get(latestKey)!;
    const previous = seriesByBucket.get(previousKey)!;

    for (const theme of themeNames) {
      const curr = Number(latest[theme] ?? 0);
      const prev = Number(previous[theme] ?? 0);
      if (curr === 0 && prev === 0) continue;

      const change = prev === 0 ? 100 : Math.round(((curr - prev) / prev) * 100);

      // Ignore noise from tiny counts (0 -> 1 item isn't a real "spike")
      if (change >= 30 && curr >= 3) {
        spikes.push({ theme, change, count: curr });
      } else if (change <= -30 && prev >= 3) {
        drops.push({ theme, change, count: curr });
      }
    }
  }

  spikes.sort((a, b) => b.change - a.change);
  drops.sort((a, b) => a.change - b.change);

  // --- Gemini writes one sentence around the numbers above (never invents data) ---
  const insight = await generateTrendInsight({ range, spikes, drops });

  return NextResponse.json({
    range,
    chartData,
    themes: Array.from(themeNames),
    spikes,
    drops,
    insight,
  });
}