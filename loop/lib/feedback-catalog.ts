export const FEEDBACK_CHANNEL_VALUES = [
  "SUPPORT_TICKET",
  "LIVE_CHAT",
  "APP_STORE_REVIEW",
  "NPS_SURVEY",
  "CSAT_SURVEY",
  "SALES_CALL_NOTE",
  "COMMUNITY_POST",
  "SOCIAL_MENTION",
] as const;

export type FeedbackChannelValue = (typeof FEEDBACK_CHANNEL_VALUES)[number];

export const FEEDBACK_CHANNELS: readonly {
  value: FeedbackChannelValue;
  label: string;
  description: string;
}[] = [
  {
    value: "SUPPORT_TICKET",
    label: "Support ticket",
    description: "A customer issue or request submitted to support.",
  },
  {
    value: "LIVE_CHAT",
    label: "Live chat",
    description: "A conversation captured from a support chat session.",
  },
  {
    value: "APP_STORE_REVIEW",
    label: "App-store review",
    description: "Written feedback associated with a public product review.",
  },
  {
    value: "NPS_SURVEY",
    label: "NPS survey",
    description: "Free-text feedback collected with an NPS response.",
  },
  {
    value: "CSAT_SURVEY",
    label: "CSAT survey",
    description: "Free-text feedback collected with a satisfaction survey.",
  },
  {
    value: "SALES_CALL_NOTE",
    label: "Sales call note",
    description: "A product request or concern captured during a sales call.",
  },
  {
    value: "COMMUNITY_POST",
    label: "Community post",
    description: "Feedback shared in a customer community or forum.",
  },
  {
    value: "SOCIAL_MENTION",
    label: "Social mention",
    description: "A customer comment captured from a social channel.",
  },
];

const channelLabelMap = new Map<FeedbackChannelValue, string>(
  FEEDBACK_CHANNELS.map((channel) => [channel.value, channel.label]),
);

export function getFeedbackChannelLabel(channel: FeedbackChannelValue): string {
  return channelLabelMap.get(channel) ?? channel;
}