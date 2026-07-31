import { z } from "zod";

export const CHANNELS = [
    "SUPPORT_TICKET",
    "APP_STORE_REVIEW",
    "SURVEY",
    "SALES_CALL_NOTE",
    "SOCIAL_MENTION",
] as const;

export const feedbackSchema = z.object({
    content: z
        .string()
        .trim()
        .min(3, "Feedback must be at least 3 characters")
        .max(4000, "Feedback is too long (max 4000 characters)"),
    channel: z.enum(CHANNELS, {
        errorMap: () => ({ message: "Select a channel" }),
    }),
    customerLabel: z.string().trim().max(120).optional().or(z.literal("")),
});

export type FeedbackInput = z.infer<typeof feedbackSchema>;