import { z } from "zod";

const emptyStringToUndefined = (value: unknown): unknown =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const positiveInteger = (defaultValue: number, maximum: number) =>
  z.preprocess(
    emptyStringToUndefined,
    z.coerce.number().int().min(1).max(maximum).default(defaultValue),
  );

const normalizedSearch = z.preprocess(
  (value: unknown) =>
    typeof value === "string" ? value.trim().replace(/\s+/g, " ") : value,
  z.string().max(120, "Theme search must contain at most 120 characters.").default(""),
);

export const themeListQuerySchema = z.object({
  page: positiveInteger(1, 100_000),
  pageSize: positiveInteger(12, 50),
  search: normalizedSearch,
  sortBy: z.enum(["count", "name", "createdAt"]).default("count"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const themeIdSchema = z.string().uuid("Theme identifier must be a valid UUID.");

export const themeClusterRequestSchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(200).default(100),
  })
  .strict();

export type ThemeListQuery = z.infer<typeof themeListQuerySchema>;
export type ThemeClusterRequest = z.infer<typeof themeClusterRequestSchema>;