import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { requirePagePermission } from "@/lib/authorization";
import { PERMISSIONS } from "@/lib/rbac";
import { embedQuery } from "@/services/embedding-service";

const GEMINI_CHAT_MODEL = "gemini-3.5-flash";
const TOP_K = 6;

const askSchema = z.object({
  question: z.string().min(3).max(500),
});

async function askGemini(question: string, context: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const prompt = `You are Ask LOOP, an assistant answering questions about customer feedback for a product team.
Use ONLY the feedback excerpts below to answer. If the excerpts don't contain the answer, say so honestly.
Cite specific feedback by its [n] number when you use it.

Feedback excerpts:
${context}

Question: ${question}

Answer:`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_CHAT_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }),
    },
  );

  if (!res.ok) {
    throw new Error(
      `Gemini chat generation failed: ${res.status} ${await res.text()}`,
    );
  }

  const data = await res.json();

  return (
    data.candidates?.[0]?.content?.parts?.[0]?.text ??
    "No answer generated."
  );
}

export async function POST(request: Request) {
  try {
    const user = await requirePagePermission(PERMISSIONS.DASHBOARD_READ);

    const body = await request.json();
    const parsed = askSchema.safeParse(body);

    if (!parsed.success) {
      console.log("ASK VALIDATION FAILED:", parsed.error.flatten());

      return NextResponse.json(
        {
          success: false,
          error: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { question } = parsed.data;
    const workspaceId = user.workspaceId;

    console.log("ASK QUESTION:", question, "WORKSPACE:", workspaceId);

    const queryVector = await embedQuery(question);
    const vectorLiteral = `[${queryVector.join(",")}]`;

    const matches = await db.$queryRaw<
      {
        feedbackId: string;
        content: string;
        channel: string;
        distance: number;
      }[]
    >`
      SELECT
        f.id as "feedbackId",
        f.content,
        f.channel::text as channel,
        e.vector <=> ${vectorLiteral}::vector as distance
      FROM "Embedding" e
      JOIN "Feedback" f ON f.id = e."feedbackId"
      WHERE e."workspaceId" = ${workspaceId}::uuid
      ORDER BY e.vector <=> ${vectorLiteral}::vector
      LIMIT ${TOP_K}
    `;

    console.log("ASK MATCHES FOUND:", matches.length);

    if (matches.length === 0) {
      return NextResponse.json({
        success: true,
        answer: "No feedback has been embedded yet, so I can't answer that.",
        sources: [],
      });
    }

    const context = matches
      .map((m, i) => `[${i + 1}] (${m.channel}) ${m.content}`)
      .join("\n\n");

    const answer = await askGemini(question, context);

    console.log("ASK ANSWER GENERATED");

    await db.searchHistory.create({
      data: {
        workspaceId,
        userId: user.id,
        question,
        answer,
      },
    });

    return NextResponse.json({
      success: true,
      answer,
      sources: matches.map((m, i) => ({
        index: i + 1,
        feedbackId: m.feedbackId,
        channel: m.channel,
        excerpt: m.content.slice(0, 200),
        similarity: (1 - m.distance).toFixed(3),
      })),
    });
  } catch (error) {
    console.error("ASK FAILED:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unknown error while answering question";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      {
        status: 500,
      },
    );
  }
}