import "server-only";

import Anthropic from "@anthropic-ai/sdk";

import { env } from "@/lib/env";

export const CLAUDE_CLASSIFICATION_MODEL = "claude-sonnet-4-6" as const;

let anthropicClient: Anthropic | null = null;

export class AiConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiConfigurationError";
  }
}

export function isAiConfigured(): boolean {
  return Boolean(env.ANTHROPIC_API_KEY);
}

export function getAnthropicClient(): Anthropic {
  if (!env.ANTHROPIC_API_KEY) {
    throw new AiConfigurationError(
      "ANTHROPIC_API_KEY is not configured for this environment.",
    );
  }

  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: env.ANTHROPIC_API_KEY,
      maxRetries: 2,
      timeout: 30_000,
    });
  }

  return anthropicClient;
}