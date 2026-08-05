import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized: ({ token }) =>
      Boolean(token?.userId && token.workspaceId && token.role && token.workspaceName),
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/inbox/:path*",
    "/ai/:path*",
    "/trends/:path*",
    "/ask/:path*",
    "/reports/:path*",
    "/settings/:path*",
  ],
};