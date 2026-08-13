import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  getThemeDetails,
  getThemeFeedback,
} from "@/services/theme-service";

type RouteContext = {
  params: Promise<{
    themeId: string;
  }>;
};

async function getWorkspaceId(userId: string) {
  const user = await db.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      workspaceId: true,
    },
  });

  return user?.workspaceId;
}

export async function GET(
  request: Request,
  context: RouteContext,
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { themeId } = await context.params;

    const workspaceId = await getWorkspaceId(
      session.user.id,
    );

    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 },
      );
    }

    const url = new URL(request.url);
    const drillDown =
      url.searchParams.get("drillDown") === "true";

    if (drillDown) {
      const result = await getThemeFeedback(
        workspaceId,
        themeId,
      );

      if (!result) {
        return NextResponse.json(
          { error: "Theme not found" },
          { status: 404 },
        );
      }

      return NextResponse.json(result);
    }

    const theme = await getThemeDetails(
      workspaceId,
      themeId,
    );

    if (!theme) {
      return NextResponse.json(
        { error: "Theme not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      theme,
    });
  } catch (error) {
    console.error("Theme details API error:", error);

    return NextResponse.json(
      {
        error: "Failed to load theme details",
      },
      { status: 500 },
    );
  }
}