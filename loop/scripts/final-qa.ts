import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, relative, sep } from "node:path";

type CheckResult = {
  label: string;
  passed: boolean;
  detail: string;
};

const ROOT = process.cwd();
const SCREENSHOT_FILES = [
  "01-login.png",
  "02-dashboard.png",
  "03-inbox.png",
  "04-themes.png",
  "05-trends.png",
  "06-ask-loop.png",
  "07-voc-report.png",
  "08-admin-members.png",
] as const;

const REQUIRED_FILES = [
  "README.md",
  ".env.example",
  "package.json",
  "prisma/schema.prisma",
  "prisma/seed.ts",
  "scripts/verify-final-seed.ts",
  "scripts/smoke-test.ts",
  "scripts/final-qa.ts",
  "docs/demo-video-script.md",
  "docs/final-qa-checklist.md",
  "docs/submission-checklist.md",
  "docs/screenshots/README.md",
  "app/(app)/dashboard/page.tsx",
  "app/(app)/inbox/page.tsx",
  "app/(app)/themes/page.tsx",
  "app/(app)/trends/page.tsx",
  "app/(app)/ask/page.tsx",
  "app/(app)/reports/page.tsx",
  "app/(app)/settings/members/page.tsx",
  "app/api/health/route.ts",
  "app/api/feedback/route.ts",
  "app/api/themes/route.ts",
  "app/api/trends/route.ts",
  "app/api/ask/route.ts",
  "app/api/reports/route.ts",
] as const;

const REQUIRED_README_HEADINGS = [
  "# LOOP — AI Customer-Feedback Intelligence Platform",
  "## Core features",
  "## Tech stack",
  "## Architecture",
  "## RBAC",
  "## Local setup",
  "## Demo credentials",
  "## Production deployment",
  "## Screenshots",
  "## Security notes",
  "## Submission checklist",
  "## Final QA and demo",
] as const;

const TEXT_EXTENSIONS = new Set([
  ".css",
  ".csv",
  ".env",
  ".example",
  ".html",
  ".js",
  ".json",
  ".md",
  ".mjs",
  ".prisma",
  ".sql",
  ".ts",
  ".tsx",
  ".txt",
  ".yml",
  ".yaml",
]);

const SKIPPED_DIRECTORIES = new Set([
  ".git",
  ".next",
  "coverage",
  "node_modules",
]);

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function normalizeRelativePath(path: string): string {
  return relative(ROOT, path).split(sep).join("/");
}

function extensionOf(path: string): string {
  const fileName = path.split(/[\\/]/).at(-1) ?? path;
  const dotIndex = fileName.lastIndexOf(".");

  if (dotIndex < 0) {
    return "";
  }

  return fileName.slice(dotIndex).toLowerCase();
}

function walkFiles(directory: string): string[] {
  const files: string[] = [];

  for (const entry of readdirSync(directory)) {
    if (SKIPPED_DIRECTORIES.has(entry)) {
      continue;
    }

    const absolutePath = resolve(directory, entry);

    if (entry.startsWith(".env") && entry !== ".env.example") {
      continue;
    }

    const stat = statSync(absolutePath);

    if (stat.isDirectory()) {
      files.push(...walkFiles(absolutePath));
      continue;
    }

    if (stat.isFile()) {
      files.push(absolutePath);
    }
  }

  return files;
}

function readTextFile(path: string): string | null {
  const extension = extensionOf(path);

  if (!TEXT_EXTENSIONS.has(extension)) {
    return null;
  }

  try {
    return readFileSync(path, "utf8");
  } catch {
    return null;
  }
}

function push(
  results: CheckResult[],
  label: string,
  passed: boolean,
  detail: string,
): void {
  results.push({
    label,
    passed,
    detail,
  });
}

function verifyRequiredFiles(results: CheckResult[]): void {
  const missing = REQUIRED_FILES.filter((path) => !existsSync(resolve(ROOT, path)));

  push(
    results,
    "Required project files",
    missing.length === 0,
    missing.length === 0 ? `${REQUIRED_FILES.length} required files present.` : `Missing: ${missing.join(", ")}`,
  );
}

