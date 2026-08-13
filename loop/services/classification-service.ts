import { z } from "zod";

import {
  gemini,
  GEMINI_CLASSIFICATION_MODEL,
} from "@/lib/gemini";

const classificationSchema = z.object({
  sentiment: z.enum(["POS", "NEU", "NEG"]),
  sentimentScore: z.number().min(0).max(1),
  theme: z.string().min(1).max(120),
  themeConfidence: z.number().min(0).max(1),
  featureArea: z.string().min(1).max(120),
  rationale: z.string().min(1).max(500),
});

export type ClassificationResult = z.infer<
  typeof classificationSchema
>;

export async function classifyFeedback(
  feedbackText: string,
): Promise<ClassificationResult> {
  if (!feedbackText.trim()) {
    throw new Error("Feedback content is empty");
  }

  const prompt = `
You are an AI customer feedback classifier.

Analyze the following customer feedback:

"""
${feedbackText}
"""

Return ONLY valid JSON.

Use exactly this structure:

{
  "sentiment": "NEG",
  "sentimentScore": 0.97,
  "theme": "Performance",
  "themeConfidence": 0.96,
  "featureArea": "Dashboard",
  "rationale": "The customer reports very slow dashboard loading."
}

Rules:

sentiment:
- POS = positive
- NEU = neutral
- NEG = negative

sentimentScore:
- number between 0 and 1
- represents confidence in the sentiment

theme:
- identify the main topic
- examples: Performance, UI/UX, Authentication, Payment, Support

themeConfidence:
- number between 0 and 1

featureArea:
- identify the product feature involved
- examples: Dashboard, Login, Reports, Settings, Notifications

rationale:
- briefly explain why this classification was selected
- maximum 500 characters

Do not return markdown.
Do not return additional fields.
`;

  const response = await gemini.models.generateContent({
    model: GEMINI_CLASSIFICATION_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });

  const text = response.text?.trim();

  if (!text) {
    throw new Error("Gemini returned an empty response");
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(
      `Gemini returned invalid JSON: ${text}`,
    );
  }

  return classificationSchema.parse(parsed);
}