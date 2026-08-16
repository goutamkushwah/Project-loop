"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

export function LogoutButton() {
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);

    try {
      await signOut({
        callbackUrl: "/",
      });
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isSigningOut}
      className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-loop-300 hover:bg-loop-50 hover:text-loop-900 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isSigningOut ? "Signing out…" : "Sign out"}
    </button>
  );
}