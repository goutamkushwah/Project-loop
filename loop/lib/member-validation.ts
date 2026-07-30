import { UserRole } from "@prisma/client";
import { z } from "zod";

import { passwordSchema } from "@/lib/auth-validation";

export const memberListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(50).default(10),
  search: z.string().trim().max(120).default(""),
  role: z.nativeEnum(UserRole).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  sortBy: z.enum(["name", "email", "role", "createdAt", "lastLoginAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const memberIdSchema = z.string().uuid("Member identifier must be a valid UUID.");

export const memberUpdateSchema = z
  .object({
    role: z.nativeEnum(UserRole).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((value) => value.role !== undefined || value.isActive !== undefined, {
    message: "At least one member field must be provided.",
  });

export const invitationCreateSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address.")
    .max(254, "Email address is too long."),
  role: z.nativeEnum(UserRole),
});

export const invitationIdSchema = z.string().uuid("Invitation identifier must be a valid UUID.");

export const invitationTokenSchema = z
  .string()
  .regex(/^[A-Za-z0-9_-]{43}$/, "Invitation token is invalid.");

export const invitationAcceptSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must contain at least 2 characters.")
    .max(120, "Name must contain at most 120 characters.")
    .transform((value) => value.replace(/\s+/g, " ")),
  password: passwordSchema,
});

export type MemberListQuery = z.infer<typeof memberListQuerySchema>;
export type MemberUpdateInput = z.infer<typeof memberUpdateSchema>;
export type InvitationCreateInput = z.infer<typeof invitationCreateSchema>;
export type InvitationAcceptInput = z.infer<typeof invitationAcceptSchema>;