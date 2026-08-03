import { withAuth } from "next-auth/middleware";

// Blanket-protects everything under (app) route group (dashboard, inbox,
// trends, ask, reports, settings). Login/signup pages stay outside the
// matcher below so they remain reachable. Fine-grained role checks (who
// can POST vs just GET) still happen per-route in lib/auth.ts —
// middleware only handles "are you logged in at all".
export default withAuth({
    pages: {
        signIn: "/login",
    },
});

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/inbox/:path*",
        "/trends/:path*",
        "/ask/:path*",
        "/reports/:path*",
        "/settings/:path*",
        "/api/feedback/:path*",
        "/api/themes/:path*",
        "/api/insights/:path*",
        "/api/reports/:path*",
    ],
};