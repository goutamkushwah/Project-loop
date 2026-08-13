import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getThemeCounts } from "@/services/theme-service";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const user = await import("@/lib/db").then(({ db }) =>
      db.user.findUnique({
        where: {
          id: session.user.id,
        },
        select: {
          workspaceId: true,
        },
      }),
    );

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 },
      );
    }

    const themes = await getThemeCounts(user.workspaceId);

    return NextResponse.json({
      themes,
    });
  } catch (error) {
    console.error("Theme API error:", error);

    return NextResponse.json(
      {
        error: "Failed to load themes",
      },
      { status: 500 },
    );
  }
}