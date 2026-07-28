import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const workspace = await prisma.workspace.create({
    data: {
      name: "Demo Workspace",
      description: "Seeded workspace",
    },
  });

  console.log(workspace);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });