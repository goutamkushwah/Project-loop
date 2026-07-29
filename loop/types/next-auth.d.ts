import type { UserRole } from "@prisma/client";
import type { DefaultSession, DefaultUser } from "next-auth";

export {};

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      workspaceId: string;
      workspaceName: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: UserRole;
    workspaceId: string;
    workspaceName: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    role: UserRole;
    workspaceId: string;
    workspaceName: string;
  }
}