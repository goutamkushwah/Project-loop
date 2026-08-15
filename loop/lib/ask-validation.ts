import { z } from "zod";

export const ASK_LOOP_MAX_QUESTION_LENGTH = 1_000;
export const ASK_LOOP_DEFAULT_TOP_K = 8;
export const ASK_LOOP_MAX_TOP_K = 12;

export const askLoopRequestSchema = z
  .object({
    question: z
      .string({ required_error: "Enter a question for LOOP." })
      .trim()
      .min(3, "Question must contain at least 3 characters.")
      .max(
        ASK_LOOP_MAX_QUESTION_LENGTH,
        `Question cannot exceed ${ASK_LOOP_MAX_QUESTION_LENGTH.toLocaleString()} characters.`,
      ),
    topK: z
      .number()
      .int()
      .min(1)
      .max(ASK_LOOP_MAX_TOP_K)
      .optional()
      .default(ASK_LOOP_DEFAULT_TOP_K),
  })
  .strict();

export type AskLoopRequest = z.infer<typeof askLoopRequestSchema>;