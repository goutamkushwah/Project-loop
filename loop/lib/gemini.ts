//import "server-only";

import { GoogleGenAI } from "@google/genai";

import { env } from "@/lib/env";

export const GEMINI_CLASSIFICATION_MODEL =
  "gemini-3.6-flash" as const;

export const GEMINI_API_VERSION = "v1" as const;

const globalForGemini = globalThis as unknown as {
  loopGeminiClient: GoogleGenAI | undefined;
};

export const gemini =
  globalForGemini.loopGeminiClient ??
  new GoogleGenAI({
    apiKey: env.GEMINI_API_KEY,
    httpOptions: {
      apiVersion: GEMINI_API_VERSION,
    },
  });

if (env.NODE_ENV !== "production") {
  globalForGemini.loopGeminiClient = gemini;
}