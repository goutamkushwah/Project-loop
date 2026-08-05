type PromptInput = {
  content: string;
  channel?: string;
  existingThemeNames?: string[];
};

export function buildClassificationPrompt({
  content,
  channel,
  existingThemeNames,
}: PromptInput) {
  const system = `
You are an AI assistant that analyzes customer feedback.
Read the feedback carefully and determine the sentiment, and identify a relevant theme.
`;

  const themeHint =
    existingThemeNames && existingThemeNames.length > 0
      ? `\nExisting themes to consider reusing:\n${existingThemeNames.join(", ")}\n`
      : "";

  const user = `
Feedback:
${content}
Channel:
${channel ?? "Unknown"}
${themeHint}
Analyze the sentiment of this feedback.
`;

  return {
    system,
    user,
  };
}