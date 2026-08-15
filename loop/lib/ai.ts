import "server-only";

import { ApiError } from "@google/genai";

import {
  buildFeedbackBatchClassificationPrompt,
  buildFeedbackClassificationPrompt,
  FEEDBACK_BATCH_CLASSIFICATION_SYSTEM_INSTRUCTION,
  FEEDBACK_CLASSIFICATION_SYSTEM_INSTRUCTION,
} from "@/lib/ai-prompts";
import {
  AI_CLASSIFICATION_BATCH_SIZE,
  feedbackBatchClassificationJsonSchema,
  feedbackBatchClassificationSchema,
  feedbackClassificationJsonSchema,
  feedbackClassificationSchema,
  type FeedbackBatchClassificationOutput,
  type FeedbackClassificationOutput,
} from "@/lib/ai-schemas";
import { GEMINI_CLASSIFICATION_MODEL, gemini } from "@/lib/gemini";
import type {
  AiTokenUsage,
  FeedbackBatchClassificationResult,
  FeedbackClassificationResult,
} from "@/types/ai";

const PROVIDER = "GOOGLE_GEMINI" as const;
const MAX_CLASSIFICATION_ATTEMPTS = 2;

export class AiProviderError extends Error {
  constructor(
    message: string,
    public readonly status: number | null,
    public readonly retryable: boolean,
    public readonly attempts: number,
  ) {
    super(message);
    this.name = "AiProviderError";
  }
}

type ClassifyFeedbackInput = {
  content: string;
  existingThemeNames: readonly string[];
};

type ClassifyFeedbackBatchInput = {
  items: readonly {
    feedbackId: string;
    content: string;
  }[];
  existingThemeNames: readonly string[];
};

type ParseClassificationResult<T> =
  | {
      ok: true;
      value: T;
    }
  | {
      ok: false;
      message: string;
    };

function stripMarkdownCodeFence(value: string): string {
  const trimmed = value.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);

  return fenced?.[1]?.trim() ?? trimmed;
}

function parseJson(rawText: string): ParseClassificationResult<unknown> {
  const cleaned = stripMarkdownCodeFence(rawText);

  try {
    return {
      ok: true,
      value: JSON.parse(cleaned) as unknown,
    };
  } catch {
    return {
      ok: false,
      message: "Gemini returned a response that was not valid JSON.",
    };
  }
}

function parseClassificationOutput(
  rawText: string,
): ParseClassificationResult<FeedbackClassificationOutput> {
  const parsedJson = parseJson(rawText);

  if (!parsedJson.ok) {
    return parsedJson;
  }

  const validated = feedbackClassificationSchema.safeParse(parsedJson.value);

  if (!validated.success) {
    return {
      ok: false,
      message: `Gemini returned JSON that did not match LOOP's classification schema: ${validated.error.issues
        .map((issue) => `${issue.path.join(".") || "response"}: ${issue.message}`)
        .join("; ")}`,
    };
  }

  return {
    ok: true,
    value: validated.data,
  };
}

function parseBatchClassificationOutput(
  rawText: string,
  expectedFeedbackIds: readonly string[],
): ParseClassificationResult<FeedbackBatchClassificationOutput> {
  const parsedJson = parseJson(rawText);

  if (!parsedJson.ok) {
    return parsedJson;
  }

  const validated = feedbackBatchClassificationSchema.safeParse(parsedJson.value);

  if (!validated.success) {
    return {
      ok: false,
      message: `Gemini returned JSON that did not match LOOP's batch-classification schema: ${validated.error.issues
        .map((issue) => `${issue.path.join(".") || "response"}: ${issue.message}`)
        .join("; ")}`,
    };
  }

  const expectedIds = new Set(expectedFeedbackIds);
  const returnedIds = validated.data.items.map((item) => item.feedbackId);
  const uniqueReturnedIds = new Set(returnedIds);

  if (
    returnedIds.length !== expectedFeedbackIds.length ||
    uniqueReturnedIds.size !== returnedIds.length ||
    returnedIds.some((feedbackId) => !expectedIds.has(feedbackId)) ||
    expectedFeedbackIds.some((feedbackId) => !uniqueReturnedIds.has(feedbackId))
  ) {
    return {
      ok: false,
      message:
        "Gemini returned a batch whose feedback identifiers did not exactly match the requested records.",
    };
  }

  return {
    ok: true,
    value: validated.data,
  };
}

function serializeUsageMetadata(
  usageMetadata:
    | {
        promptTokenCount?: number;
        candidatesTokenCount?: number;
        totalTokenCount?: number;
      }
    | undefined,
): AiTokenUsage {
  return {
    promptTokens: usageMetadata?.promptTokenCount ?? null,
    outputTokens: usageMetadata?.candidatesTokenCount ?? null,
    totalTokens: usageMetadata?.totalTokenCount ?? null,
  };
}

function normalizeProviderError(error: unknown, attempts: number): AiProviderError {
  if (error instanceof ApiError) {
    const status = typeof error.status === "number" ? error.status : null;
    const retryable =
      status === 408 || status === 429 || (status !== null && status >= 500);

    return new AiProviderError(
      retryable
        ? "Google Gemini is temporarily unavailable."
        : "Google Gemini rejected the classification request.",
      status,
      retryable,
      attempts,
    );
  }

  return new AiProviderError(
    "Google Gemini classification failed unexpectedly.",
    null,
    true,
    attempts,
  );
}

export async function classifyFeedback({
  content,
  existingThemeNames,
}: ClassifyFeedbackInput): Promise<FeedbackClassificationResult> {
  let lastInvalidOutputMessage = "Gemini did not return a usable classification.";

  for (let attempt = 1; attempt <= MAX_CLASSIFICATION_ATTEMPTS; attempt += 1) {
    try {
      const response = await gemini.models.generateContent({
        model: GEMINI_CLASSIFICATION_MODEL,
        contents: buildFeedbackClassificationPrompt({
          content,
          existingThemeNames,
        }),
        config: {
          systemInstruction: FEEDBACK_CLASSIFICATION_SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseJsonSchema: feedbackClassificationJsonSchema,
        },
      });

      const responseText = response.text?.trim();

      if (!responseText) {
        lastInvalidOutputMessage = "Gemini returned an empty classification response.";
        continue;
      }

      const parsed = parseClassificationOutput(responseText);

      if (!parsed.ok) {
        lastInvalidOutputMessage = parsed.message;
        continue;
      }

      return {
        ok: true,
        provider: PROVIDER,
        model: response.modelVersion ?? GEMINI_CLASSIFICATION_MODEL,
        attempts: attempt,
        classification: parsed.value,
        usage: serializeUsageMetadata(response.usageMetadata),
      };
    } catch (error: unknown) {
      const providerError = normalizeProviderError(error, attempt);

      if (attempt < MAX_CLASSIFICATION_ATTEMPTS && providerError.retryable) {
        continue;
      }

      throw providerError;
    }
  }

  return {
    ok: false,
    provider: PROVIDER,
    model: GEMINI_CLASSIFICATION_MODEL,
    attempts: MAX_CLASSIFICATION_ATTEMPTS,
    reason: "INVALID_MODEL_OUTPUT",
    message: lastInvalidOutputMessage,
  };
}

export async function classifyFeedbackBatch({
  items,
  existingThemeNames,
}: ClassifyFeedbackBatchInput): Promise<FeedbackBatchClassificationResult> {
  if (items.length === 0 || items.length > AI_CLASSIFICATION_BATCH_SIZE) {
    throw new RangeError(
      `Gemini classification batches must contain between 1 and ${AI_CLASSIFICATION_BATCH_SIZE} items.`,
    );
  }

  const expectedFeedbackIds = items.map((item) => item.feedbackId);
  let lastInvalidOutputMessage = "Gemini did not return a usable batch classification.";

  for (let attempt = 1; attempt <= MAX_CLASSIFICATION_ATTEMPTS; attempt += 1) {
    try {
      const response = await gemini.models.generateContent({
        model: GEMINI_CLASSIFICATION_MODEL,
        contents: buildFeedbackBatchClassificationPrompt({
          items,
          existingThemeNames,
        }),
        config: {
          systemInstruction: FEEDBACK_BATCH_CLASSIFICATION_SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseJsonSchema: feedbackBatchClassificationJsonSchema,
        },
      });

      const responseText = response.text?.trim();

      if (!responseText) {
        lastInvalidOutputMessage = "Gemini returned an empty batch-classification response.";
        continue;
      }

      const parsed = parseBatchClassificationOutput(responseText, expectedFeedbackIds);

      if (!parsed.ok) {
        lastInvalidOutputMessage = parsed.message;
        continue;
      }

      return {
        ok: true,
        provider: PROVIDER,
        model: response.modelVersion ?? GEMINI_CLASSIFICATION_MODEL,
        attempts: attempt,
        classifications: parsed.value.items,
        usage: serializeUsageMetadata(response.usageMetadata),
      };
    } catch (error: unknown) {
      const providerError = normalizeProviderError(error, attempt);

      if (attempt < MAX_CLASSIFICATION_ATTEMPTS && providerError.retryable) {
        continue;
      }

      throw providerError;
    }
  }

  return {
    ok: false,
    provider: PROVIDER,
    model: GEMINI_CLASSIFICATION_MODEL,
    attempts: MAX_CLASSIFICATION_ATTEMPTS,
    reason: "INVALID_MODEL_OUTPUT",
    message: lastInvalidOutputMessage,
  };
}