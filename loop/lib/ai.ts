import "server-only";

import { ApiError } from "@google/genai";

import {
  buildFeedbackClassificationPrompt,
  FEEDBACK_CLASSIFICATION_SYSTEM_INSTRUCTION,
} from "@/lib/ai-prompts";
import {
  feedbackClassificationJsonSchema,
  feedbackClassificationSchema,
  type FeedbackClassificationOutput,
} from "@/lib/ai-schemas";
import { GEMINI_CLASSIFICATION_MODEL, gemini } from "@/lib/gemini";
import type {
  AiTokenUsage,
  FeedbackClassificationResult,
} from "@/types/ai";

const PROVIDER = "GOOGLE_GEMINI" as const;
const MAX_CLASSIFICATION_ATTEMPTS = 2;

export class AiProviderError extends Error {
  constructor(
    message: string,
    public readonly status: number | null,
    public readonly retryable: boolean,
  ) {
    super(message);
    this.name = "AiProviderError";
  }
}

type ClassifyFeedbackInput = {
  content: string;
  existingThemeNames: readonly string[];
};

type ParseClassificationResult =
  | {
      ok: true;
      value: FeedbackClassificationOutput;
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

function parseClassificationOutput(rawText: string): ParseClassificationResult {
  const cleaned = stripMarkdownCodeFence(rawText);

  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(cleaned);
  } catch {
    return {
      ok: false,
      message: "Gemini returned a response that was not valid JSON.",
    };
  }

  const validated = feedbackClassificationSchema.safeParse(parsedJson);

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

function normalizeProviderError(error: unknown): AiProviderError {
  if (error instanceof ApiError) {
    const retryable = error.status === 408 || error.status === 429 || error.status >= 500;

    return new AiProviderError(
      retryable
        ? "Google Gemini is temporarily unavailable."
        : "Google Gemini rejected the classification request.",
      error.status,
      retryable,
    );
  }

  return new AiProviderError("Google Gemini classification failed unexpectedly.", null, true);
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
      const providerError = normalizeProviderError(error);

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