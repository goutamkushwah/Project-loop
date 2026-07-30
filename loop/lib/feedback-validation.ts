import { z } from "zod";

import { FEEDBACK_CHANNEL_VALUES } from "@/lib/feedback-catalog";

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

export const feedbackListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(50).default(10),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type FeedbackCreateInput = z.infer<typeof feedbackCreateSchema>;
export type FeedbackListQuery = z.infer<typeof feedbackListQuerySchema>;