import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type DatabaseHealthRow = {
  database_name: string;
  database_time: Date;
};

export async function GET(): Promise<NextResponse> {
  const checkedAt = new Date().toISOString();

  try {
    const result = await db.$queryRaw<DatabaseHealthRow[]>`
      SELECT
        current_database() AS database_name,
        CURRENT_TIMESTAMP AS database_time
    `;

    const database = result[0];

    if (!database) {
      throw new Error("PostgreSQL health query returned no rows.");
    }

    return NextResponse.json(
      {
        success: true,
        status: "healthy",
        service: "LOOP API",
        database: {
          connected: true,
          name: database.database_name,
          serverTime: database.database_time
        },
        checkedAt
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  } catch (error: unknown) {
    console.error("Database health check failed.", {
      checkedAt,
      error
    });

    return NextResponse.json(
      {
        success: false,
        status: "unhealthy",
        service: "LOOP API",
        database: {
          connected: false
        },
        message: "The application could not connect to its database.",
        checkedAt
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store"
        }
      }
    );
  }
}
