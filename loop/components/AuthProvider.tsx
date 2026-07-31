"use client";

import { SessionProvider } from "next-auth/react";

// Wrap your root layout's children with this so any client component
// can call useSession(). Put it in app/layout.tsx:
//
//   <AuthProvider>{children}</AuthProvider>
export default function AuthProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    return <SessionProvider>{children}</SessionProvider>;
}