import { randomBytes } from "node:crypto";

const MAX_BASE_LENGTH = 72;

export function createWorkspaceSlug(name: string): string {
  const normalized = name
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_BASE_LENGTH)
    .replace(/-+$/g, "");

  const base = normalized || "workspace";
  const suffix = randomBytes(3).toString("hex");

  return `${base}-${suffix}`;
}