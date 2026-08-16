"use client";

import type { UserRole } from "@prisma/client";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api";
import type {
  WorkspaceInvitation,
  WorkspaceInvitationList,
  WorkspaceMember,
  WorkspaceMemberPage,
} from "@/types/members";

const ROLE_OPTIONS = ["ADMIN", "ANALYST", "VIEWER"] as const;
const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

type SortBy = "name" | "email" | "role" | "createdAt" | "lastLoginAt";
type SortOrder = "asc" | "desc";
type StatusFilter = "" | "ACTIVE" | "INACTIVE";
type RoleFilter = "" | UserRole;

type MemberManagementProps = {
  workspaceName: string;
  initialMembers: WorkspaceMemberPage;
  initialInvitations: WorkspaceInvitationList;
};

type MemberUpdateResponse = {
  member: WorkspaceMember;
};

type InvitationCreateResponse = {
  invitation: WorkspaceInvitation;
  invitationUrl: string;
};

function formatDate(value: string | null): string {
  return value ? DATE_FORMATTER.format(new Date(value)) : "Never";
}

function roleDescription(role: UserRole): string {
  switch (role) {
    case "ADMIN":
      return "Full workspace access";
    case "ANALYST":
      return "Manage feedback and reports";
    case "VIEWER":
      return "Read-only access";
  }
}

