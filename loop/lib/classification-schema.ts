import { z } from "zod";

export const classificationResultSchema = z.object({
  sentiment: z.enum(["POS", "NEU", "NEG"]),
  sentimentScore: z.number().min(-1).max(1),
  themes: z
    .array(z.string().trim().min(1).max(60))
    .min(1)
    .max(3),
  featureArea: z.string().trim().min(1).max(120),
  rationale: z.string().trim().min(1).max(500),
});

export type ClassificationResult = z.infer<typeof classificationResultSchema>;

/**
 * Claude is instructed to return raw JSON only, but models sometimes wrap
 * output in ```json fences anyway. Strip those defensively before parsing.
 */
export function stripJsonFences(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

export type ParseClassificationResult =
  | { success: true; data: ClassificationResult }
  | { success: false; error: string };

export function parseClassificationResponse(raw: string): ParseClassificationResult {
  const cleaned = stripJsonFences(raw);

  let json: unknown;
  try {
    json = JSON.parse(cleaned);
  } catch {
    return { success: false, error: "Claude's response was not valid JSON." };
  }

  const validated = classificationResultSchema.safeParse(json);

  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues.map((issue) => issue.message).join("; "),
    };
  }

  return { success: true, data: validated.data };
}