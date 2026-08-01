import type { FeedbackChannelValue } from "@/lib/feedback-catalog";

export const SIMULATED_CHANNEL_KEYS = [
  "support-desk",
  "app-store",
  "nps-survey",
  "sales-notes",
] as const;

export type SimulatedChannelKey = (typeof SIMULATED_CHANNEL_KEYS)[number];

export type SimulatedChannelOption = {
  key: SimulatedChannelKey;
  name: string;
  description: string;
  channel: FeedbackChannelValue;
  itemCount: number;
  sourceRefPrefix: string;
  freshnessLabel: string;
};

export const SIMULATED_CHANNEL_OPTIONS: readonly SimulatedChannelOption[] = [
  {
    key: "support-desk",
    name: "Support Desk",
    description:
      "Pull a realistic batch of product issues and feature requests from a simulated support queue.",
    channel: "SUPPORT_TICKET",
    itemCount: 12,
    sourceRefPrefix: "sim-support",
    freshnessLabel: "Past 14 days",
  },
  {
    key: "app-store",
    name: "App Store Reviews",
    description:
      "Import a balanced set of public-style reviews covering usability, speed, and mobile experience.",
    channel: "APP_STORE_REVIEW",
    itemCount: 12,
    sourceRefPrefix: "sim-app-store",
    freshnessLabel: "Past 30 days",
  },
  {
    key: "nps-survey",
    name: "NPS Survey",
    description:
      "Load open-text survey responses from promoters, passives, and detractors in a simulated NPS export.",
    channel: "NPS_SURVEY",
    itemCount: 12,
    sourceRefPrefix: "sim-nps",
    freshnessLabel: "Latest survey cycle",
  },
  {
    key: "sales-notes",
    name: "Sales Call Notes",
    description:
      "Seed product objections, buying requirements, and repeated feature requests from simulated calls.",
    channel: "SALES_CALL_NOTE",
    itemCount: 12,
    sourceRefPrefix: "sim-sales",
    freshnessLabel: "Past 21 days",
  },
];

const simulatedChannelMap = new Map(
  SIMULATED_CHANNEL_OPTIONS.map((source) => [source.key, source]),
);

export function getSimulatedChannelOption(
  key: SimulatedChannelKey,
): SimulatedChannelOption {
  const source = simulatedChannelMap.get(key);

  if (!source) {
    throw new Error(`Unknown simulated channel source: ${key}`);
  }

  return source;
}