import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import {
  embedFeedback,
  EMBEDDING_DIMENSION,
  EMBEDDING_MODEL_NAME,
  EMBEDDING_PROVIDER,
} from "../services/embedding-service";

const db = new PrismaClient();

const TEST_FEEDBACK = [
  "The checkout process is very slow. Sometimes the payment page takes more than 30 seconds to load, and on a few attempts my payment failed even though the money was deducted.",
  "The mobile app is difficult to use. The navigation is confusing, and I often cannot find my order history quickly.",
];

async function main() {
  console.log("Starting test feedback embedding...");
  console.log(`Embedding model: ${EMBEDDING_MODEL_NAME}`);
  console.log(`Embedding dimensions: ${EMBEDDING_DIMENSION}`);

  let embeddedCount = 0;
  let skippedCount = 0;

  for (const content of TEST_FEEDBACK) {
    console.log("\nSearching for feedback...");

    const feedback = await db.feedback.findFirst({
      where: {
        content,
        embedding: null,
      },
      select: {
        id: true,
        workspaceId: true,
        content: true,
      },
    });

    if (!feedback) {
      const existingFeedback = await db.feedback.findFirst({
        where: {
          content,
        },
        select: {
          id: true,
          embedding: {
            select: {
              id: true,
            },
          },
        },
      });

      if (existingFeedback?.embedding) {
        console.log(
          `Skipping: embedding already exists for feedback ${existingFeedback.id}`,
        );
      } else {
        console.log("Skipping: feedback was not found in the database.");
      }

      skippedCount++;
      continue;
    }

    console.log(`Embedding feedback: ${feedback.id}`);
    console.log(`Content: ${feedback.content}`);

    const vector = await embedFeedback(feedback.content);

    console.log(`Generated vector with ${vector.length} dimensions.`);

    if (vector.length !== EMBEDDING_DIMENSION) {
      throw new Error(
        `Embedding dimension mismatch. Expected ${EMBEDDING_DIMENSION}, received ${vector.length}.`,
      );
    }

    const vectorLiteral = `[${vector.join(",")}]`;

    await db.$executeRaw`
      INSERT INTO "Embedding" (
        "id",
        "feedbackId",
        "workspaceId",
        "vector",
        "provider",
        "model",
        "dimensions",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        gen_random_uuid(),
        ${feedback.id}::uuid,
        ${feedback.workspaceId}::uuid,
        ${vectorLiteral}::vector,
        ${EMBEDDING_PROVIDER},
        ${EMBEDDING_MODEL_NAME},
        ${EMBEDDING_DIMENSION},
        NOW(),
        NOW()
      )
      ON CONFLICT ("feedbackId") DO NOTHING
    `;

    console.log(`EMBEDDING STORED: ${feedback.id}`);

    embeddedCount++;
  }

  console.log("\n--------------------------------");
  console.log("Test embedding process completed.");
  console.log(`Embedded: ${embeddedCount}`);
  console.log(`Skipped: ${skippedCount}`);
  console.log("--------------------------------");
}

main()
  .catch((error) => {
    console.error("\nEMBEDDING FAILED:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });