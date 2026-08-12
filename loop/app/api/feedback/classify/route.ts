import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { classifyFeedback } from "@/lib/ai";
import { ClassifyRequestSchema } from "@/lib/schemas";

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Viewers are read-only — RBAC enforced server-side, not just hidden in UI
    if (session.user.role === "VIEWER") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = ClassifyRequestSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { error: "Invalid request", issues: parsed.error.flatten() },
            { status: 400 }
        );
    }

    const { feedbackId, content, existingThemeNames } = parsed.data;

    // Tenant isolation: confirm this feedback actually belongs to the caller's workspace
    const feedback = await db.feedback.findFirst({
        where: { id: feedbackId, workspaceId: session.user.workspaceId },
    });
    if (!feedback) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    try {
        const result = await classifyFeedback(content, existingThemeNames);

        const updated = await db.feedback.update({
            where: { id: feedbackId },
            data: {
                sentiment: result.sentiment,
                sentimentScore: result.sentimentScore,
                // themes/featureArea linking handled in your theme-service — kept
                // out of this handler to keep business logic in lib/, not routes
            },
        });

        return NextResponse.json({ classification: result, feedback: updated });
    } catch {
        return NextResponse.json(
            { error: "Classification failed — flagged for manual review" },
            { status: 502 }
        );
    }
}