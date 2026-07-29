import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    authorized: ({ token }) =>
      Boolean(token?.userId && token.workspaceId && token.role && token.workspaceName),
  },
});

export const config = {
  matcher: [
    "/app/login/:path*",
    "/inbox/:path*",
    "/trends/:path*",
    "/ask/:path*",
    "/reports/:path*",
    "/settings/:path*",
  ],
};