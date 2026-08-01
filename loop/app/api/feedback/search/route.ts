import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/search-history — last 20 searches for the logged-in user in their workspace
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const history = await prisma.searchHistory.findMany({
        where: {
            userId: session.user.id,
            workspaceId: session.user.workspaceId,
        },
        orderBy: { createdAt: "desc" },
        take: 20,
    });

    return NextResponse.json({ history });
}

// DELETE /api/search-history?id=xxx  -> delete one entry
// DELETE /api/search-history?all=true -> clear all history for this user
export async function DELETE(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const all = url.searchParams.get("all");

    if (all === "true") {
        await prisma.searchHistory.deleteMany({
            where: { userId: session.user.id, workspaceId: session.user.workspaceId },
        });
        return NextResponse.json({ success: true, cleared: true });
    }

    if (!id) {
        return NextResponse.json({ error: "Provide ?id= or ?all=true" }, { status: 400 });
    }

    // Only delete if it belongs to this user — prevents deleting someone else's history
    const entry = await prisma.searchHistory.findFirst({
        where: { id, userId: session.user.id, workspaceId: session.user.workspaceId },
    });
    if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.searchHistory.delete({ where: { id } });
    return NextResponse.json({ success: true });
}