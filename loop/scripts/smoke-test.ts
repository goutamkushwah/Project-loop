type SmokeRole = "ADMIN" | "ANALYST" | "VIEWER";

type DemoAccount = {
  role: SmokeRole;
  email: string;
  password: string;
};

type HealthResponse = {
  service?: string;
  status?: string;
  database?: string;
};

type SessionResponse = {
  user?: {
    email?: string | null;
    role?: string;
  };
};

const DEFAULT_ACCOUNTS: DemoAccount[] = [
  {
    role: "ADMIN",
    email: "admin@loop.demo",
    password: process.env.SEED_ADMIN_PASSWORD?.trim() || "LoopAdmin!2026",
  },
  {
    role: "ANALYST",
    email: "analyst@loop.demo",
    password: process.env.SEED_ANALYST_PASSWORD?.trim() || "LoopAnalyst!2026",
  },
  {
    role: "VIEWER",
    email: "viewer@loop.demo",
    password: process.env.SEED_VIEWER_PASSWORD?.trim() || "LoopViewer!2026",
  },
];

function readArgument(name: string): string | null {
  const inlinePrefix = `--${name}=`;
  const inline = process.argv.find((argument) => argument.startsWith(inlinePrefix));

  if (inline) {
    return inline.slice(inlinePrefix.length).trim() || null;
  }

  const index = process.argv.indexOf(`--${name}`);

  if (index >= 0) {
    return process.argv[index + 1]?.trim() || null;
  }

  return null;
}

function normalizeBaseUrl(value: string): string {
  const parsed = new URL(value);

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Smoke-test base URL must use http or https.");
  }

  parsed.pathname = parsed.pathname.replace(/\/+$/, "");
  parsed.search = "";
  parsed.hash = "";

  return parsed.toString().replace(/\/$/, "");
}

function splitSetCookieHeader(value: string): string[] {
  return value.split(/,(?=\s*[^;,\s]+=)/g);
}

class CookieJar {
  private readonly cookies = new Map<string, string>();

  capture(headers: Headers): void {
    const headersWithSetCookie = headers as Headers & {
      getSetCookie?: () => string[];
    };
    const rawCookies =
      headersWithSetCookie.getSetCookie?.() ??
      (headers.get("set-cookie") ? splitSetCookieHeader(headers.get("set-cookie") as string) : []);

    for (const rawCookie of rawCookies) {
      const firstSegment = rawCookie.split(";", 1)[0]?.trim();

      if (!firstSegment) {
        continue;
      }

      const equalsIndex = firstSegment.indexOf("=");

      if (equalsIndex <= 0) {
        continue;
      }

      const name = firstSegment.slice(0, equalsIndex).trim();
      const value = firstSegment.slice(equalsIndex + 1).trim();
      const isExpired = /(?:^|;)\s*max-age=0(?:;|$)/i.test(rawCookie);

      if (!value || isExpired) {
        this.cookies.delete(name);
      } else {
        this.cookies.set(name, value);
      }
    }
  }

  header(): string | null {
    if (this.cookies.size === 0) {
      return null;
    }

    return Array.from(this.cookies.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join("; ");
  }
}

async function request(
  baseUrl: string,
  jar: CookieJar | null,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  const cookieHeader = jar?.header();

  if (cookieHeader) {
    headers.set("Cookie", cookieHeader);
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
    redirect: init.redirect ?? "manual",
  });

  jar?.capture(response.headers);

  return response;
}

async function expectStatus(
  label: string,
  responsePromise: Promise<Response>,
  expected: readonly number[],
): Promise<Response> {
  const response = await responsePromise;

  if (!expected.includes(response.status)) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `${label} returned HTTP ${response.status}; expected ${expected.join(" or ")}. ${body.slice(0, 300)}`,
    );
  }

  console.info(`✓ ${label} (${response.status})`);
  return response;
}

