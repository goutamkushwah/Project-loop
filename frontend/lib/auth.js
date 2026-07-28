import CredentialsProvider from "next-auth/providers/credentials";
import { findUserByEmail, verifyPassword } from "./users";

export const authOptions = {
  // JWT sessions — no database needed to store sessions themselves.
  session: { strategy: "jwt" },

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Enter your email and password.");
        }

        const user = await findUserByEmail(credentials.email);
        if (!user) {
          throw new Error("No account found with this email.");
        }

        const valid = await verifyPassword(user, credentials.password);
        if (!valid) {
          throw new Error("Incorrect password.");
        }

        // Whatever is returned here ends up in the JWT (see callbacks below).
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          workspace: user.workspace,
        };
      },
    }),
  ],

  callbacks: {
    // Runs whenever a JWT is created/updated. Persist extra fields here.
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.workspace = user.workspace;
      }
      return token;
    },
    // Runs whenever a session is checked. Expose the extra fields to the client.
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.workspace = token.workspace;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
};
