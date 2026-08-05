import Anthropic from "@anthropic-ai/sdk";

export const CLASSIFICATION_MODEL = "claude-3-5-haiku-latest";

let client: Anthropic | null = null;

export function getClaudeClient() {
  if (!client) {
    client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });
  }

  return client;
}