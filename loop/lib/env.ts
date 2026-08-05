import "server-only";

import { z } from "zod";

const emptyStringToUndefined = (value: unknown): unknown => (value === "" ? undefined : value);

const serverEnvironmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z
    .string({ required_error: "DATABASE_URL is required." })
    .min(1, "DATABASE_URL is required.")
    .refine(
      (value) => value.startsWith("postgresql://") || value.startsWith("postgres://"),
      "DATABASE_URL must be a PostgreSQL connection string.",
    ),
  NEXTAUTH_URL: z.preprocess(
    emptyStringToUndefined,
    z.string().url("NEXTAUTH_URL must be a valid URL.").optional(),
  ),
  NEXTAUTH_SECRET: z
    .string({ required_error: "NEXTAUTH_SECRET is required." })
    .min(32, "NEXTAUTH_SECRET must contain at least 32 characters."),
  ANTHROPIC_API_KEY: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().min(20, "ANTHROPIC_API_KEY appears to be invalid.").optional(),
  ),
});

const parsedEnvironment = serverEnvironmentSchema.safeParse(process.env);

if (!parsedEnvironment.success) {
  const details = parsedEnvironment.error.issues
    .map((issue) => `${issue.path.join(".") || "environment"}: ${issue.message}`)
    .join("; ");

  throw new Error(`Invalid server environment configuration. ${details}`);
}

export const env = parsedEnvironment.data;