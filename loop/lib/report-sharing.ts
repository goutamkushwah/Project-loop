import "server-only";

import { createHash, randomBytes } from "node:crypto";

export const REPORT_SHARE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function createReportShareToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("base64url");

  return {
    token,
    tokenHash: hashReportShareToken(token),
  };
}

export function hashReportShareToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}