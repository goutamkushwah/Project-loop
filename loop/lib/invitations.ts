import { createHash, randomBytes } from "node:crypto";

const INVITATION_TOKEN_BYTES = 32;
const INVITATION_LIFETIME_DAYS = 7;

export function createInvitationToken(): string {
  return randomBytes(INVITATION_TOKEN_BYTES).toString("base64url");
}

export function hashInvitationToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function createInvitationExpiry(from = new Date()): Date {
  const expiresAt = new Date(from);
  expiresAt.setUTCDate(expiresAt.getUTCDate() + INVITATION_LIFETIME_DAYS);
  return expiresAt;
}