function verifyPackageJson(results: CheckResult[]): void {
  const packagePath = resolve(ROOT, "package.json");
  const packageJson = JSON.parse(readFileSync(packagePath, "utf8")) as {
    version?: string;
    scripts?: Record<string, string>;
    dependencies?: Record<string, string>;
  };

  push(
    results,
    "Project version",
    packageJson.version === "0.20.0",
    `Found ${packageJson.version ?? "no version"}; expected 0.20.0.`,
  );

  const requiredScripts = [
    "build",
    "typecheck",
    "lint",
    "format:check",
    "db:migrate:deploy",
    "db:seed:final",
    "db:verify:seed",
    "smoke",
    "qa:repo",
    "qa:submission",
    "final:qa",
  ];
  const missingScripts = requiredScripts.filter((name) => !packageJson.scripts?.[name]);

  push(
    results,
    "Final QA npm scripts",
    missingScripts.length === 0,
    missingScripts.length === 0 ? "All required QA scripts are present." : `Missing scripts: ${missingScripts.join(", ")}`,
  );

  const hasGemini = packageJson.dependencies?.["@google/genai"] === "2.14.0";
  const legacyProviderTerm = ["anth", "ropic"].join("");
  const hasForbiddenAiDependency = Object.keys(packageJson.dependencies ?? {}).some((name) =>
    name.toLowerCase().includes(legacyProviderTerm),
  );

  push(
    results,
    "Gemini dependency",
    hasGemini && !hasForbiddenAiDependency,
    hasGemini && !hasForbiddenAiDependency
      ? "Official Google Gemini SDK is pinned and no legacy AI-provider dependency is present."
      : "Gemini dependency is missing/changed or a legacy AI-provider dependency remains.",
  );
}

function verifyReadme(results: CheckResult[]): void {
  const readme = readFileSync(resolve(ROOT, "README.md"), "utf8");
  const missingHeadings = REQUIRED_README_HEADINGS.filter((heading) => !readme.includes(heading));

  push(
    results,
    "README required sections",
    missingHeadings.length === 0,
    missingHeadings.length === 0 ? "All final README sections are present." : `Missing: ${missingHeadings.join(", ")}`,
  );

  const requiredCredentials = [
    "admin@loop.demo",
    "analyst@loop.demo",
    "viewer@loop.demo",
    "LoopAdmin!2026",
    "LoopAnalyst!2026",
    "LoopViewer!2026",
  ];
  const missingCredentials = requiredCredentials.filter((value) => !readme.includes(value));

  push(
    results,
    "README demo credentials",
    missingCredentials.length === 0,
    missingCredentials.length === 0
      ? "Admin, Analyst, and Viewer demo credentials are documented."
      : `Missing credential documentation: ${missingCredentials.join(", ")}`,
  );
}

function verifyForbiddenReferences(results: CheckResult[], files: string[]): void {
  const forbiddenPatterns = [
    {
      label: "legacy AI provider name",
      pattern: new RegExp(["anth", "ropic"].join(""), "gi"),
    },
    {
      label: "legacy model family",
      pattern: new RegExp(["cl", "aude"].join(""), "gi"),
    },
    {
      label: "legacy API key",
      pattern: new RegExp(["ANTH", "ROPIC", "API", "KEY"].join("_"), "g"),
    },
    {
      label: "legacy SDK package",
      pattern: new RegExp(["@anth", "ropic-ai/sdk"].join(""), "gi"),
    },
    {
      label: "browser Gemini secret",
      pattern: new RegExp(["NEXT", "PUBLIC", "GEMINI", "API", "KEY"].join("_"), "g"),
    },
  ];
  const matches: string[] = [];

  for (const file of files) {
    const relativePath = normalizeRelativePath(file);

    if (relativePath === "scripts/final-qa.ts") {
      continue;
    }

    const text = readTextFile(file);

    if (text === null) {
      continue;
    }

    for (const item of forbiddenPatterns) {
      item.pattern.lastIndex = 0;

      if (item.pattern.test(text)) {
        matches.push(`${relativePath} (${item.label})`);
      }
    }
  }

  push(
    results,
    "Legacy/browser AI references",
    matches.length === 0,
    matches.length === 0 ? "No forbidden runtime/documentation references found." : `Found: ${matches.join(", ")}`,
  );
}

