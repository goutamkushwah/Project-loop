"use client";

import { SessionProvider } from "next-auth/react";

// Wrap your root layout's children with this so useSession() works
// anywhere in the app (Server Components stay outside this boundary).
export default function Providers({ children }: { children: React.ReactNode }) {
    return <SessionProvider>{children}</SessionProvider>;
}