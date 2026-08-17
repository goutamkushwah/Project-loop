import { ClassificationStatus, PrismaClient, UserRole } from "@prisma/client";

import {
  DEMO_USERS,
  DEMO_WORKSPACE,
  FEEDBACK_BLUEPRINTS,
  CUSTOMER_CONTEXTS,
  THEME_SEEDS,
} from "../prisma/seed-data";

const prisma = new PrismaClient();

const EXPECTED_FEEDBACK_COUNT = FEEDBACK_BLUEPRINTS.length * CUSTOMER_CONTEXTS.length;

function assertCondition(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function verifyFinalSeed(): Promise<void> {
  const workspace = await prisma.workspace.findUnique({
    where: {
      slug: DEMO_WORKSPACE.slug,
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  assertCondition(workspace !== null, `Demo workspace \"${DEMO_WORKSPACE.slug}\" was not found.`);

  const [users, feedbackCount, themeCount, embeddingCount, unthemedCount, statusGroups] =
    await Promise.all([
      prisma.user.findMany({
        where: {
          workspaceId: workspace.id,
        },
        select: {
          email: true,
          role: true,
          isActive: true,
        },
        orderBy: {
          email: "asc",
        },
      }),
      prisma.feedback.count({
        where: {
          workspaceId: workspace.id,
        },
      }),
      prisma.theme.count({
        where: {
          workspaceId: workspace.id,
        },
      }),
      prisma.embedding.count({
        where: {
          workspaceId: workspace.id,
        },
      }),
      prisma.feedback.count({
        where: {
          workspaceId: workspace.id,
          themes: {
            none: {},
          },
        },
      }),
      prisma.feedback.groupBy({
        by: ["classificationStatus"],
        where: {
          workspaceId: workspace.id,
        },
        _count: {
          _all: true,
        },
      }),
    ]);

  assertCondition(
    users.length === DEMO_USERS.length,
    `Expected ${DEMO_USERS.length} demo users but found ${users.length}.`,
  );

  for (const expectedUser of DEMO_USERS) {
    const actualUser = users.find((user) => user.email === expectedUser.email.toLowerCase());

    assertCondition(actualUser !== undefined, `Missing demo user ${expectedUser.email}.`);
    assertCondition(
      actualUser.role === expectedUser.role,
      `${expectedUser.email} must have role ${expectedUser.role}, found ${actualUser.role}.`,
    );
    assertCondition(actualUser.isActive, `${expectedUser.email} must be active.`);
  }

  const roleCounts = users.reduce<Record<UserRole, number>>(
    (counts, user) => {
      counts[user.role] += 1;
      return counts;
    },
    {
      ADMIN: 0,
      ANALYST: 0,
      VIEWER: 0,
    },
  );

  assertCondition(roleCounts.ADMIN === 1, "Final demo seed must contain exactly one ADMIN.");
  assertCondition(roleCounts.ANALYST === 1, "Final demo seed must contain exactly one ANALYST.");
  assertCondition(roleCounts.VIEWER === 1, "Final demo seed must contain exactly one VIEWER.");

  assertCondition(
    feedbackCount === EXPECTED_FEEDBACK_COUNT,
    `Expected ${EXPECTED_FEEDBACK_COUNT} feedback records but found ${feedbackCount}.`,
  );
  assertCondition(
    themeCount >= THEME_SEEDS.length,
    `Expected at least ${THEME_SEEDS.length} themes but found ${themeCount}.`,
  );
  assertCondition(
    embeddingCount === feedbackCount,
    `Expected one embedding per feedback item (${feedbackCount}) but found ${embeddingCount}.`,
  );
  assertCondition(
    unthemedCount === 0,
    `${unthemedCount} feedback item(s) do not have a stored theme assignment.`,
  );

  const classificationCounts = new Map(
    statusGroups.map((group) => [group.classificationStatus, group._count._all]),
  );
  const completedCount = classificationCounts.get(ClassificationStatus.COMPLETED) ?? 0;

  assertCondition(
    completedCount === feedbackCount,
    `Expected all ${feedbackCount} feedback items to be COMPLETED, found ${completedCount}.`,
  );

  for (const status of [
    ClassificationStatus.PENDING,
    ClassificationStatus.PROCESSING,
    ClassificationStatus.FAILED,
    ClassificationStatus.REVIEW_REQUIRED,
  ]) {
    const count = classificationCounts.get(status) ?? 0;
    assertCondition(count === 0, `Expected 0 ${status} feedback items but found ${count}.`);
  }

  console.info("LOOP final seed verification passed.");
  console.info(`Workspace: ${workspace.name} (${workspace.slug})`);
  console.info(`Users: ${users.length} (ADMIN 1 / ANALYST 1 / VIEWER 1)`);
  console.info(`Feedback: ${feedbackCount}`);
  console.info(`Themes: ${themeCount}`);
  console.info(`Embeddings: ${embeddingCount}`);
  console.info(`Completed classifications: ${completedCount}`);
  console.info("Theme coverage: 100%");
  console.info("Embedding coverage: 100%");
}

verifyFinalSeed()
  .catch((error: unknown) => {
    const message =
      error instanceof Error ? error.message : "Unknown final-seed verification error.";

    console.error("LOOP final seed verification failed.");
    console.error(message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
