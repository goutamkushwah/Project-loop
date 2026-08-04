import "server-only";

import { CLASSIFICATION_MODEL, getClaudeClient } from "@/lib/claude-client";
import { buildClassificationPrompt } from "@/lib/classification-prompt";
import { parseClassificationResponse } from "@/lib/classification-schema";
import { db } from "@/lib/db";

const MAX_ATTEMPTS = 2;
const THEME_COLORS = [
  "#7c6ce7",
  "#0f9d58",
  "#dc2626",
  "#0ea5e9",
  "#d97706",
  "#db2777",
] as const;

export class ClassificationServiceError extends Error {}

function pickThemeColor(existingCount: number): string {
  return THEME_COLORS[existingCount % THEME_COLORS.length];
}

async function resolveThemeIds(workspaceId: string, themeNames: string[]): Promise<string[]> {
  const themeIds: string[] = [];

  for (const rawName of themeNames) {
    const name = rawName.trim().slice(0, 120);
    if (!name) {
      continue;
    }

    const existing = await db.theme.findUnique({
      where: { workspaceId_name: { workspaceId, name } },
      select: { id: true },
    });

    if (existing) {
      themeIds.push(existing.id);
      continue;
    }

    const themeCount = await db.theme.count({ where: { workspaceId } });
    const created = await db.theme.create({
      data: {
        workspaceId,
        name,
        description: `Auto-created from AI classification.`,
        color: pickThemeColor(themeCount),
      },
      select: { id: true },
    });
    themeIds.push(created.id);
  }

  return themeIds;
}

/**
 * Classifies a single feedback item using Claude and persists the result.
 * Retries once on a bad/unparseable response before flagging it for manual
 * review, so a single AI hiccup never silently loses a feedback item.
 */
export async function classifyFeedbackItem(
  workspaceId: string,
  feedbackId: string,
): Promise<void> {
  const feedback = await db.feedback.findFirst({
    where: { id: feedbackId, workspaceId },
    select: { id: true, content: true, channel: true, classificationAttempts: true },
  });

  if (!feedback) {
    throw new ClassificationServiceError("Feedback item not found in this workspace.");
  }

  await db.feedback.update({
    where: { id: feedback.id },
    data: { classificationStatus: "PROCESSING" },
  });

  const existingThemes = await db.theme.findMany({
    where: { workspaceId },
    select: { name: true },
    orderBy: { createdAt: "asc" },
    take: 25,
  });

  const { system, user } = buildClassificationPrompt({
    content: feedback.content,
    channel: feedback.channel,
    existingThemeNames: existingThemes.map((theme: { name: string }) => theme.name),
  });

  const attemptNumber = feedback.classificationAttempts + 1;

  try {
    const client = getClaudeClient();
    const response = await client.messages.create({
      model: CLASSIFICATION_MODEL,
      max_tokens: 500,
      system,
      messages: [{ role: "user", content: user }],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    const rawText = textBlock && "text" in textBlock ? textBlock.text : "";

    const parsed = parseClassificationResponse(rawText);

    if (!parsed.success) {
      throw new Error(parsed.error);
    }

    const themeIds = await resolveThemeIds(workspaceId, parsed.data.themes);

    await db.$transaction([
      db.feedback.update({
        where: { id: feedback.id },
        data: {
          sentiment: parsed.data.sentiment,
          sentimentScore: parsed.data.sentimentScore,
          featureArea: parsed.data.featureArea,
          classificationRationale: parsed.data.rationale,
          classificationStatus: "COMPLETED",
          classificationAttempts: attemptNumber,
          classificationError: null,
          classifiedAt: new Date(),
        },
      }),
      db.feedbackTheme.deleteMany({ where: { feedbackId: feedback.id } }),
      ...themeIds.map((themeId) =>
        db.feedbackTheme.create({
          data: {
            feedbackId: feedback.id,
            themeId,
            workspaceId,
            confidence: 0.8,
          },
        }),
      ),
    ]);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown classification error.";
    const status = attemptNumber >= MAX_ATTEMPTS ? "REVIEW_REQUIRED" : "FAILED";

    await db.feedback.update({
      where: { id: feedback.id },
      data: {
        classificationStatus: status,
        classificationAttempts: attemptNumber,
        classificationError: message.slice(0, 500),
      },
    });
  }
}
