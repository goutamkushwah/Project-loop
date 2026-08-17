import { PrismaClient, ClassificationStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.feedback.updateMany({
    where: {
      workspace: {
        slug: "acme-cloud",
      },
      classificationStatus: ClassificationStatus.PROCESSING,
    },
    data: {
      classificationStatus: ClassificationStatus.PENDING,
      classificationAttempts: 0,
      classificationError: null,
      classifiedAt: null,
      sentiment: null,
      sentimentScore: null,
      featureArea: null,
      classificationRationale: null,
      updatedAt: new Date(),
    },
  });

  console.log(`Reset ${result.count} PROCESSING feedback items to PENDING.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
