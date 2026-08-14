import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

import {
  buildFeedbackClassificationPrompt,
  FEEDBACK_CLASSIFICATION_SYSTEM_INSTRUCTION,
} from "../lib/ai-prompts";
import {
  feedbackClassificationJsonSchema,
  feedbackClassificationSchema,
} from "../lib/ai-schemas";

const MODEL = "gemini-3.6-flash";

const existingThemeNames = [
  "Onboarding & Setup",
  "Performance & Reliability",
  "Mobile Experience",
  "Billing & Invoices",
  "Integrations & API",
  "Authentication & SSO",
  "Reporting & Export",
  "Collaboration & Permissions",
  "Search & Navigation",
  "Customer Support",
] as const;

async function main(): Promise<void> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing from .env");
  }

  const gemini = new GoogleGenAI({
    apiKey,
    httpOptions: {
      apiVersion: "v1",
    },
  });

  const response = await gemini.models.generateContent({
    model: MODEL,
    contents: buildFeedbackClassificationPrompt({
      content:
        "Onboarding took forever because I could not figure out how to invite the rest of my team to the workspace.",
      existingThemeNames,
    }),
    config: {
      systemInstruction: FEEDBACK_CLASSIFICATION_SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseJsonSchema: feedbackClassificationJsonSchema,
    },
  });

  const responseText = response.text?.trim();

  if (!responseText) {
    throw new Error("Gemini returned an empty classification response.");
  }

  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(responseText);
  } catch {
    throw new Error("Gemini returned a response that was not valid JSON.");
  }

  const validated = feedbackClassificationSchema.safeParse(parsedJson);

  if (!validated.success) {
    throw new Error(
      `Gemini returned invalid classification JSON: ${validated.error.issues
        .map(
          (issue) =>
            `${issue.path.join(".") || "response"}: ${issue.message}`,
        )
        .join("; ")}`,
    );
  }

  console.info("LOOP Gemini classification verification succeeded.");
  console.info("Provider: GOOGLE_GEMINI");
  console.info(`Model: ${response.modelVersion ?? MODEL}`);
  console.info(JSON.stringify(validated.data, null, 2));

  if (response.usageMetadata?.totalTokenCount != null) {
    console.info(
      `Total tokens: ${response.usageMetadata.totalTokenCount}`,
    );
  }
}

main().catch((error: unknown) => {
  const message =
    error instanceof Error
      ? error.message
      : "Unknown AI verification error.";

  console.error("LOOP Gemini classification verification failed.");
  console.error(message);
  process.exitCode = 1;
});