export function sanitizeCallbackUrl(
  value: string | null | undefined,
  fallback = "/app/login",
): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  try {
    const parsed = new URL(value, "https://loop.local");

    if (parsed.origin !== "https://loop.local") {
      return fallback;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}