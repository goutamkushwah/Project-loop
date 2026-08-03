import { z } from "zod";

import { FEEDBACK_CHANNEL_VALUES } from "@/lib/feedback-catalog";
import {
  FEEDBACK_SENTIMENT_VALUES,
  FEEDBACK_STATUS_VALUES,
} from "@/lib/feedback-filter-catalog";

const optionalTrimmedString = (maximumLength: number, message: string) =>
  z.preprocess(
    (value) => {
      if (typeof value !== "string") {
        return value;
      }

      const trimmed = value.trim();
      return trimmed.length === 0 ? undefined : trimmed;
    },
    z.string().max(maximumLength, message).optional(),
  );

const searchQuerySchema = z.preprocess(
  (value) => (typeof value === "string" ? value.trim().replace(/\s+/g, " ") : value),
  z.string().max(200, "Search must contain at most 200 characters.").default(""),
);

function isValidDateOnly(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

const optionalDateOnlySchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the YYYY-MM-DD date format.")
    .refine(isValidDateOnly, "Select a valid calendar date.")
    .optional(),
);

const optionalThemeIdSchema = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().uuid("Theme must be a valid workspace theme.").optional(),
);

export const feedbackCreateSchema = z.object({
  content: z
    .string({ required_error: "Feedback content is required." })
    .trim()
    .min(3, "Feedback content must contain at least 3 characters.")
    .max(10_000, "Feedback content must contain at most 10,000 characters."),
  channel: z.enum(FEEDBACK_CHANNEL_VALUES, {
    required_error: "Select a feedback channel.",
    invalid_type_error: "Select a valid feedback channel.",
  }),
  customerLabel: optionalTrimmedString(
    160,
    "Customer label must contain at most 160 characters.",
  ),
  sourceRef: optionalTrimmedString(
    255,
    "Source reference must contain at most 255 characters.",
  ),
});

export const feedbackListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(5).max(50).default(10),
    search: searchQuerySchema,
    channel: z.preprocess(
      (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
      z.enum(FEEDBACK_CHANNEL_VALUES).optional(),
    ),
    sentiment: z.preprocess(
      (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
      z.enum(FEEDBACK_SENTIMENT_VALUES).optional(),
    ),
    themeId: optionalThemeIdSchema,
    status: z.preprocess(
      (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
      z.enum(FEEDBACK_STATUS_VALUES).optional(),
    ),
    dateFrom: optionalDateOnlySchema,
    dateTo: optionalDateOnlySchema,
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  })
  .superRefine((query, context) => {
    if (query.dateFrom && query.dateTo && query.dateFrom > query.dateTo) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dateTo"],
        message: "End date must be on or after the start date.",
      });
    }
  });

export const feedbackIdSchema = z
  .string({ required_error: "Feedback ID is required." })
  .uuid("Feedback ID must be a valid UUID.");

export const feedbackStatusUpdateSchema = z.object({
  status: z.enum(["REVIEWED", "ACTIONED"], {
    required_error: "Select the next feedback status.",
    invalid_type_error: "Select a valid feedback status.",
  }),
});

export type FeedbackCreateInput = z.infer<typeof feedbackCreateSchema>;
export type FeedbackListQuery = z.infer<typeof feedbackListQuerySchema>;
export type FeedbackStatusUpdateInput = z.infer<typeof feedbackStatusUpdateSchema>;