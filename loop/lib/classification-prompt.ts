type PromptInput = {
  content: string;
  channel?: string;
};

export function buildClassificationPrompt({
  content,
  channel,
}: PromptInput) {
  const system = `
You are an AI assistant that analyzes customer feedback.
Read the feedback carefully and determine the sentiment.
`;

  const user = `
Feedback:
${content}

Channel:
${channel ?? "Unknown"}

Analyze the sentiment of this feedback.
`;

  return {
    system,
    user,
  };
}