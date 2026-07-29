import Link from "next/link";
import type { UserRole } from "@prisma/client";

import { LogoutButton } from "@/components/auth/logout-button";

type AppHeaderProps = {
  user: {
    name: string;
    email: string;
    role: UserRole;
    workspace: {
      name: string;
    };
  };
};

function roleLabel(role: UserRole): string {
  return role.charAt(0) + role.slice(1).toLowerCase();
}

export function AppHeader({ user }: AppHeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-4 sm:px-8">
        <div className="flex min-w-0 items-center gap-5">
          <Link
            href="/app/login"
            className="flex shrink-0 items-center gap-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-loop-900 font-black text-white">
              L
            </span>
            <span className="hidden font-extrabold tracking-[0.2em] text-loop-900 sm:inline">
              LOOP
            </span>
          </Link>

          <div className="hidden h-8 w-px bg-slate-200 sm:block" aria-hidden="true" />

          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">{user.workspace.name}</p>
            <p className="truncate text-xs text-slate-500">
              {user.name} · {roleLabel(user.role)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden max-w-56 truncate text-sm text-slate-500 lg:block">
            {user.email}
          </span>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}