import { ClassificationStatus, FeedbackStatus, Prisma, PrismaClient } from "@prisma/client";

import { hashPassword } from "../lib/password";
import {
  CUSTOMER_CONTEXTS,
  DEMO_USERS,
  DEMO_WORKSPACE,
  FEEDBACK_BLUEPRINTS,
  THEME_SEEDS,
} from "./seed-data";

const prisma = new PrismaClient();
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1_000;

function resolveDemoPassword(user: (typeof DEMO_USERS)[number]): string {
  const configuredPassword = process.env[user.passwordEnvironmentKey];

  return configuredPassword?.trim() || user.defaultPassword;
}

function buildFeedbackRows(workspaceId: string): Prisma.FeedbackCreateManyInput[] {
  const seededAt = new Date();

  return FEEDBACK_BLUEPRINTS.flatMap((blueprint, blueprintIndex) =>
    CUSTOMER_CONTEXTS.map((context, contextIndex) => {
      const index = blueprintIndex * CUSTOMER_CONTEXTS.length + contextIndex;
      const daysAgo = index % 90;
      const minuteOffset = (index * 37) % (24 * 60);

      const createdAt = new Date(
        seededAt.getTime() - daysAgo * MILLISECONDS_PER_DAY - minuteOffset * 60_000,
      );

      const status =
        index % 11 === 0
          ? FeedbackStatus.ACTIONED
          : index % 4 === 0
            ? FeedbackStatus.REVIEWED
            : FeedbackStatus.NEW;

      return {
        workspaceId,
        content: `${blueprint.content} ${context.suffix}`,
        channel: blueprint.channel,
        sourceRef: `demo-${blueprint.channel.toLowerCase()}-${String(index + 1).padStart(3, "0")}`,
        customerLabel: context.customerLabel,
        classificationStatus: ClassificationStatus.PENDING,
        classificationAttempts: 0,
        status,
        createdAt,
        updatedAt: createdAt,
      };
    }),
  );
}

async function seed(): Promise<void> {
  const passwordHashes = await Promise.all(
    DEMO_USERS.map(async (user) => {
      const password = resolveDemoPassword(user);

      return {
        user,
        password,
        passwordHash: await hashPassword(password),
      };
    }),
  );

  const result = await prisma.$transaction(
    async (transaction) => {
      await transaction.workspace.deleteMany({
        where: {
          slug: DEMO_WORKSPACE.slug,
        },
      });

      const workspace = await transaction.workspace.create({
        data: DEMO_WORKSPACE,
      });

      await transaction.user.createMany({
        data: passwordHashes.map(({ user, passwordHash }) => ({
          workspaceId: workspace.id,
          name: user.name,
          email: user.email.toLowerCase(),
          passwordHash,
          role: user.role,
          isActive: true,
        })),
      });

      await transaction.theme.createMany({
        data: THEME_SEEDS.map((theme) => ({
          workspaceId: workspace.id,
          ...theme,
        })),
      });

      const feedbackRows = buildFeedbackRows(workspace.id);

      const feedbackResult = await transaction.feedback.createMany({
        data: feedbackRows,
      });

      const [userCount, themeCount] = await Promise.all([
        transaction.user.count({
          where: {
            workspaceId: workspace.id,
          },
        }),
        transaction.theme.count({
          where: {
            workspaceId: workspace.id,
          },
        }),
      ]);

      return {
        workspace,
        userCount,
        themeCount,
        feedbackCount: feedbackResult.count,
      };
    },
    {
      maxWait: 10000,
      timeout: 20000,
    },
  );

  console.info("LOOP demo database seeded successfully.");
  console.info(`Workspace: ${result.workspace.name} (${result.workspace.slug})`);
  console.info(`Users: ${result.userCount}`);
  console.info(`Themes: ${result.themeCount}`);
  console.info(`Feedback items: ${result.feedbackCount}`);
  console.info("Demo credentials:");

  for (const { user, password } of passwordHashes) {
    console.info(`- ${user.role}: ${user.email} / ${password}`);
  }
}

seed()
  .catch((error: unknown) => {
    console.error("LOOP database seed failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
