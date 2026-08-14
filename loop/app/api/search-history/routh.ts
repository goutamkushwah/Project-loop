import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json(
        {
          success: false,
          error: "workspaceId is required",
        },
        { status: 400 },
      );
    }

    console.log("SEARCH-HISTORY FETCH:", workspaceId);

    const history = await db.searchHistory.findMany({
      where: {
        workspaceId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      history,
    });
  } catch (error) {
    console.error("SEARCH-HISTORY FETCH FAILED:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unknown error fetching search history";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 },
    );
  }
}