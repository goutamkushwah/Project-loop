import "server-only";

import Anthropic from "@anthropic-ai/sdk";

import { env } from "@/lib/env";

const globalForClaude = globalThis as unknown as {
  anthropicClient: Anthropic | undefined;
};

// Model used for structured feedback classification. Kept in one place so it
// can be bumped without touching call sites.
export const CLASSIFICATION_MODEL = "claude-sonnet-4-6";

export function getClaudeClient(): Anthropic {
  if (!env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY is not configured. Add it to .env to enable AI classification.",
    );
  }

  if (!globalForClaude.anthropicClient) {
    globalForClaude.anthropicClient = new Anthropic({
      apiKey: env.ANTHROPIC_API_KEY,
    });
  }

  return globalForClaude.anthropicClient;
}
