import type { FeedbackChannelValue } from "@/lib/feedback-catalog";
import type { FeedbackSentimentValue } from "@/types/feedback";

export type AskLoopSource = {
  id: string;
  content: string;
  channel: FeedbackChannelValue;
  customerLabel: string | null;
  sentiment: FeedbackSentimentValue | null;
  createdAt: string;
  similarity: number;
};

export type AskLoopAnswer = {
  question: string;
  answer: string;
  evidenceSufficient: boolean;
  sources: AskLoopSource[];
  retrievedEvidenceCount: number;
  provider: "GOOGLE_GEMINI";
  model: string;
};