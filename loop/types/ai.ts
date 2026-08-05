export type AiSentiment = "POS" | "NEU" | "NEG";

export type AiThemeClassification = {
  name: string;
  confidence: number;
};

export type FeedbackClassification = {
  sentiment: AiSentiment;
  sentimentScore: number;
  themes: AiThemeClassification[];
  featureArea: string;
  rationale: string;
};

export type ClassificationThemeContext = {
  name: string;
  description: string;
};

export type ClassificationPreviewResult = {
  classification: FeedbackClassification;
  metadata: {
    model: string;
    attempts: number;
    existingThemeCount: number;
    inputTokens: number;
    outputTokens: number;
    latencyMs: number;
    providerRequestId: string | null;
  };
};