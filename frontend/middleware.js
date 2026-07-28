import { withAuth } from "next-auth/middleware";

// Any route matched here requires a logged-in session.
// Unauthenticated users get redirected to /login automatically.
// The secret must be passed explicitly here — middleware runs in a
// separate (Edge) runtime and doesn't automatically inherit it from
// authOptions the way API routes do.
export default withAuth({
  secret: process.env.NEXTAUTH_SECRET,
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
