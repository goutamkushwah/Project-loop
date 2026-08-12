import { z } from "zod";

export const feedbackClassificationThemeSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    confidence: z.number().min(0).max(1),
  })
  .strict();

export const feedbackClassificationSchema = z
  .object({
    sentiment: z.enum(["POS", "NEU", "NEG"]),
    sentimentScore: z.number().min(-1).max(1),
    themes: z.array(feedbackClassificationThemeSchema).min(1).max(3),
    featureArea: z.string().trim().min(1).max(120),
    rationale: z.string().trim().min(1).max(300),
  })
  .strict()
  .superRefine((value, context) => {
    const normalizedNames = value.themes.map((theme) => theme.name.toLocaleLowerCase());

    if (new Set(normalizedNames).size !== normalizedNames.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["themes"],
        message: "Theme names must be unique within one classification result.",
      });
    }
  });

export type FeedbackClassificationOutput = z.infer<typeof feedbackClassificationSchema>;

export const feedbackClassificationJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    sentiment: {
      type: "string",
      enum: ["POS", "NEU", "NEG"],
      description: "Overall sentiment: positive, neutral, or negative.",
    },
    sentimentScore: {
      type: "number",
      minimum: -1,
      maximum: 1,
      description: "Sentiment intensity from -1 (strongly negative) to 1 (strongly positive).",
    },
    themes: {
      type: "array",
      minItems: 1,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: {
            type: "string",
            description: "Concise theme name. Prefer an existing workspace theme when it fits.",
          },
          confidence: {
            type: "number",
            minimum: 0,
            maximum: 1,
            description: "Confidence that the feedback belongs to this theme.",
          },
        },
        required: ["name", "confidence"],
      },
    },
    featureArea: {
      type: "string",
      description: "Short product feature-area label, such as Onboarding, Billing, Search, or API.",
    },
    rationale: {
      type: "string",
      description: "One concise sentence explaining the classification using only the feedback text.",
    },
  },
  required: ["sentiment", "sentimentScore", "themes", "featureArea", "rationale"],
} as const;