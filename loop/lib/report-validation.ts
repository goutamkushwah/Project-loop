import { z } from "zod";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_REPORT_RANGE_DAYS = 366;
const MAX_REPORT_PAGE_SIZE = 50;
const MILLISECONDS_PER_DAY = 86_400_000;

const emptyStringToUndefined = (value: unknown): unknown =>
  value === "" ? undefined : value;

const dateSchema = z
  .string()
  .regex(DATE_PATTERN, "Use a date in YYYY-MM-DD format.")
  .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`)), {
    message: "Select a valid calendar date.",
  });

function dayCountInclusive(dateFrom: string, dateTo: string): number {
  const start = new Date(`${dateFrom}T00:00:00.000Z`);
  const end = new Date(`${dateTo}T00:00:00.000Z`);

  return Math.floor((end.getTime() - start.getTime()) / MILLISECONDS_PER_DAY) + 1;
}

function addRangeValidation<T extends { dateFrom?: string; dateTo?: string }>(
  value: T,
  context: z.RefinementCtx,
): void {
  if (!value.dateFrom || !value.dateTo) {
    return;
  }

  if (value.dateTo < value.dateFrom) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["dateTo"],
      message: "The end date must be on or after the start date.",
    });
    return;
  }

  if (dayCountInclusive(value.dateFrom, value.dateTo) > MAX_REPORT_RANGE_DAYS) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["dateTo"],
      message: `Voice-of-Customer reports can cover at most ${MAX_REPORT_RANGE_DAYS} days.`,
    });
  }
}

function formatUtcDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function getDefaultReportRange(now = new Date()): {
  dateFrom: string;
  dateTo: string;
} {
  const dateTo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dateFrom = new Date(dateTo);
  dateFrom.setUTCDate(dateFrom.getUTCDate() - 6);

  return {
    dateFrom: formatUtcDate(dateFrom),
    dateTo: formatUtcDate(dateTo),
  };
}

export const createReportSchema = z
  .object({
    dateFrom: dateSchema,
    dateTo: dateSchema,
    title: z.preprocess(
      emptyStringToUndefined,
      z.string().trim().min(3).max(180).optional(),
    ),
  })
  .strict()
  .superRefine(addRangeValidation);

const positiveInteger = (fallback: number) =>
  z.preprocess(
    (value) => {
      if (value === undefined || value === null || value === "") {
        return fallback;
      }

      return typeof value === "string" ? Number(value) : value;
    },
    z.number().int().positive(),
  );

export const reportListQuerySchema = z
  .object({
    page: positiveInteger(1),
    pageSize: positiveInteger(10).pipe(z.number().int().min(1).max(MAX_REPORT_PAGE_SIZE)),
    search: z.preprocess(
      (value) => (typeof value === "string" ? value.trim() : ""),
      z.string().max(120),
    ),
    periodFrom: z.preprocess(emptyStringToUndefined, dateSchema.optional()),
    periodTo: z.preprocess(emptyStringToUndefined, dateSchema.optional()),
    sortBy: z.preprocess(
      emptyStringToUndefined,
      z.enum(["createdAt", "periodStart", "title"]).default("createdAt"),
    ),
    sortOrder: z.preprocess(
      emptyStringToUndefined,
      z.enum(["asc", "desc"]).default("desc"),
    ),
  })
  .superRefine((value, context) => {
    if (!value.periodFrom || !value.periodTo) {
      return;
    }

    if (value.periodTo < value.periodFrom) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["periodTo"],
        message: "The report-period end filter must be on or after the start filter.",
      });
      return;
    }

    if (dayCountInclusive(value.periodFrom, value.periodTo) > MAX_REPORT_RANGE_DAYS) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["periodTo"],
        message: `Saved-report period filters can cover at most ${MAX_REPORT_RANGE_DAYS} days.`,
      });
    }
  });

export const reportIdSchema = z.string().uuid("Report ID must be a valid UUID.");

export type CreateReportInput = z.infer<typeof createReportSchema>;
export type ReportListQuery = z.infer<typeof reportListQuerySchema>;