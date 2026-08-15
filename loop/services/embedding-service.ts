//import "server-only";

import { GoogleGenAI } from "@google/genai";

const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMENSIONS = 768;

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not configured");
}

const ai = new GoogleGenAI({
  apiKey,
});

export async function embedText(text: string): Promise<number[]> {
  const value = text.trim();

  if (!value) {
    throw new Error("Cannot generate embedding for empty text");
  }

  const response = await ai.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: value,
    config: {
      outputDimensionality: EMBEDDING_DIMENSIONS,
    },
  });

  const embedding = response.embeddings?.[0]?.values;

  if (!embedding || embedding.length === 0) {
    throw new Error("Gemini returned an empty embedding");
  }

  if (embedding.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Invalid embedding dimensions: expected ${EMBEDDING_DIMENSIONS}, received ${embedding.length}`,
    );
  }

  return embedding;
}

export async function embedQuery(question: string): Promise<number[]> {
  return embedText(question);
}

export async function embedFeedback(feedback: string): Promise<number[]> {
  return embedText(feedback);
}

export const EMBEDDING_PROVIDER = "google";
export const EMBEDDING_MODEL_NAME = EMBEDDING_MODEL;
export const EMBEDDING_DIMENSION = EMBEDDING_DIMENSIONS;