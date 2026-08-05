import { z } from "zod";

const normalizedText = (minimum: number, maximum: number, fieldName: string) =>
  z
    .string()
    .trim()
    .min(minimum, `${fieldName} must contain at least ${minimum} characters.`)
    .max(maximum, `${fieldName} must contain at most ${maximum} characters.`)
    .transform((value) => value.replace(/\s+/g, " "));

export const classificationPreviewInputSchema = z.object({
  content: z
    .string()
    .trim()
    .min(3, "Feedback content must contain at least 3 characters.")
    .max(10_000, "Feedback content must contain at most 10,000 characters."),
});

const themeClassificationSchema = z
  .object({
    name: normalizedText(2, 120, "Theme name"),
    confidence: z
      .number()
      .finite("Theme confidence must be finite.")
      .min(0, "Theme confidence cannot be below 0.")
      .max(1, "Theme confidence cannot exceed 1."),
  })
  .strict();

export const feedbackClassificationSchema = z
  .object({
    sentiment: z.enum(["POS", "NEU", "NEG"]),
    sentimentScore: z
      .number()
      .finite("Sentiment score must be finite.")
      .min(-1, "Sentiment score cannot be below -1.")
      .max(1, "Sentiment score cannot exceed 1."),
    themes: z
      .array(themeClassificationSchema)
      .min(1, "At least one theme is required.")
      .max(3, "No more than three themes may be returned."),
    featureArea: normalizedText(2, 120, "Feature area"),
    rationale: normalizedText(3, 500, "Rationale"),
  })
  .strict()
  .superRefine((classification, context) => {
    const normalizedThemes = classification.themes.map((theme) => theme.name.toLowerCase());

    if (new Set(normalizedThemes).size !== normalizedThemes.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["themes"],
        message: "Theme names must be unique.",
      });
    }

    if (classification.sentiment === "POS" && classification.sentimentScore < 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sentimentScore"],
        message: "Positive sentiment cannot have a negative score.",
      });
    }

    if (classification.sentiment === "NEG" && classification.sentimentScore > 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sentimentScore"],
        message: "Negative sentiment cannot have a positive score.",
      });
    }

    if (classification.sentiment === "NEU" && Math.abs(classification.sentimentScore) > 0.35) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sentimentScore"],
        message: "Neutral sentiment score must be between -0.35 and 0.35.",
      });
    }
  });

export type ClassificationPreviewInput = z.infer<typeof classificationPreviewInputSchema>;