import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type HealthResponse = {
  service: "loop";
  status: "healthy" | "unhealthy";
  database: "connected" | "unavailable";
  checkedAt: string;
  latencyMs: number;
};

export async function GET(): Promise<NextResponse<HealthResponse>> {
  const startedAt = performance.now();

  try {
    await db.$queryRaw`SELECT 1`;

    return NextResponse.json(
      {
        service: "loop",
        status: "healthy",
        database: "connected",
        checkedAt: new Date().toISOString(),
        latencyMs: Math.round(performance.now() - startedAt),
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch {
    return NextResponse.json(
      {
        service: "loop",
        status: "unhealthy",
        database: "unavailable",
        checkedAt: new Date().toISOString(),
        latencyMs: Math.round(performance.now() - startedAt),
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  }
}