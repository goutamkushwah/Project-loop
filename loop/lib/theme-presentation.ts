////import "server-only";

const THEME_COLOR_PALETTE = [
  "#7C6CE7",
  "#2563EB",
  "#0891B2",
  "#059669",
  "#65A30D",
  "#D97706",
  "#DC2626",
  "#DB2777",
  "#9333EA",
  "#4F46E5",
] as const;

export function normalizeThemeName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US");
}

export function themeColorForName(name: string): string {
  const normalizedName = normalizeThemeName(name);
  let hash = 2_166_136_261;

  for (const character of normalizedName) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16_777_619) >>> 0;
  }

  return THEME_COLOR_PALETTE[hash % THEME_COLOR_PALETTE.length];
}

export function themeDescriptionForName(name: string): string {
  const trimmedName = name.trim().replace(/\s+/g, " ");
  return `Customer feedback grouped around ${trimmedName}.`;
}