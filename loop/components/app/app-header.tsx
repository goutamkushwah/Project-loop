import type { UserRole } from "@prisma/client";
import Link from "next/link";

import { WorkspaceNavigation, type WorkspaceNavigationItem } from "@/components/app/workspace-navigation";
import { LogoutButton } from "@/components/auth/logout-button";
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
  const canReadThemes = hasPermission(user.role, PERMISSIONS.THEMES_READ);
  const canAskLoop = hasPermission(user.role, PERMISSIONS.ASK_LOOP_QUERY);
  const canReadReports = hasPermission(user.role, PERMISSIONS.REPORTS_READ);
  const canManageMembers = hasPermission(user.role, PERMISSIONS.MEMBERS_READ);

  const navigationItems: WorkspaceNavigationItem[] = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/dashboard", label: "Dashboard" },
    ...(canReadFeedback ? [{ href: "/inbox", label: "Inbox" }] : []),
    ...(canReadThemes ? [{ href: "/themes", label: "Themes" }] : []),
    ...(canReadThemes ? [{ href: "/trends", label: "Trends" }] : []),
    ...(canAskLoop ? [{ href: "/ask", label: "Ask LOOP" }] : []),
    ...(canReadReports ? [{ href: "/reports", label: "Reports" }] : []),
    ...(canManageMembers ? [{ href: "/settings/members", label: "Members" }] : []),
  ];

  return (
    <header className="relative z-30 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:px-8 lg:py-4">
        <div className="flex min-w-0 items-center gap-4 sm:gap-5">
          <Link
            href="/dashboard"
            aria-label="LOOP dashboard"
            className="flex min-h-11 shrink-0 items-center gap-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2"
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

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <WorkspaceNavigation items={navigationItems} />
          <span className="hidden max-w-48 truncate text-sm text-slate-500 xl:block">
            {user.email}
          </span>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}