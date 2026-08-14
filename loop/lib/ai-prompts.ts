

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

type BuildFeedbackClassificationPromptInput = {
  content: string;
  existingThemeNames: readonly string[];
};

export function buildFeedbackClassificationPrompt({
  content,
  existingThemeNames,
}: BuildFeedbackClassificationPromptInput): string {
  const themes = existingThemeNames.length > 0 ? existingThemeNames : ["No existing themes yet"];

  return [
    "Classify the following customer feedback for LOOP.",
    "",
    "Existing workspace themes:",
    JSON.stringify(themes),
    "",
    "Feedback:",
    content,
  ].join("\n");
}