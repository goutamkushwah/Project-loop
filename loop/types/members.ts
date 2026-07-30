import type { UserRole } from "@prisma/client";

export type WorkspaceMember = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  isCurrentUser: boolean;
};

export type WorkspaceMemberPage = {
  items: WorkspaceMember[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
};

export type WorkspaceInvitation = {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
  expiresAt: string;
  invitedBy: {
    name: string;
    email: string;
  } | null;
};

export type WorkspaceInvitationList = {
  items: WorkspaceInvitation[];
};

type InvitationDetails = {
  email: string;
  role: UserRole;
  workspaceName: string;
  expiresAt: string;
};

export type InvitationSummary =
  | {
      state: "NOT_FOUND";
    }
  | ({
      state: "ACTIVE" | "EXPIRED" | "REVOKED" | "ACCEPTED";
    } & InvitationDetails);