import { z } from "zod";

const sentimentSchema = z.enum(["POS", "NEU", "NEG"]);

export const reportNarrativeModelResponseSchema = z
  .object({
    headline: z.string().trim().min(1).max(180),
    executiveSummary: z.string().trim().min(1).max(1_500),
    sentimentSummary: z.string().trim().min(1).max(1_200),
    themeInsights: z
      .array(
        z
          .object({
            themeId: z.string().uuid(),
            insight: z.string().trim().min(1).max(800),
          })
          .strict(),
      )
      .max(5),
    notableQuoteIds: z.array(z.string().uuid()).min(1).max(6),
    recommendedActions: z
      .array(
        z
          .object({
            title: z.string().trim().min(1).max(160),
            rationale: z.string().trim().min(1).max(800),
            relatedThemeIds: z.array(z.string().uuid()).max(3),
            evidenceFeedbackIds: z.array(z.string().uuid()).min(1).max(4),
          })
          .strict(),
      )
      .min(1)
      .max(5),
  })
  .strict()
  .superRefine((value, context) => {
    if (new Set(value.notableQuoteIds).size !== value.notableQuoteIds.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["notableQuoteIds"],
        message: "Notable quote identifiers must be unique.",
      });
    }

    const themeIds = value.themeInsights.map((item) => item.themeId);
    if (new Set(themeIds).size !== themeIds.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["themeInsights"],
        message: "Theme insights must reference each theme at most once.",
      });
    }

    value.recommendedActions.forEach((action, index) => {
      if (new Set(action.relatedThemeIds).size !== action.relatedThemeIds.length) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["recommendedActions", index, "relatedThemeIds"],
          message: "Related theme identifiers must be unique.",
        });
      }

      if (new Set(action.evidenceFeedbackIds).size !== action.evidenceFeedbackIds.length) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["recommendedActions", index, "evidenceFeedbackIds"],
          message: "Evidence identifiers must be unique.",
        });
      }
    });
  });

export type ReportNarrativeModelResponse = z.infer<typeof reportNarrativeModelResponseSchema>;

export const reportNarrativeModelResponseJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    headline: { type: "string" },
    executiveSummary: { type: "string" },
    sentimentSummary: { type: "string" },
    themeInsights: {
      type: "array",
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          themeId: { type: "string" },
          insight: { type: "string" },
        },
        required: ["themeId", "insight"],
      },
    },
    notableQuoteIds: {
      type: "array",
      minItems: 1,
      maxItems: 6,
      items: { type: "string" },
    },
    recommendedActions: {
      type: "array",
      minItems: 1,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          rationale: { type: "string" },
          relatedThemeIds: {
            type: "array",
            maxItems: 3,
            items: { type: "string" },
          },
          evidenceFeedbackIds: {
            type: "array",
            minItems: 1,
            maxItems: 4,
            items: { type: "string" },
          },
        },
        required: ["title", "rationale", "relatedThemeIds", "evidenceFeedbackIds"],
      },
    },
  },
  required: [
    "headline",
    "executiveSummary",
    "sentimentSummary",
    "themeInsights",
    "notableQuoteIds",
    "recommendedActions",
  ],
} as const;

const evidenceThemeSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    confidence: z.number().min(0).max(1),
  })
  .strict();

const evidenceSchema = z
  .object({
    feedbackId: z.string().uuid(),
    content: z.string(),
    channel: z.enum([
      "SUPPORT_TICKET",
      "LIVE_CHAT",
      "APP_STORE_REVIEW",
      "NPS_SURVEY",
      "CSAT_SURVEY",
      "SALES_CALL_NOTE",
      "COMMUNITY_POST",
      "SOCIAL_MENTION",
    ]),
    customerLabel: z.string().nullable(),
    sentiment: sentimentSchema.nullable(),
    sentimentScore: z.number().min(-1).max(1).nullable(),
    featureArea: z.string().nullable(),
    createdAt: z.string().datetime(),
    themes: z.array(evidenceThemeSchema),
  })
  .strict();

export const storedReportContentSchema = z
  .object({
    schemaVersion: z.literal("1"),
    generatedAt: z.string().datetime(),
    provider: z.literal("GOOGLE_GEMINI"),
    model: z.string().min(1),
    period: z
      .object({
        dateFrom: z.string(),
        dateTo: z.string(),
        dayCount: z.number().int().positive(),
        previousDateFrom: z.string(),
        previousDateTo: z.string(),
      })
      .strict(),
    stats: z
      .object({
        totalFeedback: z.number().int().nonnegative(),
        previousTotalFeedback: z.number().int().nonnegative(),
        classifiedFeedback: z.number().int().nonnegative(),
        previousClassifiedFeedback: z.number().int().nonnegative(),
        classificationCoverage: z.number().min(0).max(100),
        previousClassificationCoverage: z.number().min(0).max(100),
      })
      .strict(),
    sentiment: z.array(
      z
        .object({
          sentiment: sentimentSchema,
          label: z.string(),
          count: z.number().int().nonnegative(),
          percentage: z.number().min(0).max(100),
          previousCount: z.number().int().nonnegative(),
          previousPercentage: z.number().min(0).max(100),
          deltaPercentagePoints: z.number(),
        })
        .strict(),
    ),
    topThemes: z.array(
      z
        .object({
          id: z.string().uuid(),
          name: z.string(),
          color: z.string(),
          count: z.number().int().nonnegative(),
          percentage: z.number().min(0).max(100),
        })
        .strict(),
    ),
    evidence: z.array(evidenceSchema),
    narrative: reportNarrativeModelResponseSchema,
  })
  .strict();