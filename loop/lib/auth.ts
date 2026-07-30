import "server-only";

import { Prisma } from "@prisma/client";
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { redirect } from "next/navigation";
import { cache } from "react";

import { loginSchema } from "@/lib/auth-validation";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { verifyPassword } from "@/lib/password";

const SESSION_MAX_AGE_SECONDS = 12 * 60 * 60;
const DUMMY_PASSWORD_HASH =
  "scrypt$16384$8$1$000102030405060708090a0b0c0d0e0f$bb542213f0d3dbfa0cac83d1f8e80192e319de47e4d2c56e70245fbfc95bcc4015b02d1023e303a7415ae0a679fc0ab4baafa202b2a2e42f07a54482d3ad85ce";

const currentUserSelect = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  workspaceId: true,
  createdAt: true,
  lastLoginAt: true,
  workspace: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
});

export type CurrentUser = Prisma.UserGetPayload<{
  select: typeof currentUserSelect;
}>;

export const authOptions = {
  secret: env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  jwt: {
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Email and password",
      credentials: {
        email: {
          label: "Email",
          type: "email",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },
      async authorize(credentials) {
        const parsedCredentials = loginSchema.safeParse(credentials);

        if (!parsedCredentials.success) {
          return null;
        }

        const { email, password } = parsedCredentials.data;
        const user = await db.user.findUnique({
          where: {
            email,
          },
          select: {
            id: true,
            name: true,
            email: true,
            passwordHash: true,
            role: true,
            isActive: true,
            workspaceId: true,
            workspace: {
              select: {
                name: true,
              },
            },
          },
        });

        if (!user) {
          await verifyPassword(password, DUMMY_PASSWORD_HASH);
          return null;
        }

        const passwordMatches = await verifyPassword(password, user.passwordHash);

        if (!passwordMatches || !user.isActive) {
          return null;
        }

        await db.user
          .updateMany({
            where: {
              id: user.id,
              workspaceId: user.workspaceId,
              isActive: true,
            },
            data: {
              lastLoginAt: new Date(),
            },
          })
          .catch(() => undefined);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          workspaceId: user.workspaceId,
          workspaceName: user.workspace.name,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.role = user.role;
        token.workspaceId = user.workspaceId;
        token.workspaceName = user.workspaceName;
      }

      return token;
    },
    async session({ session, token }) {
      session.user.id = token.userId;
      session.user.role = token.role;
      session.user.workspaceId = token.workspaceId;
      session.user.workspaceName = token.workspaceName;

      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }

      try {
        if (new URL(url).origin === baseUrl) {
          return url;
        }
      } catch {
        return baseUrl;
      }

      return baseUrl;
    },
  },
} satisfies NextAuthOptions;

export function auth() {
  return getServerSession(authOptions);
}

async function resolveCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();

  if (!session?.user?.id || !session.user.workspaceId) {
    return null;
  }

  return db.user.findFirst({
    where: {
      id: session.user.id,
      workspaceId: session.user.workspaceId,
      isActive: true,
    },
    select: currentUserSelect,
  });
}

export const getCurrentUser = cache(resolveCurrentUser);

export function getCurrentApiUser(): Promise<CurrentUser | null> {
  return resolveCurrentUser();
}

export async function requireCurrentUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}