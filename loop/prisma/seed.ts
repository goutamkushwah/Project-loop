import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {

  const workspace = await prisma.workspace.create({
    data: {
      name: "Demo Workspace",
      description: "Seeded workspace",
    },
  });


  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@loop.com",
      password: "password123",
      role: Role.ADMIN,
      workspaceId: workspace.id,
    },
  });


  const analyst = await prisma.user.create({
    data: {
      name: "Analyst User",
      email: "analyst@loop.com",
      password: "password123",
      role: Role.ANALYST,
      workspaceId: workspace.id,
    },
  });


  const viewer = await prisma.user.create({
    data: {
      name: "Viewer User",
      email: "viewer@loop.com",
      password: "password123",
      role: Role.VIEWER,
      workspaceId: workspace.id,
    },
  });


  console.log({
    workspace,
    admin,
    analyst,
    viewer,
  });
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });