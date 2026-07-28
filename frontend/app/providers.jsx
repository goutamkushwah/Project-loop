"use client";

import { SessionProvider } from "next-auth/react";

// Wraps the whole app so any component can call useSession()/signIn()/signOut().
export function Providers({ children }) {
  return <SessionProvider>{children}</SessionProvider>;
}
