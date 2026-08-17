import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

async function main() {
  const r = await p.user.findMany({
    where: {
      email: {
        in: [
          "admin@loop.demo",
          "analyst@loop.demo",
          "viewer@loop.demo",
        ],
      },
    },
    select: {
      email: true,
      workspaceId: true,
      role: true,
      isActive: true,
    },
  });

  console.log(JSON.stringify(r, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await p.$disconnect();
  });
