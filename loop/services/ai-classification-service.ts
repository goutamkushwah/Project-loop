import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import type { ZodError } from "zod";

import { AiConfigurationError, CLAUDE_CLASSIFICATION_MODEL, getAnthropicClient } from "@/lib/ai";
import {
  buildClassificationPrompt,
  buildClassificationRepairPrompt,
  CLASSIFICATION_SYSTEM_PROMPT,
} from "@/lib/ai-prompts";
import { feedbackClassificationSchema } from "@/lib/ai-validation";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import type {
  ClassificationPreviewResult,
  ClassificationThemeContext,
  FeedbackClassification,
} from "@/types/ai";

const MAX_CLASSIFICATION_ATTEMPTS = 2;
const MAX_OUTPUT_TOKENS = 900;

export type AiServiceErrorCode =
  | "AI_NOT_CONFIGURED"
  | "AI_AUTHENTICATION_FAILED"
  | "AI_RATE_LIMITED"
  | "AI_PROVIDER_UNAVAILABLE"
  | "AI_RESPONSE_INVALID"
  | "AI_REQUEST_FAILED";

export class AiServiceError extends Error {
  readonly code: AiServiceErrorCode;
  readonly status: number;

  constructor(code: AiServiceErrorCode, message: string, status: number) {
    super(message);
    this.name = "AiServiceError";
    this.code = code;
    this.status = status;
  }
}

function extractTextContent(message: Anthropic.Message): string {
  return message.content
    .flatMap((block) => (block.type === "text" ? [block.text] : []))
    .join("\n")
    .trim();
}

function stripMarkdownFences(value: string): string {
  const trimmed = value.trim();
  const withoutOpeningFence = trimmed.replace(/^```(?:json)?\s*/i, "");
  const withoutClosingFence = withoutOpeningFence.replace(/\s*```$/i, "").trim();
  const firstBrace = withoutClosingFence.indexOf("{");
  const lastBrace = withoutClosingFence.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
    return withoutClosingFence;
  }

  return withoutClosingFence.slice(firstBrace, lastBrace + 1);
}

function validationMessages(error: ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join(".") : "classification";
    return `${path}: ${issue.message}`;
  });
}

function parseClassification(
  rawOutput: string,
): { ok: true; classification: FeedbackClassification } | { ok: false; errors: string[] } {
  const normalized = stripMarkdownFences(rawOutput);
  let parsed: unknown;

  try {
    parsed = JSON.parse(normalized);
  } catch {
    return {
      ok: false,
      errors: ["response: Claude did not return parseable JSON."],
    };
  }

  const validated = feedbackClassificationSchema.safeParse(parsed);

  if (!validated.success) {
    return {
      ok: false,
      errors: validationMessages(validated.error),
    };
  }

  return {
    ok: true,
    classification: validated.data,
  };
}

function mapProviderError(error: unknown): AiServiceError {
  if (error instanceof AiConfigurationError) {
    return new AiServiceError("AI_NOT_CONFIGURED", error.message, 503);
  }

  if (error instanceof Anthropic.AuthenticationError) {
    return new AiServiceError(
      "AI_AUTHENTICATION_FAILED",
      "Claude authentication failed. Verify the server-side API key.",
      502,
    );
  }

  if (error instanceof Anthropic.RateLimitError) {
    return new AiServiceError(
      "AI_RATE_LIMITED",
      "Claude is rate-limiting requests. Wait briefly and try again.",
      429,
    );
  }

  if (
    error instanceof Anthropic.APIConnectionError ||
    error instanceof Anthropic.InternalServerError
  ) {
    return new AiServiceError(
      "AI_PROVIDER_UNAVAILABLE",
      "Claude is temporarily unavailable. Try again shortly.",
      503,
    );
  }

  if (error instanceof Anthropic.APIError) {
    return new AiServiceError(
      "AI_REQUEST_FAILED",
      "Claude rejected the classification request.",
      502,
    );
  }

  return new AiServiceError(
    "AI_REQUEST_FAILED",
    "The classification request could not be completed.",
    502,
  );
}

async function getWorkspaceThemeContext(
  workspaceId: string,
): Promise<ClassificationThemeContext[]> {
  return db.theme.findMany({
    where: {
      workspaceId,
    },
    select: {
      name: true,
      description: true,
    },
    orderBy: {
      name: "asc",
    },
    take: 100,
  });
}

export async function getClassificationThemeCatalog(
  workspaceId: string,
): Promise<ClassificationThemeContext[]> {
  return getWorkspaceThemeContext(workspaceId);
}

type ClassifyPreviewOptions = {
  workspaceId: string;
  userId: string;
  content: string;
};

export async function classifyFeedbackPreview({
  workspaceId,
  userId,
  content,
}: ClassifyPreviewOptions): Promise<ClassificationPreviewResult> {
  const startedAt = performance.now();
  const themes = await getWorkspaceThemeContext(workspaceId);
  const client = getAnthropicClient();
  let invalidOutput = "";
  let validationErrors: string[] = [];
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let providerRequestId: string | null = null;

  for (let attempt = 1; attempt <= MAX_CLASSIFICATION_ATTEMPTS; attempt += 1) {
    const prompt =
      attempt === 1
        ? buildClassificationPrompt(content, themes)
        : buildClassificationRepairPrompt(content, themes, invalidOutput, validationErrors);

    logger.info("ai.classification.requested", {
      workspaceId,
      userId,
      model: CLAUDE_CLASSIFICATION_MODEL,
      attempt,
      existingThemeCount: themes.length,
      contentLength: content.length,
    });

    try {
      const message = await client.messages.create({
        model: CLAUDE_CLASSIFICATION_MODEL,
        max_tokens: MAX_OUTPUT_TOKENS,
        temperature: 0,
        system: CLASSIFICATION_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      totalInputTokens += message.usage.input_tokens;
      totalOutputTokens += message.usage.output_tokens;
      providerRequestId =
        (message as Anthropic.Message & { _request_id?: string })._request_id ?? null;
      invalidOutput = extractTextContent(message);
      const parsed = parseClassification(invalidOutput);

      if (parsed.ok) {
        const latencyMs = Math.round(performance.now() - startedAt);

        logger.info("ai.classification.completed", {
          workspaceId,
          userId,
          model: CLAUDE_CLASSIFICATION_MODEL,
          attempt,
          latencyMs,
          inputTokens: totalInputTokens,
          outputTokens: totalOutputTokens,
          providerRequestId,
        });

        return {
          classification: parsed.classification,
          metadata: {
            model: CLAUDE_CLASSIFICATION_MODEL,
            attempts: attempt,
            existingThemeCount: themes.length,
            inputTokens: totalInputTokens,
            outputTokens: totalOutputTokens,
            latencyMs,
            providerRequestId,
          },
        };
      }

      validationErrors = parsed.errors;

      logger.warn("ai.classification.validation_failed", {
        workspaceId,
        userId,
        model: CLAUDE_CLASSIFICATION_MODEL,
        attempt,
        validationErrorCount: validationErrors.length,
        providerRequestId,
      });
    } catch (error: unknown) {
      console.error("FULL ANTHROPIC ERROR:");
      console.dir(error, { depth: null });

      const mappedError = mapProviderError(error);

      logger.error("ai.classification.provider_failed", {
        workspaceId,
        userId,
        model: CLAUDE_CLASSIFICATION_MODEL,
        attempt,
        code: mappedError.code,
        status: mappedError.status,
      });

      throw mappedError;
    }
  }

  logger.error("ai.classification.invalid_after_retry", {
    workspaceId,
    userId,
    model: CLAUDE_CLASSIFICATION_MODEL,
    attempts: MAX_CLASSIFICATION_ATTEMPTS,
    validationErrorCount: validationErrors.length,
    providerRequestId,
  });

  throw new AiServiceError(
    "AI_RESPONSE_INVALID",
    "Claude returned an invalid classification after one repair attempt.",
    502,
  );
}
