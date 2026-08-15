//import "server-only";

import { ApiError } from "@google/genai";
import { Prisma } from "@prisma/client";

import { ASK_LOOP_SYSTEM_INSTRUCTION, buildAskLoopPrompt } from "@/lib/ask-prompts";
import {
  askLoopModelResponseJsonSchema,
  askLoopModelResponseSchema,
  type AskLoopModelResponse,
} from "@/lib/ask-schemas";
import type { AskLoopRequest } from "@/lib/ask-validation";
import { db } from "@/lib/db";
import { embedAskLoopQuestion } from "@/lib/embedding";
import {
  GEMINI_ASK_MODEL,
  GEMINI_EMBEDDING_DIMENSIONS,
  GEMINI_EMBEDDING_MODEL,
  gemini,
} from "@/lib/gemini";
import type { ApiErrorCode } from "@/types/api";
import type { AskLoopAnswer, AskLoopSource } from "@/types/ask";

const EMBEDDING_PROVIDER = "GOOGLE_GEMINI" as const;
const AI_PROVIDER = "GOOGLE_GEMINI" as const;
const MAX_ASK_ATTEMPTS = 2;

export class AskLoopServiceError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "AskLoopServiceError";
  }
}

type RetrievedFeedbackRow = {
  id: string;
  content: string;
  channel: AskLoopSource["channel"];
  customerLabel: string | null;
  sentiment: AskLoopSource["sentiment"];
  createdAt: Date;
  similarity: number;
};

function vectorLiteral(values: readonly number[]): string {
  return `[${values.join(",")}]`;
}

function serializeRetrievedFeedback(row: RetrievedFeedbackRow): AskLoopSource {
  return {
    id: row.id,
    content: row.content,
    channel: row.channel,
    customerLabel: row.customerLabel,
    sentiment: row.sentiment,
    createdAt: row.createdAt.toISOString(),
    similarity: Number(Math.max(-1, Math.min(1, row.similarity)).toFixed(4)),
  };
}

async function retrieveWorkspaceFeedback(
  workspaceId: string,
  queryVector: readonly number[],
  topK: number,
): Promise<AskLoopSource[]> {
  const rows = await db.$queryRaw<RetrievedFeedbackRow[]>(Prisma.sql`
    SELECT
      f."id",
      f."content",
      f."channel",
      f."customerLabel",
      f."sentiment",
      f."createdAt",
      (1 - (e."vector" <=> CAST(${vectorLiteral(queryVector)} AS vector(768))))::double precision AS "similarity"
    FROM "Embedding" AS e
    INNER JOIN "Feedback" AS f
      ON f."id" = e."feedbackId"
      AND f."workspaceId" = e."workspaceId"
    WHERE e."workspaceId" = CAST(${workspaceId} AS uuid)
      AND f."workspaceId" = CAST(${workspaceId} AS uuid)
      AND e."provider" = ${EMBEDDING_PROVIDER}
      AND e."model" = ${GEMINI_EMBEDDING_MODEL}
      AND e."dimensions" = ${GEMINI_EMBEDDING_DIMENSIONS}
    ORDER BY e."vector" <=> CAST(${vectorLiteral(queryVector)} AS vector(768)) ASC
    LIMIT ${topK}
  `);

  return rows.map(serializeRetrievedFeedback);
}

function parseModelResponse(
  rawText: string,
  retrievedIds: ReadonlySet<string>,
): AskLoopModelResponse | null {
  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(rawText.trim());
  } catch {
    return null;
  }

  const validated = askLoopModelResponseSchema.safeParse(parsedJson);

  if (!validated.success) {
    return null;
  }

  if (validated.data.citedFeedbackIds.some((feedbackId) => !retrievedIds.has(feedbackId))) {
    return null;
  }

  return validated.data;
}

function mapProviderError(error: unknown): AskLoopServiceError {
  if (error instanceof ApiError) {
    const status = typeof error.status === "number" ? error.status : null;

    if (status === 429 || status === 408 || (status !== null && status >= 500)) {
      return new AskLoopServiceError(
        "ASK_LOOP_PROVIDER_UNAVAILABLE",
        "Ask LOOP is temporarily unavailable because the AI provider could not complete the request.",
        503,
      );
    }
  }

  return new AskLoopServiceError(
    "ASK_LOOP_FAILED",
    "Ask LOOP could not generate a grounded answer. Please try again.",
    500,
  );
}

export async function askLoop(
  workspaceId: string,
  input: AskLoopRequest,
): Promise<AskLoopAnswer> {
  let queryVector: number[];

  try {
    queryVector = await embedAskLoopQuestion(input.question);
  } catch (error: unknown) {
    console.error("Ask LOOP question embedding failed.", { workspaceId, error });
    throw new AskLoopServiceError(
      "ASK_LOOP_PROVIDER_UNAVAILABLE",
      "Ask LOOP could not search the feedback index right now. Please try again.",
      503,
    );
  }

  const evidence = await retrieveWorkspaceFeedback(workspaceId, queryVector, input.topK);

  if (evidence.length === 0) {
    return {
      question: input.question,
      answer:
        "I don't have indexed feedback evidence in this workspace yet, so I can't answer that question without guessing.",
      evidenceSufficient: false,
      sources: [],
      retrievedEvidenceCount: 0,
      provider: AI_PROVIDER,
      model: GEMINI_ASK_MODEL,
    };
  }

  const retrievedIds = new Set(evidence.map((item) => item.id));

  for (let attempt = 1; attempt <= MAX_ASK_ATTEMPTS; attempt += 1) {
    try {
      const response = await gemini.models.generateContent({
        model: GEMINI_ASK_MODEL,
        contents: buildAskLoopPrompt({
          question: input.question,
          evidence,
        }),
        config: {
          systemInstruction: ASK_LOOP_SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseJsonSchema: askLoopModelResponseJsonSchema,
        },
      });
      const responseText = response.text?.trim();
      const parsed = responseText ? parseModelResponse(responseText, retrievedIds) : null;

      if (!parsed) {
        if (attempt < MAX_ASK_ATTEMPTS) {
          continue;
        }

        throw new AskLoopServiceError(
          "ASK_LOOP_INVALID_RESPONSE",
          "Ask LOOP could not validate the grounded answer returned by Gemini. Please try again.",
          502,
        );
      }

      const citedIds = new Set(parsed.citedFeedbackIds);
      const sources = evidence.filter((item) => citedIds.has(item.id));

      return {
        question: input.question,
        answer: parsed.answer,
        evidenceSufficient: parsed.evidenceSufficient,
        sources,
        retrievedEvidenceCount: evidence.length,
        provider: AI_PROVIDER,
        model: response.modelVersion ?? GEMINI_ASK_MODEL,
      };
    } catch (error: unknown) {
      if (error instanceof AskLoopServiceError) {
        throw error;
      }

      const mapped = mapProviderError(error);

      if (attempt < MAX_ASK_ATTEMPTS && mapped.status === 503) {
        continue;
      }

      console.error("Ask LOOP grounded generation failed.", {
        workspaceId,
        attempt,
        error,
      });
      throw mapped;
    }
  }

  throw new AskLoopServiceError(
    "ASK_LOOP_FAILED",
    "Ask LOOP could not generate a grounded answer. Please try again.",
    500,
  );
}