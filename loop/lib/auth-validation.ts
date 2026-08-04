import { z } from "zod";

const normalizeSpaces = (value: string): string => value.replace(/\s+/g, " ").trim();

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address.")
  .max(254, "Email address is too long.");

const displayNameSchema = z
  .string()
  .trim()
  .min(2, "Name must contain at least 2 characters.")
  .max(120, "Name must contain at most 120 characters.")
  .transform(normalizeSpaces);

const workspaceNameSchema = z
  .string()
  .trim()
  .min(2, "Workspace name must contain at least 2 characters.")
  .max(120, "Workspace name must contain at most 120 characters.")
  .transform(normalizeSpaces);

export const passwordSchema = z
  .string()
  .min(12, "Password must contain at least 12 characters.")
  .max(128, "Password must contain at most 128 characters.")
  .regex(/[a-z]/, "Password must include a lowercase letter.")
  .regex(/[A-Z]/, "Password must include an uppercase letter.")
  .regex(/[0-9]/, "Password must include a number.")
  .regex(/[^A-Za-z0-9]/, "Password must include a symbol.");
export const signupRoleSchema = z.enum(["ANALYST", "VIEWER"], {
  errorMap: () => ({ message: "Select whether you're an analyst or viewer." }),
});
 
export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1, "Password is required.")
    .max(128, "Password must contain at most 128 characters."),
});

export const registrationSchema = z.object({
  name: displayNameSchema,
  workspaceName: workspaceNameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegistrationInput = z.infer<typeof registrationSchema>;