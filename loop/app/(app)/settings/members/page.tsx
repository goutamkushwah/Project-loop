import type { Metadata } from "next";

import { MemberManagement } from "@/components/members/member-management";
import { requirePagePermission } from "@/lib/authorization";
import { memberListQuerySchema } from "@/lib/member-validation";
import { PERMISSIONS } from "@/lib/rbac";
import {
  listWorkspaceInvitations,
  listWorkspaceMembers,
} from "@/services/member-service";

export const metadata: Metadata = {
  title: "Workspace members",
  description: "Manage LOOP workspace members, roles, status, and invitations.",
};

export const dynamic = "force-dynamic";

export default async function WorkspaceMembersPage() {
  const user = await requirePagePermission(PERMISSIONS.MEMBERS_READ);
  const initialQuery = memberListQuerySchema.parse({});
  const [members, invitations] = await Promise.all([
    listWorkspaceMembers(user.workspaceId, user.id, initialQuery),
    listWorkspaceInvitations(user.workspaceId),
  ]);

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="border-b border-slate-200 pb-8">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-loop-600">
          Workspace administration
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-loop-900">
          Members and roles
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          Manage access to {user.workspace.name}. Every member query and mutation is scoped to the
          authenticated workspace, and the API independently enforces administrator permissions.
        </p>
      </div>

      <div className="mt-8">
        <MemberManagement
          workspaceName={user.workspace.name}
          initialMembers={members}
          initialInvitations={invitations}
        />
      </div>
    </main>
  );
}