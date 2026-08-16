"use client";

import { useState } from "react";

import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api";
import type { ReportSharingState } from "@/types/report";

type ReportShareControlProps = {
  reportId: string;
  initialSharing: ReportSharingState;
};

type ShareCreatedResponse = {
  share: {
    reportId: string;
    shareUrl: string;
    createdAt: string;
  };
};

type ShareRevokedResponse = {
  share: {
    reportId: string;
    enabled: false;
    createdAt: null;
  };
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(new Date(value));
}

export function ReportShareControl({
  reportId,
  initialSharing,
}: ReportShareControlProps) {
  const [sharing, setSharing] = useState(initialSharing);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function createOrRotateShare() {
    setIsCreating(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/reports/${reportId}/share`, {
        method: "POST",
      });
      const result = (await response.json()) as
        | ApiSuccessResponse<ShareCreatedResponse>
        | ApiErrorResponse;

      if (!response.ok || !result.success) {
        setError(!result.success ? result.error.message : "The share link could not be created.");
        return;
      }

      setShareUrl(result.data.share.shareUrl);
      setSharing({
        enabled: true,
        createdAt: result.data.share.createdAt,
      });
      setMessage(
        sharing.enabled
          ? "A new share link was created and the previous link was invalidated."
          : "A read-only share link was created.",
      );
    } catch {
      setError("The share link could not be created. Please try again.");
    } finally {
      setIsCreating(false);
    }
  }

  async function revokeShare() {
    setIsRevoking(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/reports/${reportId}/share`, {
        method: "DELETE",
      });
      const result = (await response.json()) as
        | ApiSuccessResponse<ShareRevokedResponse>
        | ApiErrorResponse;

      if (!response.ok || !result.success) {
        setError(!result.success ? result.error.message : "The share link could not be revoked.");
        return;
      }

      setSharing({ enabled: false, createdAt: null });
      setShareUrl(null);
      setMessage("Public access to this report was revoked.");
    } catch {
      setError("The share link could not be revoked. Please try again.");
    } finally {
      setIsRevoking(false);
    }
  }

  async function copyShareUrl() {
    if (!shareUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setMessage("Share link copied to the clipboard.");
      setError(null);
    } catch {
      setError("Clipboard access was unavailable. Copy the link from the field below.");
    }
  }

  const isBusy = isCreating || isRevoking;

  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      aria-label="Report sharing"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-black text-slate-900">Shareable report</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {sharing.enabled
              ? `Public read-only access is active${sharing.createdAt ? ` since ${formatDate(sharing.createdAt)}` : ""}.`
              : "No public share link is active."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={createOrRotateShare}
            disabled={isBusy}
            className="rounded-xl bg-loop-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-loop-800 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCreating
              ? "Creating…"
              : sharing.enabled
                ? "Rotate share link"
                : "Create share link"}
          </button>

          {sharing.enabled ? (
            <button
              type="button"
              onClick={revokeShare}
              disabled={isBusy}
              className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isRevoking ? "Revoking…" : "Revoke"}
            </button>
          ) : null}
        </div>
      </div>

      {sharing.enabled && !shareUrl ? (
        <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
          For security, LOOP stores only a hash of the share token. Rotate the link to receive a new URL;
          doing so immediately invalidates the previous URL.
        </p>
      ) : null}

      {shareUrl ? (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
          <label htmlFor="report-share-url" className="text-xs font-bold text-emerald-900">
            New share URL
          </label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              id="report-share-url"
              type="text"
              value={shareUrl}
              readOnly
              onFocus={(event) => event.currentTarget.select()}
              className="min-w-0 flex-1 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <button
              type="button"
              onClick={copyShareUrl}
              className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              Copy link
            </button>
          </div>
          <p className="mt-2 text-xs leading-5 text-emerald-900">
            This raw token is shown only in this browser state. Store or send the URL now if you need it.
          </p>
        </div>
      ) : null}

      {message ? (
        <p className="mt-3 text-xs font-semibold text-emerald-700" aria-live="polite">
          {message}
        </p>
      ) : null}

      {error ? (
        <p className="mt-3 text-xs font-semibold text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}