function verifySecretHygiene(results: CheckResult[], files: string[]): void {
  const findings: string[] = [];

  for (const file of files) {
    const relativePath = normalizeRelativePath(file);
    const text = readTextFile(file);

    if (text === null) {
      continue;
    }

    if (/AIza[0-9A-Za-z_-]{30,}/.test(text)) {
      findings.push(`${relativePath} contains a value shaped like a real Google API key.`);
    }

    const postgresUrls = text.match(/postgres(?:ql)?:\/\/[^\s"'`]+/gi) ?? [];

    for (const url of postgresUrls) {
      const isDocumentedExample =
        url.includes("USER:PASSWORD@HOST") ||
        url.includes("YOUR_") ||
        url.includes("example") ||
        url.includes("localhost");

      if (!isDocumentedExample) {
        findings.push(`${relativePath} contains a PostgreSQL URL that does not look like a documented example.`);
      }
    }
  }

  let trackedFileCheck = "Git tracked-file check unavailable in this extracted source tree.";

  try {
    const trackedFiles = execFileSync("git", ["ls-files"], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    })
      .split(/\r?\n/)
      .map((path) => path.trim())
      .filter(Boolean);
    const forbiddenTrackedFiles = trackedFiles.filter((path) => {
      const normalized = path.replace(/\\/g, "/");
      const fileName = normalized.split("/").at(-1) ?? normalized;
      const isEnvironmentFile = fileName.startsWith(".env") && fileName !== ".env.example";
      const isGeneratedDirectory =
        normalized === "node_modules" ||
        normalized.startsWith("node_modules/") ||
        normalized === ".next" ||
        normalized.startsWith(".next/") ||
        normalized === "coverage" ||
        normalized.startsWith("coverage/");
      const isTypeScriptBuildCache = normalized.endsWith(".tsbuildinfo");

      return isEnvironmentFile || isGeneratedDirectory || isTypeScriptBuildCache;
    });

    if (forbiddenTrackedFiles.length > 0) {
      findings.push(`Forbidden secret/generated files are tracked by Git: ${forbiddenTrackedFiles.join(", ")}.`);
    }

    trackedFileCheck = "Git tracked files contain no forbidden environment/build artifacts.";
  } catch {
    // The downloadable source archive intentionally does not contain .git metadata.
  }

  push(
    results,
    "Secret and artifact hygiene",
    findings.length === 0,
    findings.length === 0
      ? `No obvious committed secret leak detected. ${trackedFileCheck}`
      : findings.join(" "),
  );
}

function verifyScreenshots(results: CheckResult[], strictSubmission: boolean): void {
  const screenshotDirectory = resolve(ROOT, "docs/screenshots");
  const missing = SCREENSHOT_FILES.filter((fileName) => !existsSync(resolve(screenshotDirectory, fileName)));
  const readme = readFileSync(resolve(ROOT, "README.md"), "utf8");
  const missingReadmeEmbeds = SCREENSHOT_FILES.filter((fileName) => {
    const escapedFileName = fileName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const embedPattern = new RegExp(`!\\[[^\\]]*\\]\\(docs/screenshots/${escapedFileName}\\)`);

    return !embedPattern.test(readme);
  });

  if (!strictSubmission) {
    push(
      results,
      "Submission screenshots",
      true,
      missing.length === 0
        ? "All eight real screenshot files are present."
        : `${missing.length} real production screenshot(s) still need to be captured before submission; strict mode will require them.`,
    );
    return;
  }

  const passed = missing.length === 0 && missingReadmeEmbeds.length === 0;
  const details: string[] = [];

  if (missing.length > 0) {
    details.push(`Missing files: ${missing.join(", ")}.`);
  }

  if (missingReadmeEmbeds.length > 0) {
    details.push(`README does not embed: ${missingReadmeEmbeds.join(", ")}.`);
  }

  push(
    results,
    "Submission screenshots",
    passed,
    passed ? "All eight real screenshots exist and are embedded in README.md." : details.join(" "),
  );
}

function verifyGitState(results: CheckResult[], strictSubmission: boolean): void {
  if (!strictSubmission) {
    return;
  }

  try {
    const status = execFileSync("git", ["status", "--porcelain"], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();

    push(
      results,
      "Git working tree",
      status.length === 0,
      status.length === 0 ? "Working tree is clean." : "Working tree contains uncommitted changes.",
    );
  } catch {
    push(
      results,
      "Git working tree",
      false,
      "Could not read Git status. Run strict submission QA from the checked-out repository.",
    );
  }
}

function printResults(results: readonly CheckResult[]): void {
  console.info("LOOP final repository QA");
  console.info("========================");

  for (const result of results) {
    console.info(`${result.passed ? "PASS" : "FAIL"}  ${result.label}`);
    console.info(`      ${result.detail}`);
  }

  const passed = results.filter((result) => result.passed).length;
  const failed = results.length - passed;

  console.info("========================");
  console.info(`Passed: ${passed}`);
  console.info(`Failed: ${failed}`);

  if (failed > 0) {
    process.exitCode = 1;
    return;
  }

  console.info("LOOP repository QA passed.");
}

function main(): void {
  const strictSubmission = hasFlag("submission");
  const results: CheckResult[] = [];

  if (!existsSync(resolve(ROOT, "package.json"))) {
    throw new Error("Run final QA from the LOOP repository root.");
  }

  const files = walkFiles(ROOT);

  verifyRequiredFiles(results);
  verifyPackageJson(results);
  verifyReadme(results);
  verifyForbiddenReferences(results, files);
  verifySecretHygiene(results, files);
  verifyScreenshots(results, strictSubmission);
  verifyGitState(results, strictSubmission);

  printResults(results);
}

try {
  main();
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown final QA error.";

  console.error("LOOP final repository QA failed before checks completed.");
  console.error(message);
  process.exitCode = 1;
}