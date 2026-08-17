import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

async function main() {
  const result = await p.feedback.findMany({
    where: {
      workspace: {
        slug: "acme-cloud",
      },
    },
    select: {
      id: true,
      classificationStatus: true,
      content: true,
      themes: {
        select: {
          theme: {
            select: {
              name: true,
            },
          },
          confidence: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const withoutThemes = result.filter((item) => item.themes.length === 0);

  console.log(`Total feedback: ${result.length}`);
  console.log(`Without themes: ${withoutThemes.length}`);
  console.log(`With themes: ${result.length - withoutThemes.length}`);

  console.log("\nFeedback without themes:");
  for (const item of withoutThemes) {
    console.log({
      id: item.id,
      status: item.classificationStatus,
      content: item.content,
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await p.$disconnect();
  });
