import { z } from "zod";

import { FEEDBACK_CHANNEL_VALUES } from "@/lib/feedback-catalog";
import { FEEDBACK_STATUS_VALUES } from "@/lib/feedback-filter-catalog";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_DASHBOARD_RANGE_DAYS = 366;

const dashboardDateSchema = z
  .string()
  .regex(DATE_PATTERN, "Use a date in YYYY-MM-DD format.")
  .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`)), {
    message: "Select a valid calendar date.",
  });

function formatUtcDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function getDefaultDashboardRange(now = new Date()): {
  dateFrom: string;
  dateTo: string;
} {
  const dateTo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dateFrom = new Date(dateTo);
  dateFrom.setUTCDate(dateFrom.getUTCDate() - 29);

  return {
    dateFrom: formatUtcDate(dateFrom),
    dateTo: formatUtcDate(dateTo),
  };
}

const emptyStringToUndefined = (value: unknown): unknown =>
  value === "" ? undefined : value;

const dashboardQueryInputSchema = z.object({
  dateFrom: z.preprocess(emptyStringToUndefined, dashboardDateSchema.optional()),
  dateTo: z.preprocess(emptyStringToUndefined, dashboardDateSchema.optional()),
  channel: z.preprocess(
    emptyStringToUndefined,
    z.enum(FEEDBACK_CHANNEL_VALUES).optional(),
  ),
  status: z.preprocess(
    emptyStringToUndefined,
    z.enum(FEEDBACK_STATUS_VALUES).optional(),
  ),
});

export const dashboardQuerySchema = dashboardQueryInputSchema
  .transform((value) => {
    const defaults = getDefaultDashboardRange();

    return {
      dateFrom: value.dateFrom ?? defaults.dateFrom,
      dateTo: value.dateTo ?? defaults.dateTo,
      channel: value.channel ?? null,
      status: value.status ?? null,
    };
  })
  .superRefine((value, context) => {
    const start = new Date(`${value.dateFrom}T00:00:00.000Z`);
    const end = new Date(`${value.dateTo}T00:00:00.000Z`);

    if (end < start) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dateTo"],
        message: "The end date must be on or after the start date.",
      });
      return;
    }

    const dayCount = Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;

    if (dayCount > MAX_DASHBOARD_RANGE_DAYS) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dateTo"],
        message: `Select a range of ${MAX_DASHBOARD_RANGE_DAYS} days or fewer.`,
      });
    }
  });

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;