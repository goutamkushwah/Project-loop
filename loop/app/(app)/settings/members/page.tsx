import React, { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
    Shield,
    Eye,
    PenSquare,
    MoreVertical,
    UserPlus,
    X,
    Check,
    Clock,
    Circle,
    ChevronDown,
    Lock,
    ToggleLeft,
    ToggleRight,
} from "lucide-react";

// ---------------------------------------------------------------------------
// LOOP — Workspace & Access
// Role-based member management screen (Admin / Analyst / Viewer).
//
// Permission gating matches the RBAC matrix exactly:
//   View workspace members   → Admin only
//   Invite members           → Admin only
//   Change roles             → Admin only
//   Activate/deactivate      → Admin only
//   Access workspace settings→ Admin only
// (Add/Update/View feedback, View/Generate reports are enforced in their
// own routes — inbox, dashboard, reports — not in this component.)
//
// Drop-in for app/(app)/settings/members/page.tsx. Wire the handlers below
// to your route handlers:
//   POST   /api/workspace/members            (invite)
//   PATCH  /api/workspace/members/:id         (role change)
//   PATCH  /api/workspace/members/:id/status  (activate / deactivate)
//   DELETE /api/workspace/members/:id         (remove)
// ---------------------------------------------------------------------------

type Role = "ADMIN" | "ANALYST" | "VIEWER";
type Status = "ACTIVE" | "PENDING" | "INACTIVE";

interface Member {
    id: string;
    name: string;
    email: string;
    role: Role;
    status: Status;
    joined: string;
    initials: string;
}

interface RoleMeta {
    label: string;
    icon: LucideIcon;
    ring: string;
    dot: string;
    desc: string;
}

const ROLE_META: Record<Role, RoleMeta> = {
    ADMIN: {
        label: "Admin",
        icon: Shield,
        ring: "conic-gradient(var(--loop-teal) 0deg 360deg)",
        dot: "var(--loop-teal)",
        desc: "Full access — members, roles, and workspace settings.",
    },
    ANALYST: {
        label: "Analyst",
        icon: PenSquare,
        ring: "conic-gradient(var(--loop-teal) 0deg 240deg, var(--line) 240deg 360deg)",
        dot: "var(--loop-amber)",
        desc: "Adds & updates feedback, generates reports.",
    },
    VIEWER: {
        label: "Viewer",
        icon: Eye,
        ring: "conic-gradient(var(--loop-teal) 0deg 90deg, var(--line) 90deg 360deg)",
        dot: "var(--muted)",
        desc: "Read-only — dashboard, feedback, and reports.",
    },
};

const SEED_MEMBERS: Member[] = [
    { id: "u1", name: "Mohan Sahu", email: "mohan@northwind.io", role: "ADMIN", status: "ACTIVE", joined: "July 2026", initials: "MS" },
    { id: "u2", name: "Gaurav Athode", email: "gaurav@northwind.io", role: "ANALYST", status: "ACTIVE", joined: "July 2026", initials: "GA" },
    { id: "u3", name: "Gautam Kushwah", email: "gautam@northwind.io", role: "VIEWER", status: "ACTIVE", joined: "July 2026", initials: "GK" },
    { id: "u4", name: "Sneha S", email: "sneha@northwind.io", role: "VIEWER", status: "PENDING", joined: "Invited 2d ago", initials: "SS" },
];

const CURRENT_USER_ROLE: Role = "ADMIN"; // swap for session.user.role

function RoleRing({ role, initials }: { role: Role; initials: string }) {
    const meta = ROLE_META[role];
    return (
        <div className="relative h-10 w-10 shrink-0 rounded-full p-[2px]" style={{ background: meta.ring }}>
            <div
                className="flex h-full w-full items-center justify-center rounded-full text-[11px] font-semibold tracking-wide"
                style={{ background: "var(--panel)", color: "var(--ink-soft)" }}
            >
                {initials}
            </div>
        </div>
    );
}

