import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/insights/dashboard
// Returns everything the dashboard page needs in one round trip:
// sentiment breakdown, top themes with counts, and stat-card numbers.
// Every query below is filtered by workspaceId from the session — never
// from a query param or the request body — so one tenant can never read
// another tenant's numbers (see System Architecture "non-negotiable
// security rule").
export async function GET() {
    const session = await getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }
    const { workspaceId } = session.user;

    const [sentimentGroups, themes, total, negative, weekAgo] = await Promise.all([
        prisma.feedback.groupBy({
            by: ["sentiment"],
            where: { workspaceId },
            _count: { _all: true },
        }),
        prisma.theme.findMany({
            where: { workspaceId },
            include: { _count: { select: { feedbackThemes: true } } },
        }),
        prisma.feedback.count({ where: { workspaceId } }),
        prisma.feedback.count({ where: { workspaceId, sentiment: "NEGATIVE" } }),
        prisma.feedback.count({
            where: { workspaceId, createdAt: { gte: new Date(Date.now() - 7 * 86400000) } },
        }),
    ]);

    return NextResponse.json({
        sentiment: sentimentGroups.map((g) => ({
            sentiment: g.sentiment,
            count: g._count._all,
        })),
        themes: themes.map((t) => ({
            id: t.id,
            name: t.name,
            count: t._count.feedbackThemes,
            color: t.color,
        })),
        stats: {
            total,
            negativePct: total > 0 ? Math.round((negative / total) * 100) : 0,
            newThisWeek: weekAgo,
        },
    });
}