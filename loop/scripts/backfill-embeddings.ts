import { db } from "../lib/db";
import {
  embedWorkspaceFeedbackBatch,
  getWorkspaceEmbeddingCoverage,
  listWorkspaceEmbeddingBackfillCandidates,
} from "../services/embedding-service";

const DEFAULT_WORKSPACE_SLUG = "acme-cloud";
const DEFAULT_LIMIT = 5_000;

function argumentValue(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length);
}

function parseLimit(value: string | undefined): number {
  if (!value) {
    return DEFAULT_LIMIT;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 50_000) {
    throw new Error("--limit must be an integer between 1 and 50000.");
  }

  return parsed;
}

async function main(): Promise<void> {
  const workspaceSlug = argumentValue("workspace") ?? DEFAULT_WORKSPACE_SLUG;
  const limit = parseLimit(argumentValue("limit"));
  const workspace = await db.workspace.findUnique({
    where: {
      slug: workspaceSlug,
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  if (!workspace) {
    throw new Error(`Workspace '${workspaceSlug}' was not found.`);
  }

  const before = await getWorkspaceEmbeddingCoverage(workspace.id);
  const candidateIds = await listWorkspaceEmbeddingBackfillCandidates(workspace.id, limit);

  console.info(`Embedding backfill: ${workspace.name} (${workspace.slug})`);
  console.info(
    `Before: ${before.embeddedFeedback}/${before.totalFeedback} indexed (${before.coveragePercentage}%).`,
  );
  console.info(`Candidates selected: ${candidateIds.length}.`);

  if (candidateIds.length === 0) {
    console.info("No feedback embeddings need backfilling.");
    return;
  }

  const summary = await embedWorkspaceFeedbackBatch(workspace.id, candidateIds);
  const after = await getWorkspaceEmbeddingCoverage(workspace.id);

  console.info(
    `Completed: ${summary.completedRows}; failed: ${summary.failedRows}; model: ${summary.model}; dimensions: ${summary.dimensions}.`,
  );
  console.info(
    `After: ${after.embeddedFeedback}/${after.totalFeedback} indexed (${after.coveragePercentage}%).`,
  );

  if (summary.failedRows > 0) {
    process.exitCode = 1;
  }
}

main()
  .catch((error: unknown) => {
    console.error("Embedding backfill failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });