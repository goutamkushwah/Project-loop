import { z } from "zod";

export const AI_CLASSIFICATION_BATCH_SIZE = 5;

export const feedbackClassificationThemeSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    confidence: z.number().min(0).max(1),
  })
  .strict();

const classificationFields = {
  sentiment: z.enum(["POS", "NEU", "NEG"]),
  sentimentScore: z.number().min(-1).max(1),
  themes: z.array(feedbackClassificationThemeSchema).min(1).max(3),
  featureArea: z.string().trim().min(1).max(120),
  rationale: z.string().trim().min(1).max(300),
} as const;

function validateUniqueThemeNames(
  value: { themes: Array<{ name: string }> },
  context: z.RefinementCtx,
): void {
  const normalizedNames = value.themes.map((theme) =>
    theme.name.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US"),
  );

  if (new Set(normalizedNames).size !== normalizedNames.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["themes"],
      message: "Theme names must be unique within one classification result.",
    });
  }
}

export const feedbackClassificationSchema = z
  .object(classificationFields)
  .strict()
  .superRefine(validateUniqueThemeNames);

export const feedbackBatchClassificationItemSchema = z
  .object({
    feedbackId: z.string().uuid(),
    ...classificationFields,
  })
  .strict()
  .superRefine(validateUniqueThemeNames);

export const feedbackBatchClassificationSchema = z
  .object({
    items: z
      .array(feedbackBatchClassificationItemSchema)
      .min(1)
      .max(AI_CLASSIFICATION_BATCH_SIZE),
  })
  .strict();

export type FeedbackClassificationOutput = z.infer<typeof feedbackClassificationSchema>;
export type FeedbackBatchClassificationOutput = z.infer<
  typeof feedbackBatchClassificationSchema
>;

const classificationJsonProperties = {
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
} as const;

const classificationRequired = [
  "sentiment",
  "sentimentScore",
  "themes",
  "featureArea",
  "rationale",
] as const;

export const feedbackClassificationJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: classificationJsonProperties,
  required: classificationRequired,
} as const;

export const feedbackBatchClassificationJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    items: {
      type: "array",
      minItems: 1,
      maxItems: AI_CLASSIFICATION_BATCH_SIZE,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          feedbackId: {
            type: "string",
            description: "The exact feedbackId supplied with the corresponding input item.",
          },
          ...classificationJsonProperties,
        },
        required: ["feedbackId", ...classificationRequired],
      },
    },
  },
  required: ["items"],
} as const;