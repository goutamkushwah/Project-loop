import type { UserRole } from "@prisma/client";

export const PERMISSIONS = {
  DASHBOARD_READ: "dashboard.read",
  FEEDBACK_READ: "feedback.read",
  FEEDBACK_CREATE: "feedback.create",
  FEEDBACK_UPDATE: "feedback.update",
  THEMES_READ: "themes.read",
  THEMES_CLUSTER: "themes.cluster",
  ASK_LOOP_QUERY: "ask.query",
  MEMBERS_READ: "members.read",
  MEMBERS_MANAGE: "members.manage",
  REPORTS_READ: "reports.read",
  REPORTS_CREATE: "reports.create",
  SETTINGS_READ: "settings.read",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const ROLE_PERMISSIONS: Record<UserRole, ReadonlySet<Permission>> = {
  ADMIN: new Set<Permission>([
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.FEEDBACK_READ,
    PERMISSIONS.FEEDBACK_CREATE,
    PERMISSIONS.FEEDBACK_UPDATE,
    PERMISSIONS.THEMES_READ,
    PERMISSIONS.THEMES_CLUSTER,
    PERMISSIONS.ASK_LOOP_QUERY,
    PERMISSIONS.MEMBERS_READ,
    PERMISSIONS.MEMBERS_MANAGE,
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.REPORTS_CREATE,
    PERMISSIONS.SETTINGS_READ,
  ]),
  ANALYST: new Set<Permission>([
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.FEEDBACK_READ,
    PERMISSIONS.FEEDBACK_CREATE,
    PERMISSIONS.FEEDBACK_UPDATE,
    PERMISSIONS.THEMES_READ,
    PERMISSIONS.THEMES_CLUSTER,
    PERMISSIONS.ASK_LOOP_QUERY,
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.REPORTS_CREATE,
  ]),
  VIEWER: new Set<Permission>([
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.FEEDBACK_READ,
    PERMISSIONS.THEMES_READ,
    PERMISSIONS.ASK_LOOP_QUERY,
    PERMISSIONS.REPORTS_READ,
  ]),
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].has(permission);
}

export function getRolePermissions(role: UserRole): readonly Permission[] {
  return Array.from(ROLE_PERMISSIONS[role]);
}

export function getRoleSummary(role: UserRole): string {
  switch (role) {
    case "ADMIN":
      return "Full workspace administration, member management, feedback operations, and reporting.";
    case "ANALYST":
      return "Can ingest, classify, triage, analyse, and report on workspace feedback.";
    case "VIEWER":
      return "Read-only access to feedback, dashboards, themes, and saved reports.";
  }
}