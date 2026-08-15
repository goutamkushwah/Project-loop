//import "server-only";

import { GEMINI_CLASSIFICATION_MODEL, gemini } from "@/lib/gemini";

export type TrendMovement = { theme: string; change: number; count: number };

/**
 * Turns pre-computed spike/drop numbers into a single plain-English sentence
 * for the Trends page. The NUMBERS are computed in code first (see
 * app/api/trends/route.ts) — Gemini only phrases them, it never invents
 * its own figures.
 *
 * Reuses the same client + model as classification (GEMINI_CLASSIFICATION_MODEL)
 * so there's only one Gemini model to configure/swap for the whole app. If you'd
 * rather use a different model for this lighter, non-classification task, add a
 * second exported constant next to GEMINI_CLASSIFICATION_MODEL in lib/gemini.ts
 * (e.g. GEMINI_INSIGHT_MODEL) and swap it in below.
 */
export async function generateTrendInsight(input: {
  range: "weekly" | "monthly";
  spikes: TrendMovement[];
  drops: TrendMovement[];
}): Promise<string> {
  if (input.spikes.length === 0 && input.drops.length === 0) {
    return "No significant theme movement this period — feedback volume is stable across themes.";
  }

  const prompt = `
You are writing a one-sentence insight for a product analytics dashboard.
Period type: ${input.range}.
Themes trending UP (theme, % change, current count): ${JSON.stringify(input.spikes)}
Themes trending DOWN (theme, % change, current count): ${JSON.stringify(input.drops)}

Write ONE short, plain-English sentence (max 30 words) summarizing the most
important movement. Only use the numbers given above — never invent figures.
Return plain text only, no markdown, no quotes.
`.trim();

  try {
    const response = await gemini.models.generateContent({
      model: GEMINI_CLASSIFICATION_MODEL,
      contents: prompt,
    });

    const text = response.text?.trim();
    return text || "Trend data updated — see the chart below for details.";
  } catch (err) {
    // Never let an AI/network hiccup break the whole trends page.
    console.error("Gemini insight generation failed:", err);
    return "Trend insight unavailable right now — the chart and numbers below are still accurate.";
  }
}