function RoleMenu({
    value,
    onChange,
    disabled,
}: {
    value: Role;
    onChange: (role: Role) => void;
    disabled: boolean;
}) {
    const [open, setOpen] = useState(false);
    const meta = ROLE_META[value];
    const Icon = meta.icon;
    return (
        <div className="relative">
            <button
                disabled={disabled}
                onClick={() => setOpen((o) => !o)}
                className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                style={{ borderColor: "var(--line)", color: "var(--ink-soft)", background: "var(--panel-raised)" }}
            >
                <Icon size={12} style={{ color: meta.dot }} />
                {meta.label}
                {!disabled && <ChevronDown size={12} className="opacity-60" />}
            </button>
            {open && !disabled && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                    <div
                        className="absolute right-0 z-20 mt-1.5 w-56 overflow-hidden rounded-xl border py-1 shadow-2xl"
                        style={{ borderColor: "var(--line)", background: "var(--panel-raised)" }}
                    >
                        {(Object.entries(ROLE_META) as [Role, RoleMeta][]).map(([key, m]) => {
                            const MIcon = m.icon;
                            return (
                                <button
                                    key={key}
                                    onClick={() => {
                                        onChange(key);
                                        setOpen(false);
                                    }}
                                    className="flex w-full items-start gap-2.5 px-3 py-2 text-left transition-colors hover:bg-white/5"
                                >
                                    <MIcon size={14} className="mt-0.5" style={{ color: m.dot }} />
                                    <span>
                                        <span className="block text-[13px] font-medium" style={{ color: "var(--ink)" }}>
                                            {m.label} {key === value && <Check size={11} className="ml-1 inline" />}
                                        </span>
                                        <span className="block text-[11px] leading-snug" style={{ color: "var(--muted)" }}>
                                            {m.desc}
                                        </span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}

function StatusPill({ status }: { status: Status }) {
    if (status === "PENDING") {
        return (
            <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-wider"
                style={{ background: "rgba(245,166,35,0.12)", color: "var(--loop-amber)" }}
            >
                <Clock size={10} /> Pending
            </span>
        );
    }
    if (status === "INACTIVE") {
        return (
            <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-wider"
                style={{ background: "rgba(118,124,140,0.15)", color: "var(--muted)" }}
            >
                <Circle size={7} fill="currentColor" stroke="none" /> Inactive
            </span>
        );
    }
    return (
        <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-wider"
            style={{ background: "rgba(0,217,181,0.1)", color: "var(--loop-teal)" }}
        >
            <Circle size={7} fill="currentColor" stroke="none" /> Active
        </span>
    );
}

export default function WorkspaceMembers() {
    const [members, setMembers] = useState<Member[]>(SEED_MEMBERS);
    const [inviteOpen, setInviteOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState<Role>("VIEWER");
    const [toast, setToast] = useState<string | null>(null);
    const [menuFor, setMenuFor] = useState<string | null>(null);

    const isAdmin = CURRENT_USER_ROLE === "ADMIN";

    const counts = useMemo(() => {
        const c: Record<Role, number> = { ADMIN: 0, ANALYST: 0, VIEWER: 0 };
        members.forEach((m) => c[m.role]++);
        return c;
    }, [members]);

    function pushToast(msg: string) {
        setToast(msg);
        setTimeout(() => setToast(null), 2400);
    }

    // Wire to: PATCH /api/workspace/members/:id  { role }
    function handleRoleChange(id: string, role: Role) {
        const target = members.find((m) => m.id === id);
        if (!target) return;
        if (target.role === "ADMIN" && role !== "ADMIN" && counts.ADMIN <= 1) {
            pushToast("Workspace needs at least one Admin.");
            return;
        }
        setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role } : m)));
        pushToast(`${target.name} is now ${ROLE_META[role].label}.`);
    }

    // Wire to: PATCH /api/workspace/members/:id/status  { status }
    function handleToggleStatus(id: string) {
        const target = members.find((m) => m.id === id);
        if (!target) return;
        if (target.status === "PENDING") return;
        const next: Status = target.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
        if (target.role === "ADMIN" && next === "INACTIVE" && counts.ADMIN <= 1) {
            pushToast("Workspace needs at least one active Admin.");
            return;
        }
        setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, status: next } : m)));
        pushToast(`${target.name} is now ${next === "ACTIVE" ? "active" : "inactive"}.`);
    }

    // Wire to: DELETE /api/workspace/members/:id
    function handleRemove(id: string) {
        const target = members.find((m) => m.id === id);
        if (!target) return;
        setMembers((prev) => prev.filter((m) => m.id !== id));
        pushToast(`Removed ${target.name} from the workspace.`);
    }

    // Wire to: POST /api/workspace/members  { email, role }
    function handleInvite(e: React.FormEvent) {
        e.preventDefault();
        if (!inviteEmail.trim()) return;
        const name = inviteEmail.split("@")[0].replace(/[._]/g, " ");
        const initials = name
            .split(" ")
            .map((s) => s[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
        setMembers((prev) => [
            {
                id: `u${Date.now()}`,
                name: name.replace(/\b\w/g, (c) => c.toUpperCase()),
                email: inviteEmail,
                role: inviteRole,
                status: "PENDING",
                joined: "Invited just now",
                initials,
            },
            ...prev,
        ]);
        pushToast(`Invite sent to ${inviteEmail}.`);
        setInviteEmail("");
        setInviteRole("VIEWER");
        setInviteOpen(false);
    }

    const wrapperStyle: React.CSSProperties & Record<string, string> = {
        background: "var(--bg)",
        color: "var(--ink)",
        fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
        "--bg": "#0E1016",
        "--panel": "#151822",
        "--panel-raised": "#1B1F2B",
        "--line": "rgba(255,255,255,0.08)",
        "--ink": "#EDEEF2",
        "--ink-soft": "#C7CAD6",
        "--muted": "#767C8C",
        "--loop-teal": "#00D9B5",
        "--loop-amber": "#F5A623",
    };

    // RBAC matrix: "View workspace members" is Admin-only. Non-admins never see the roster.
    if (!isAdmin) {
        return (
            <div className="flex min-h-[420px] w-full items-center justify-center rounded-2xl p-8" style={wrapperStyle}>
                <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@400;500;600&display=swap');`}</style>
                <div className="max-w-sm text-center">
                    <div
                        className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
                        style={{ background: "var(--panel-raised)" }}
                    >
                        <Lock size={20} style={{ color: "var(--muted)" }} />
                    </div>
                    <h2 className="mb-1.5 text-[16px] font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                        Admins only
                    </h2>
                    <p className="text-[13px] leading-relaxed" style={{ color: "var(--muted)" }}>
                        Workspace members and roles are only visible to Admins. You're signed in as{" "}
                        {ROLE_META[CURRENT_USER_ROLE].label} — ask an Admin if you need a role change.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[600px] w-full rounded-2xl p-6 sm:p-8" style={wrapperStyle}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500&display=swap');
        .loop-display { font-family: 'Space Grotesk', ui-sans-serif, sans-serif; }
        .loop-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
        .row-anim { animation: rowIn .28s ease both; }
        @keyframes rowIn { from { opacity:0; transform: translateY(4px);} to { opacity:1; transform: translateY(0);} }
      `}</style>

            {/* Header */}
            <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <div className="mb-1.5 flex items-center gap-2">
                        <span
                            className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold loop-display"
                            style={{ background: "var(--loop-teal)", color: "#04150F" }}
                        >
                            L
                        </span>
                        <span className="text-[11px] font-medium uppercase tracking-[0.14em]" style={{ color: "var(--muted)" }}>
                            Northwind Retail · Workspace
                        </span>
                    </div>
                    <h1 className="loop-display text-[22px] font-semibold sm:text-[26px]">Members &amp; access</h1>
                    <p className="mt-1 max-w-md text-[13px] leading-relaxed" style={{ color: "var(--muted)" }}>
                        Every action here is enforced server-side by role — not just hidden in the UI.
                    </p>
                </div>

                <button
                    onClick={() => setInviteOpen(true)}
                    className="loop-display flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[13px] font-semibold transition-transform hover:-translate-y-0.5 active:translate-y-0"
                    style={{ background: "var(--loop-teal)", color: "#04150F" }}
                >
                    <UserPlus size={15} /> Invite member
                </button>
            </div>

            {/* Role legend / counts */}
            <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {(Object.entries(ROLE_META) as [Role, RoleMeta][]).map(([key, m]) => {
                    const Icon = m.icon;
                    return (
                        <div
                            key={key}
                            className="flex items-start gap-3 rounded-xl border p-3.5"
                            style={{ borderColor: "var(--line)", background: "var(--panel)" }}
                        >
                            <div
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                                style={{ background: "var(--panel-raised)" }}
                            >
                                <Icon size={14} style={{ color: m.dot }} />
                            </div>
                            <div>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="loop-display text-[15px] font-semibold">{counts[key]}</span>
                                    <span className="text-[12.5px] font-medium" style={{ color: "var(--ink-soft)" }}>
                                        {m.label}
                                        {counts[key] === 1 ? "" : "s"}
                                    </span>
                                </div>
                                <p className="mt-0.5 text-[11.5px] leading-snug" style={{ color: "var(--muted)" }}>
                                    {m.desc}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Members table */}
            <div className="overflow-hidden rounded-xl border" style={{ borderColor: "var(--line)", background: "var(--panel)" }}>
                <div
                    className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 border-b px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wider"
                    style={{ borderColor: "var(--line)", color: "var(--muted)" }}
                >
                    <span>Member</span>
                    <span className="hidden sm:block">Joined</span>
                    <span>Role</span>
                    <span className="hidden sm:block">Active</span>
                    <span className="w-6" />
                </div>

                {members.map((m) => (
                    <div
                        key={m.id}
                        className="row-anim grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 border-b px-4 py-3 last:border-b-0"
                        style={{ borderColor: "var(--line)" }}
                    >
                        <div className="flex min-w-0 items-center gap-3">
                            <RoleRing role={m.role} initials={m.initials} />
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="truncate text-[13.5px] font-medium">{m.name}</span>
                                    <StatusPill status={m.status} />
                                </div>
                                <span className="loop-mono truncate text-[11.5px]" style={{ color: "var(--muted)" }}>
                                    {m.email}
                                </span>
                            </div>
                        </div>

                        <span className="hidden text-[12px] sm:block" style={{ color: "var(--muted)" }}>
                            {m.joined}
                        </span>

                        <RoleMenu value={m.role} disabled={false} onChange={(role) => handleRoleChange(m.id, role)} />

                        <button
                            onClick={() => handleToggleStatus(m.id)}
                            disabled={m.status === "PENDING"}
                            className="hidden items-center justify-center sm:flex disabled:cursor-not-allowed disabled:opacity-40"
                            title={m.status === "PENDING" ? "Pending invite" : m.status === "ACTIVE" ? "Deactivate" : "Activate"}
                        >
                            {m.status === "ACTIVE" ? (
                                <ToggleRight size={22} style={{ color: "var(--loop-teal)" }} />
                            ) : (
                                <ToggleLeft size={22} style={{ color: "var(--muted)" }} />
                            )}
                        </button>

                        <div className="relative flex justify-end">
                            <button
                                onClick={() => setMenuFor(menuFor === m.id ? null : m.id)}
                                className="rounded-full p-1.5 transition-colors hover:bg-white/5"
                                style={{ color: "var(--muted)" }}
                            >
                                <MoreVertical size={15} />
                            </button>
                            {menuFor === m.id && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setMenuFor(null)} />
                                    <div
                                        className="absolute right-0 top-8 z-20 w-44 overflow-hidden rounded-lg border py-1 shadow-2xl"
                                        style={{ borderColor: "var(--line)", background: "var(--panel-raised)" }}
                                    >
                                        <button
                                            onClick={() => {
                                                handleToggleStatus(m.id);
                                                setMenuFor(null);
                                            }}
                                            disabled={m.status === "PENDING"}
                                            className="w-full px-3 py-1.5 text-left text-[12.5px] font-medium transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40 sm:hidden"
                                            style={{ color: "var(--ink-soft)" }}
                                        >
                                            {m.status === "ACTIVE" ? "Deactivate" : "Activate"}
                                        </button>
                                        <button
                                            onClick={() => {
                                                handleRemove(m.id);
                                                setMenuFor(null);
                                            }}
                                            className="w-full px-3 py-1.5 text-left text-[12.5px] font-medium transition-colors hover:bg-white/5"
                                            style={{ color: "#F16A6A" }}
                                        >
                                            Remove access
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Invite modal */}
            {inviteOpen && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4" onClick={() => setInviteOpen(false)}>
                    <form
                        onClick={(e) => e.stopPropagation()}
                        onSubmit={handleInvite}
                        className="w-full max-w-sm rounded-2xl border p-5"
                        style={{ borderColor: "var(--line)", background: "var(--panel-raised)" }}
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="loop-display text-[16px] font-semibold">Invite to workspace</h2>
                            <button type="button" onClick={() => setInviteOpen(false)} style={{ color: "var(--muted)" }}>
                                <X size={16} />
                            </button>
                        </div>

                        <label className="mb-1 block text-[11.5px] font-medium" style={{ color: "var(--ink-soft)" }}>
                            Email address
                        </label>
                        <input
                            autoFocus
                            type="email"
                            required
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="teammate@company.com"
                            className="mb-4 w-full rounded-lg border px-3 py-2 text-[13px] outline-none"
                            style={{ borderColor: "var(--line)", background: "var(--panel)", color: "var(--ink)" }}
                        />

                        <label className="mb-1.5 block text-[11.5px] font-medium" style={{ color: "var(--ink-soft)" }}>
                            Role
                        </label>
                        <div className="mb-5 grid grid-cols-3 gap-2">
                            {(Object.entries(ROLE_META) as [Role, RoleMeta][]).map(([key, m]) => {
                                const Icon = m.icon;
                                const active = inviteRole === key;
                                return (
                                    <button
                                        type="button"
                                        key={key}
                                        onClick={() => setInviteRole(key)}
                                        className="flex flex-col items-center gap-1 rounded-lg border py-2.5 text-[11px] font-medium transition-colors"
                                        style={{
                                            borderColor: active ? "var(--loop-teal)" : "var(--line)",
                                            background: active ? "rgba(0,217,181,0.08)" : "var(--panel)",
                                            color: active ? "var(--loop-teal)" : "var(--ink-soft)",
                                        }}
                                    >
                                        <Icon size={14} />
                                        {m.label}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            type="submit"
                            className="loop-display w-full rounded-full py-2.5 text-[13px] font-semibold"
                            style={{ background: "var(--loop-teal)", color: "#04150F" }}
                        >
                            Send invite
                        </button>
                    </form>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div
                    className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border px-4 py-2 text-[12.5px] font-medium shadow-xl"
                    style={{ borderColor: "var(--line)", background: "var(--panel-raised)", color: "var(--ink)" }}
                >
                    {toast}
                </div>
            )}
        </div>
    );
}