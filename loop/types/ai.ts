export type AiProvider = "GOOGLE_GEMINI";

export type FeedbackClassificationSentiment = "POS" | "NEU" | "NEG";

export type FeedbackClassificationTheme = {
  name: string;
  confidence: number;
};

export type FeedbackClassification = {
  sentiment: FeedbackClassificationSentiment;
  sentimentScore: number;
  themes: FeedbackClassificationTheme[];
  featureArea: string;
  rationale: string;
};

export type AiTokenUsage = {
  promptTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
};

export type FeedbackClassificationSuccess = {
  ok: true;
  provider: AiProvider;
  model: string;
  attempts: number;
  classification: FeedbackClassification;
  usage: AiTokenUsage;
};

export type FeedbackClassificationReviewRequired = {
  ok: false;
  provider: AiProvider;
  model: string;
  attempts: number;
  reason: "INVALID_MODEL_OUTPUT";
  message: string;
};

export type FeedbackClassificationResult =
  | FeedbackClassificationSuccess
  | FeedbackClassificationReviewRequired;