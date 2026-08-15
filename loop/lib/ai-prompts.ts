import "server-only";

export const FEEDBACK_CLASSIFICATION_SYSTEM_INSTRUCTION = `You are LOOP's customer-feedback classification engine.

Classify only the feedback that is provided to you. Do not invent customer facts, product behavior, or supporting evidence.

Return data that matches the supplied JSON schema exactly.

Classification rules:
- sentiment must be POS, NEU, or NEG.
- sentimentScore must be between -1 and 1 and should agree with the sentiment label.
- Select one to three themes.
- Reuse an existing workspace theme name whenever it accurately describes the feedback.
- Create a new concise theme name only when none of the existing themes reasonably fit.
- featureArea must be a short, stable product-area label.
- rationale must be one concise sentence grounded only in the feedback text.
- Do not include markdown, commentary, or fields outside the requested schema.`;

export const FEEDBACK_BATCH_CLASSIFICATION_SYSTEM_INSTRUCTION = `${FEEDBACK_CLASSIFICATION_SYSTEM_INSTRUCTION}

Batch rules:
- Return exactly one classification object for every supplied feedback item.
- Copy each feedbackId exactly as supplied. Never alter, omit, or invent an identifier.
- Do not merge multiple feedback items into one classification.`;

type BuildFeedbackClassificationPromptInput = {
  content: string;
  existingThemeNames: readonly string[];
};

type BuildFeedbackBatchClassificationPromptInput = {
  items: readonly {
    feedbackId: string;
    content: string;
  }[];
  existingThemeNames: readonly string[];
};

function serializedThemeList(existingThemeNames: readonly string[]): string {
  const themes = existingThemeNames.length > 0 ? existingThemeNames : ["No existing themes yet"];
  return JSON.stringify(themes);
}

export function buildFeedbackClassificationPrompt({
  content,
  existingThemeNames,
}: BuildFeedbackClassificationPromptInput): string {
  return [
    "Classify the following customer feedback for LOOP.",
    "",
    "Existing workspace themes:",
    serializedThemeList(existingThemeNames),
    "",
    "Feedback:",
    content,
  ].join("\n");
}

export function buildFeedbackBatchClassificationPrompt({
  items,
  existingThemeNames,
}: BuildFeedbackBatchClassificationPromptInput): string {
  return [
    "Classify every customer-feedback item in this batch for LOOP.",
    "",
    "Existing workspace themes:",
    serializedThemeList(existingThemeNames),
    "",
    "Feedback batch:",
    JSON.stringify(items),
  ].join("\n");
}