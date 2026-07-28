import { z } from "zod";

const serverEnvironmentSchema = z.object({
  DATABASE_URL: z
    .string({
      required_error: "DATABASE_URL is required."
    })
    .min(1, "DATABASE_URL cannot be empty.")
    .refine(
      (value) => value.startsWith("postgresql://") || value.startsWith("postgres://"),
      "DATABASE_URL must be a valid PostgreSQL connection string."
    ),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development")
});

const parsedEnvironment = serverEnvironmentSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  NODE_ENV: process.env.NODE_ENV
});

if (!parsedEnvironment.success) {
  console.error(
    "Invalid server environment configuration:",
    parsedEnvironment.error.flatten().fieldErrors
  );

  throw new Error("The server environment is invalid. Check the required environment variables.");
}

export const env = Object.freeze(parsedEnvironment.data);
