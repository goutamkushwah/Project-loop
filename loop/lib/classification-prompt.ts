import "server-only";

const SYSTEM_PROMPT = `You are the classification engine for LOOP, a customer-feedback intelligence platform.

You will be given one piece of raw customer feedback. Read it carefully and classify it.

Rules:
- Respond with ONLY a single JSON object. No prose, no markdown code fences, no explanation before or after.
- "sentiment" must be exactly one of: "POS", "NEU", "NEG".
- "sentimentScore" is a number from -1 (very negative) to 1 (very positive).
- "themes" is an array of 1 to 3 short theme names (Title Case, 1-4 words each, e.g. "Onboarding Friction"). Reuse a theme from the provided existing-themes list whenever the feedback genuinely matches it, instead of inventing a near-duplicate.
- "featureArea" is a short label (1-4 words) naming the product area the feedback is about (e.g. "Billing", "Mobile App", "Support Response Time").
- "rationale" is one short sentence (max 25 words) explaining the classification.
- If the feedback is empty, spam, or not actionable, still return your best-effort classification rather than omitting fields.`;

export type ClassificationPromptInput = {
  content: string;
  channel: string;
  existingThemeNames: string[];
};

export function buildClassificationPrompt(input: ClassificationPromptInput): {
  system: string;
  user: string;
} {
  const themeList =
    input.existingThemeNames.length > 0
      ? input.existingThemeNames.map((name) => `- ${name}`).join("\n")
      : "(no existing themes yet — you may propose new ones)";

  const user = `Existing themes in this workspace:
${themeList}

Feedback channel: ${input.channel}

Feedback content:
"""
${input.content}
"""

Return the JSON object now.`;

  return { system: SYSTEM_PROMPT, user };
}
