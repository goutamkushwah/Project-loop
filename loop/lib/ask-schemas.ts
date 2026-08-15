import { z } from "zod";

export const askLoopModelResponseSchema = z
  .object({
    answer: z.string().trim().min(1).max(4_000),
    evidenceSufficient: z.boolean(),
    citedFeedbackIds: z.array(z.string().uuid()).max(12),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.evidenceSufficient && value.citedFeedbackIds.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["citedFeedbackIds"],
        message: "A grounded answer must cite at least one retrieved feedback item.",
      });
    }

    if (!value.evidenceSufficient && value.citedFeedbackIds.length > 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["citedFeedbackIds"],
        message: "An insufficient-evidence response must not claim supporting citations.",
      });
    }

    if (new Set(value.citedFeedbackIds).size !== value.citedFeedbackIds.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["citedFeedbackIds"],
        message: "Citation identifiers must be unique.",
      });
    }
  });

export type AskLoopModelResponse = z.infer<typeof askLoopModelResponseSchema>;

export const askLoopModelResponseJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    answer: {
      type: "string",
      description:
        "A concise answer based only on the supplied feedback evidence. If evidence is insufficient, clearly say so.",
    },
    evidenceSufficient: {
      type: "boolean",
      description:
        "True only when the supplied feedback evidence directly supports a useful answer to the user's question.",
    },
    citedFeedbackIds: {
      type: "array",
      maxItems: 12,
      items: {
        type: "string",
      },
      description:
        "Feedback UUIDs from the supplied evidence that directly support the answer. Use an empty array when evidence is insufficient.",
    },
  },
  required: ["answer", "evidenceSufficient", "citedFeedbackIds"],
} as const;