async function login(baseUrl: string, account: DemoAccount): Promise<CookieJar> {
  const jar = new CookieJar();
  const csrfResponse = await expectStatus(
    `${account.role} CSRF endpoint`,
    request(baseUrl, jar, "/api/auth/csrf"),
    [200],
  );
  const csrfPayload = (await csrfResponse.json()) as { csrfToken?: string };

  if (!csrfPayload.csrfToken) {
    throw new Error(`${account.role} login did not receive a CSRF token.`);
  }

  const body = new URLSearchParams({
    csrfToken: csrfPayload.csrfToken,
    email: account.email,
    password: account.password,
    callbackUrl: `${baseUrl}/dashboard`,
    json: "true",
  });

  await expectStatus(
    `${account.role} credentials login`,
    request(baseUrl, jar, "/api/auth/callback/credentials", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Origin: baseUrl,
        Referer: `${baseUrl}/login`,
      },
      body,
    }),
    [200, 302, 303],
  );

  const sessionResponse = await expectStatus(
    `${account.role} authenticated session`,
    request(baseUrl, jar, "/api/auth/session"),
    [200],
  );
  const session = (await sessionResponse.json()) as SessionResponse;

  if (session.user?.email !== account.email || session.user.role !== account.role) {
    throw new Error(
      `${account.role} session mismatch. Expected ${account.email}/${account.role}, received ${session.user?.email ?? "no email"}/${session.user?.role ?? "no role"}.`,
    );
  }

  return jar;
}

async function verifyRole(baseUrl: string, account: DemoAccount): Promise<void> {
  const jar = await login(baseUrl, account);

  await expectStatus(
    `${account.role} dashboard page`,
    request(baseUrl, jar, "/dashboard"),
    [200],
  );
  await expectStatus(
    `${account.role} feedback API`,
    request(baseUrl, jar, "/api/feedback?page=1&pageSize=5&sortOrder=desc"),
    [200],
  );
  await expectStatus(
    `${account.role} dashboard analytics API`,
    request(baseUrl, jar, "/api/dashboard/analytics"),
    [200],
  );
  await expectStatus(
    `${account.role} themes API`,
    request(baseUrl, jar, "/api/themes?page=1&pageSize=5&sortBy=count&sortOrder=desc"),
    [200],
  );
  await expectStatus(
    `${account.role} trends API`,
    request(baseUrl, jar, "/api/trends"),
    [200],
  );
  await expectStatus(
    `${account.role} reports API`,
    request(baseUrl, jar, "/api/reports?page=1&pageSize=5&sortBy=createdAt&sortOrder=desc"),
    [200],
  );

  const membersExpected = account.role === "ADMIN" ? [200] : [403];
  await expectStatus(
    `${account.role} member-list authorization`,
    request(baseUrl, jar, "/api/members?page=1&pageSize=5&sortBy=name&sortOrder=asc"),
    membersExpected,
  );
}

async function main(): Promise<void> {
  const baseUrlArgument = readArgument("base-url") ?? process.env.SMOKE_BASE_URL?.trim() ?? null;

  if (!baseUrlArgument) {
    throw new Error(
      "A deployment URL is required. Run: npm run smoke -- --base-url=https://your-project.vercel.app",
    );
  }

  const baseUrl = normalizeBaseUrl(baseUrlArgument);
  console.info(`LOOP production smoke test: ${baseUrl}`);

  await expectStatus("Landing page", request(baseUrl, null, "/"), [200]);
  await expectStatus("Login page", request(baseUrl, null, "/login"), [200]);

  const healthResponse = await expectStatus(
    "Health endpoint",
    request(baseUrl, null, "/api/health"),
    [200],
  );
  const health = (await healthResponse.json()) as HealthResponse;

  if (health.service !== "loop" || health.status !== "healthy" || health.database !== "connected") {
    throw new Error(`Health endpoint returned an unexpected payload: ${JSON.stringify(health)}`);
  }

  for (const account of DEFAULT_ACCOUNTS) {
    await verifyRole(baseUrl, account);
  }

  console.info("LOOP production smoke test passed.");
  console.info("Public routing, database health, all three demo logins, core read APIs, and member RBAC are healthy.");
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown smoke-test error.";

  console.error("LOOP production smoke test failed.");
  console.error(message);
  process.exitCode = 1;
});