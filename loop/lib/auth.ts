import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );
        if (!valid) return null;

        // Everything the JWT/session needs for RBAC + tenant scoping
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role, // ADMIN | ANALYST | VIEWER
          workspaceId: user.workspaceId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // On sign-in, copy custom fields from `user` onto the token
      if (user) {
        token.role = user.role;
        token.workspaceId = user.workspaceId;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Expose role + workspaceId on session.user so every route handler
      // can scope queries and enforce RBAC without a DB round-trip
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "ADMIN" | "ANALYST" | "VIEWER";
        session.user.workspaceId = token.workspaceId as string;
      }
      return session;
    },
  },
};

/**
 * Small helper for route handlers: throws-style guard for role checks.
 * Usage: requireRole(session, ["ADMIN", "ANALYST"])
 */
export function hasRole(
  role: "ADMIN" | "ANALYST" | "VIEWER",
  allowed: Array<"ADMIN" | "ANALYST" | "VIEWER">
): boolean {
  return allowed.includes(role);
}

/**
 * Convenience helper for Server Components / pages:
 *   const session = await auth();
 * Wraps getServerSession so pages don't need to pass authOptions each time.
 */
export async function auth() {
  return getServerSession(authOptions);
}