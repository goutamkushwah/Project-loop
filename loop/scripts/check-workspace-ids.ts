import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

async function main() {
  const workspaceIds = [
    "4d406246-2e9e-4729-b691-7f2792c84cfc",
    "773ae37b-24db-4854-9d97-bebfd2e71582",
  ];

  const workspaces = await p.workspace.findMany({
    where: {
      id: {
        in: workspaceIds,
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  console.log(JSON.stringify(workspaces, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await p.$disconnect();
  });
