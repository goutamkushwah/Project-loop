import { ApiError } from "@google/genai";

import {
  GEMINI_EMBEDDING_DIMENSIONS,
  GEMINI_EMBEDDING_MODEL,
  gemini,
} from "@/lib/gemini";

export class EmbeddingProviderError extends Error {
  constructor(
    message: string,
    public readonly status: number | null,
    public readonly retryable: boolean,
  ) {
    super(message);
    this.name = "EmbeddingProviderError";
  }
}

function normalizeEmbeddingProviderError(
  error: unknown,
): EmbeddingProviderError {
  // Log the original Gemini error so we can identify the real problem.
  console.error("RAW GEMINI EMBEDDING ERROR:", error);

  if (error instanceof ApiError) {
    const status = typeof error.status === "number" ? error.status : null;

    const retryable =
      status === 408 || status === 429 || (status !== null && status >= 500);

    console.error("GEMINI API ERROR:", {
      status,
      message: error.message,
      name: error.name,
    });

    return new EmbeddingProviderError(
      retryable
        ? "Google Gemini embeddings are temporarily unavailable."
        : "Google Gemini rejected the embedding request.",
      status,
      retryable,
    );
  }

  if (error instanceof Error) {
    console.error("GEMINI ERROR DETAILS:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
  } else {
    console.error("UNKNOWN GEMINI ERROR:", error);
  }

  return new EmbeddingProviderError(
    "Google Gemini embedding generation failed unexpectedly.",
    null,
    true,
  );
}

function validateVector(values: readonly number[] | undefined): number[] {
  if (!values || values.length !== GEMINI_EMBEDDING_DIMENSIONS) {
    throw new EmbeddingProviderError(
      `Gemini returned an embedding with an unexpected dimension count. Expected ${GEMINI_EMBEDDING_DIMENSIONS}.`,
      null,
      false,
    );
  }

  if (values.some((value) => !Number.isFinite(value))) {
    throw new EmbeddingProviderError(
      "Gemini returned an embedding containing a non-finite value.",
      null,
      false,
    );
  }

  return Array.from(values);
}

function prepareFeedbackDocument(content: string): string {
  return `title: Customer feedback | text: ${content}`;
}

function prepareQuestion(question: string): string {
  return `task: question answering | query: ${question}`;
}

export async function embedFeedbackDocuments(
  contents: readonly string[],
): Promise<number[][]> {
  if (contents.length === 0) {
    return [];
  }

  try {
    const response = await gemini.models.embedContent({
      model: GEMINI_EMBEDDING_MODEL,
      contents: contents.map((content) => ({
        role: "user",
        parts: [{ text: prepareFeedbackDocument(content) }],
      })),
      config: {
        outputDimensionality: GEMINI_EMBEDDING_DIMENSIONS,
      },
    });

    const embeddings = response.embeddings ?? [];

    if (embeddings.length !== contents.length) {
      throw new EmbeddingProviderError(
        "Gemini returned an unexpected number of document embeddings.",
        null,
        false,
      );
    }

    return embeddings.map((embedding) => validateVector(embedding.values));
  } catch (error: unknown) {
    if (error instanceof EmbeddingProviderError) {
      throw error;
    }

    throw normalizeEmbeddingProviderError(error);
  }
}

export async function embedAskLoopQuestion(
  question: string,
): Promise<number[]> {
  try {
    const response = await gemini.models.embedContent({
      model: GEMINI_EMBEDDING_MODEL,
      contents: prepareQuestion(question),
      config: {
        outputDimensionality: GEMINI_EMBEDDING_DIMENSIONS,
      },
    });

    return validateVector(response.embeddings?.[0]?.values);
  } catch (error: unknown) {
    if (error instanceof EmbeddingProviderError) {
      throw error;
    }

    throw normalizeEmbeddingProviderError(error);
  }
}