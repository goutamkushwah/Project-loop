import type { ReactNode } from "react";

import { AppHeader } from "@/components/app/app-header";
import { requireCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ProtectedAppLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const user = await requireCurrentUser();

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader user={user} />
      <div id="main-content" tabIndex={-1} className="outline-none">
        {children}
      </div>
    </div>
  );
}