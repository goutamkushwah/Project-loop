import type { UserRole } from "@prisma/client";
import Link from "next/link";

import { LogoutButton } from "@/components/auth/logout-button";
import ThemeToggle from "@/components/theme/theme-toggle";
import { hasPermission, PERMISSIONS } from "@/lib/rbac";

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
  const canReadFeedback = hasPermission(user.role, PERMISSIONS.FEEDBACK_READ);
  const canManageMembers = hasPermission(user.role, PERMISSIONS.MEMBERS_READ);

  return (
    <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center justify-between gap-5 lg:justify-start">
          <div className="flex min-w-0 items-center gap-5">
            <Link
              href="/dashboard"
              className="flex shrink-0 items-center gap-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-loop-900 font-black text-white">
                L
              </span>
              <span className="hidden font-extrabold tracking-[0.2em] text-loop-900 dark:text-white sm:inline">
                LOOP
              </span>
            </Link>

            <div className="hidden h-8 w-px bg-slate-200 dark:bg-slate-700 sm:block" aria-hidden="true" />

            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{user.workspace.name}</p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {user.name} · {roleLabel(user.role)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>

        <div className="flex min-w-0 items-center justify-between gap-4">
          <nav className="flex flex-wrap items-center gap-1" aria-label="Workspace navigation">
            <Link
              href="/dashboard"
              className="rounded-lg px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-loop-50 hover:text-loop-900 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              Dashboard
            </Link>
            {canReadFeedback ? (
              <Link
                href="/inbox"
                className="rounded-lg px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-loop-50 hover:text-loop-900 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                Inbox
              </Link>
            ) : null}
            {canManageMembers ? (
              <Link
                href="/settings/members"
                className="rounded-lg px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-loop-50 hover:text-loop-900 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                Members
              </Link>
            ) : null}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <span className="hidden max-w-56 truncate text-sm text-slate-500 dark:text-slate-400 xl:block">
              {user.email}
            </span>
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
      </div>
    </header>
  );
}