export function MemberManagement({
  workspaceName,
  initialMembers,
  initialInvitations,
}: MemberManagementProps) {
  const [members, setMembers] = useState(initialMembers);
  const [invitations, setInvitations] = useState(initialInvitations.items);
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [sortBy, setSortBy] = useState<SortBy>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [page, setPage] = useState(1);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [pendingMemberId, setPendingMemberId] = useState<string | null>(null);
  const [pendingInvitationId, setPendingInvitationId] = useState<string | null>(null);
  const [isInviting, setIsInviting] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [latestInvitationUrl, setLatestInvitationUrl] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const initialRender = useRef(true);

  const loadMembers = useCallback(async () => {
    setIsLoadingMembers(true);
    setPageError(null);

    const parameters = new URLSearchParams({
      page: String(page),
      pageSize: String(members.pagination.pageSize),
      sortBy,
      sortOrder,
    });

    if (appliedSearch) {
      parameters.set("search", appliedSearch);
    }

    if (roleFilter) {
      parameters.set("role", roleFilter);
    }

    if (statusFilter) {
      parameters.set("status", statusFilter);
    }

    try {
      const response = await fetch(`/api/members?${parameters.toString()}`, {
        method: "GET",
        cache: "no-store",
      });
      const result = (await response.json()) as
        | ApiSuccessResponse<WorkspaceMemberPage>
        | ApiErrorResponse;

      if (!response.ok || !result.success) {
        setPageError(
          !result.success ? result.error.message : "Workspace members could not be loaded.",
        );
        return;
      }

      setMembers(result.data);
    } catch {
      setPageError("Workspace members could not be loaded. Check your connection and try again.");
    } finally {
      setIsLoadingMembers(false);
    }
  }, [appliedSearch, members.pagination.pageSize, page, roleFilter, sortBy, sortOrder, statusFilter]);

  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }

    void loadMembers();
  }, [loadMembers]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setAppliedSearch(searchInput.trim());
  }

  async function updateMember(memberId: string, payload: { role?: UserRole; isActive?: boolean }) {
    setPendingMemberId(memberId);
    setPageError(null);

    try {
      const response = await fetch(`/api/members/${memberId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as
        | ApiSuccessResponse<MemberUpdateResponse>
        | ApiErrorResponse;

      if (!response.ok || !result.success) {
        setPageError(
          !result.success ? result.error.message : "The workspace member could not be updated.",
        );
        return;
      }

      setMembers((current) => ({
        ...current,
        items: current.items.map((member) =>
          member.id === result.data.member.id ? result.data.member : member,
        ),
      }));
    } catch {
      setPageError("The workspace member could not be updated. Please try again.");
    } finally {
      setPendingMemberId(null);
    }
  }

  async function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsInviting(true);
    setInviteError(null);
    setLatestInvitationUrl(null);
    setCopyStatus(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const role = String(formData.get("role") ?? "VIEWER") as UserRole;

    try {
      const response = await fetch("/api/members/invitations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, role }),
      });
      const result = (await response.json()) as
        | ApiSuccessResponse<InvitationCreateResponse>
        | ApiErrorResponse;

      if (!response.ok || !result.success) {
        setInviteError(
          !result.success ? result.error.message : "The invitation could not be created.",
        );
        return;
      }

      setInvitations((current) => [
        result.data.invitation,
        ...current.filter((invitation) => invitation.email !== result.data.invitation.email),
      ]);
      setLatestInvitationUrl(result.data.invitationUrl);
      form.reset();
    } catch {
      setInviteError("The invitation could not be created. Please try again.");
    } finally {
      setIsInviting(false);
    }
  }

  async function revokeInvitation(invitationId: string) {
    setPendingInvitationId(invitationId);
    setInviteError(null);

    try {
      const response = await fetch(`/api/members/invitations/${invitationId}`, {
        method: "DELETE",
      });
      const result = (await response.json()) as
        | ApiSuccessResponse<{ revoked: true }>
        | ApiErrorResponse;

      if (!response.ok || !result.success) {
        setInviteError(
          !result.success ? result.error.message : "The invitation could not be revoked.",
        );
        return;
      }

      setInvitations((current) =>
        current.filter((invitation) => invitation.id !== invitationId),
      );
    } catch {
      setInviteError("The invitation could not be revoked. Please try again.");
    } finally {
      setPendingInvitationId(null);
    }
  }

  async function copyInvitationLink() {
    if (!latestInvitationUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(latestInvitationUrl);
      setCopyStatus("Invitation link copied.");
    } catch {
      setCopyStatus("Copy failed. Select and copy the link manually.");
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-loop-600">
              Add a teammate
            </p>
            <h2 className="mt-3 text-2xl font-black text-loop-900">Create a secure invitation</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              LOOP generates a single-use link that expires after seven days. Share it directly with
              the intended teammate; no email delivery infrastructure is used.
            </p>

            <dl className="mt-6 space-y-3 text-sm">
              {ROLE_OPTIONS.map((role) => (
                <div key={role} className="rounded-xl bg-slate-50 px-4 py-3">
                  <dt className="font-bold text-slate-900">{role}</dt>
                  <dd className="mt-1 text-slate-600">{roleDescription(role)}</dd>
                </div>
              ))}
            </dl>
          </div>

          <form className="space-y-5" onSubmit={handleInvite} noValidate>
            {inviteError ? (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
              >
                {inviteError}
              </div>
            ) : null}

            <div>
              <label htmlFor="invite-email" className="block text-sm font-semibold text-slate-800">
                Work email
              </label>
              <input
                id="invite-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                disabled={isInviting}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-loop-500 focus:ring-4 focus:ring-loop-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                placeholder="teammate@company.com"
              />
            </div>

            <div>
              <label htmlFor="invite-role" className="block text-sm font-semibold text-slate-800">
                Workspace role
              </label>
              <select
                id="invite-role"
                name="role"
                defaultValue="VIEWER"
                disabled={isInviting}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-loop-500 focus:ring-4 focus:ring-loop-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={isInviting}
              className="inline-flex w-full items-center justify-center rounded-xl bg-loop-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-loop-800 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {isInviting ? "Creating invitation…" : "Create invitation"}
            </button>

            {latestInvitationUrl ? (
              <div
                role="status"
                className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4"
              >
                <p className="text-sm font-bold text-emerald-900">Invitation ready</p>
                <p className="mt-1 text-xs leading-5 text-emerald-800">
                  This raw link is shown only after creation. Store or share it now.
                </p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input
                    aria-label="Generated invitation link"
                    readOnly
                    value={latestInvitationUrl}
                    className="min-w-0 flex-1 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs text-slate-700"
                  />
                  <button
                    type="button"
                    onClick={copyInvitationLink}
                    className="rounded-lg bg-emerald-800 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
                  >
                    Copy link
                  </button>
                </div>
                {copyStatus ? <p className="mt-2 text-xs text-emerald-800">{copyStatus}</p> : null}
              </div>
            ) : null}
          </form>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-6 sm:p-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-loop-600">
                Workspace members
              </p>
              <h2 className="mt-2 text-2xl font-black text-loop-900">{workspaceName} team</h2>
              <p className="mt-2 text-sm text-slate-600">
                {members.pagination.totalItems} member
                {members.pagination.totalItems === 1 ? "" : "s"} match the active filters.
              </p>
            </div>

            <form className="flex w-full max-w-xl gap-2" onSubmit={handleSearch} role="search">
              <label htmlFor="member-search" className="sr-only">
                Search members
              </label>
              <input
                id="member-search"
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                maxLength={120}
                className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-loop-500 focus:ring-4 focus:ring-loop-100"
                placeholder="Search name or email"
              />
              <button
                type="submit"
                className="rounded-xl bg-loop-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-loop-800 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2"
              >
                Search
              </button>
            </form>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="member-role-filter" className="block text-xs font-bold text-slate-600">
                Role
              </label>
              <select
                id="member-role-filter"
                value={roleFilter}
                onChange={(event) => {
                  setPage(1);
                  setRoleFilter(event.target.value as RoleFilter);
                }}
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-loop-500 focus:ring-4 focus:ring-loop-100"
              >
                <option value="">All roles</option>
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="member-status-filter" className="block text-xs font-bold text-slate-600">
                Status
              </label>
              <select
                id="member-status-filter"
                value={statusFilter}
                onChange={(event) => {
                  setPage(1);
                  setStatusFilter(event.target.value as StatusFilter);
                }}
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-loop-500 focus:ring-4 focus:ring-loop-100"
              >
                <option value="">All statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            <div>
              <label htmlFor="member-sort" className="block text-xs font-bold text-slate-600">
                Sort by
              </label>
              <select
                id="member-sort"
                value={sortBy}
                onChange={(event) => {
                  setPage(1);
                  setSortBy(event.target.value as SortBy);
                }}
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-loop-500 focus:ring-4 focus:ring-loop-100"
              >
                <option value="createdAt">Date added</option>
                <option value="name">Name</option>
                <option value="email">Email</option>
                <option value="role">Role</option>
                <option value="lastLoginAt">Last login</option>
              </select>
            </div>

            <div>
              <label htmlFor="member-sort-order" className="block text-xs font-bold text-slate-600">
                Direction
              </label>
              <select
                id="member-sort-order"
                value={sortOrder}
                onChange={(event) => {
                  setPage(1);
                  setSortOrder(event.target.value as SortOrder);
                }}
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-loop-500 focus:ring-4 focus:ring-loop-100"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        </div>

        {pageError ? (
          <div role="alert" className="mx-6 mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 sm:mx-8">
            {pageError}
          </div>
        ) : null}

        <div className="relative overflow-x-auto">
          {isLoadingMembers ? (
            <div
              role="status"
              className="absolute inset-0 z-10 grid min-h-56 place-items-center bg-white/80 backdrop-blur-sm"
            >
              <p className="rounded-full bg-loop-50 px-4 py-2 text-sm font-bold text-loop-800">
                Loading members…
              </p>
            </div>
          ) : null}

          <table className="min-w-[900px] w-full border-collapse text-left">
            <caption className="sr-only">Workspace members, roles, account status, last login, and available administrative actions.</caption>
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="px-6 py-4 sm:px-8">Member</th>
                <th scope="col" className="px-4 py-4">Role</th>
                <th scope="col" className="px-4 py-4">Status</th>
                <th scope="col" className="px-4 py-4">Last login</th>
                <th scope="col" className="px-6 py-4 text-right sm:px-8">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {members.items.map((member) => {
                const isPending = pendingMemberId === member.id;

                return (
                  <tr key={member.id} className="align-middle">
                    <th scope="row" className="px-6 py-5 text-left font-normal sm:px-8">
                      <div className="flex items-center gap-3">
                        <span
                          aria-hidden="true"
                          className="grid size-10 shrink-0 place-items-center rounded-full bg-loop-100 text-sm font-black text-loop-800"
                        >
                          {member.name.slice(0, 1).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900">
                            {member.name}
                            {member.isCurrentUser ? (
                              <span className="ml-2 rounded-full bg-loop-100 px-2 py-0.5 text-[10px] font-bold text-loop-800">
                                YOU
                              </span>
                            ) : null}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">{member.email}</p>
                          <p className="mt-1 text-xs text-slate-400">
                            Added {formatDate(member.createdAt)}
                          </p>
                        </div>
                      </div>
                    </th>
                    <td className="px-4 py-5">
                      <label htmlFor={`role-${member.id}`} className="sr-only">
                        Role for {member.name}
                      </label>
                      <select
                        id={`role-${member.id}`}
                        value={member.role}
                        disabled={member.isCurrentUser || isPending}
                        onChange={(event) =>
                          void updateMember(member.id, {
                            role: event.target.value as UserRole,
                          })
                        }
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-loop-500 focus:ring-4 focus:ring-loop-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                      >
                        {ROLE_OPTIONS.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-5">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${
                          member.isActive
                            ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                            : "bg-slate-100 text-slate-600 ring-slate-200"
                        }`}
                      >
                        {member.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-5 text-sm text-slate-600">
                      {formatDate(member.lastLoginAt)}
                    </td>
                    <td className="px-6 py-5 text-right sm:px-8">
                      <button
                        type="button"
                        disabled={member.isCurrentUser || isPending}
                        onClick={() =>
                          void updateMember(member.id, {
                            isActive: !member.isActive,
                          })
                        }
                        className={`rounded-lg px-3 py-2 text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                          member.isActive
                            ? "border border-red-200 bg-white text-red-700 hover:bg-red-50 focus:ring-red-500"
                            : "bg-emerald-700 text-white hover:bg-emerald-800 focus:ring-emerald-500"
                        }`}
                      >
                        {isPending
                          ? "Saving…"
                          : member.isActive
                            ? "Deactivate"
                            : "Reactivate"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {members.items.length === 0 ? (
            <div className="grid min-h-56 place-items-center px-6 text-center">
              <div>
                <p className="font-bold text-slate-900">No members found</p>
                <p className="mt-2 text-sm text-slate-500">
                  Adjust the search or filters to see other workspace members.
                </p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="text-sm text-slate-500">
            Page {members.pagination.page} of {members.pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1 || isLoadingMembers}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= members.pagination.totalPages || isLoadingMembers}
              onClick={() =>
                setPage((current) => Math.min(members.pagination.totalPages, current + 1))
              }
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-loop-600">
              Pending invitations
            </p>
            <h2 className="mt-2 text-2xl font-black text-loop-900">Awaiting acceptance</h2>
          </div>
          <p className="text-sm text-slate-500">
            {invitations.length} active invitation{invitations.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="mt-6 space-y-3">
          {invitations.map((invitation) => (
            <article
              key={invitation.id}
              className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate font-bold text-slate-900">{invitation.email}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {invitation.role} · Expires {formatDate(invitation.expiresAt)}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Created by {invitation.invitedBy?.name ?? "Former member"} on {formatDate(invitation.createdAt)}
                </p>
              </div>
              <button
                type="button"
                disabled={pendingInvitationId === invitation.id}
                onClick={() => void revokeInvitation(invitation.id)}
                className="shrink-0 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pendingInvitationId === invitation.id ? "Revoking…" : "Revoke"}
              </button>
            </article>
          ))}

          {invitations.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 px-6 py-10 text-center">
              <p className="font-bold text-slate-900">No pending invitations</p>
              <p className="mt-2 text-sm text-slate-500">
                New single-use invitation links will appear here until accepted, revoked, or expired.
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}