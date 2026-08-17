import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

async function main() {
  const workspaces = await p.workspace.findMany({
    where: {
      slug: "acme-cloud",
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
