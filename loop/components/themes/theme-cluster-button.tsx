"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api";
import type { ThemeClusterSummary } from "@/types/theme";

type ThemeClusterButtonProps = {
  canCluster: boolean;
};

type ThemeClusterResponse = {
  summary: ThemeClusterSummary;
};

export function ThemeClusterButton({ canCluster }: ThemeClusterButtonProps) {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!canCluster) {
    return (
      <p className="text-sm text-slate-500">
        Your role can explore theme clusters but cannot run clustering.
      </p>
    );
  }

  async function handleCluster() {
    setIsRunning(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/themes/cluster", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ limit: 100 }),
      });
      const result = (await response.json()) as
        | ApiSuccessResponse<ThemeClusterResponse>
        | ApiErrorResponse;

      if (!response.ok || !result.success) {
        setError(!result.success ? result.error.message : "Theme clustering failed.");
        return;
      }

      const { summary } = result.data;

      if (summary.candidateRows === 0) {
        setMessage("All feedback is already assigned to at least one theme.");
      } else {
        setMessage(
          `${summary.completedRows.toLocaleString()} feedback item${
            summary.completedRows === 1 ? " was" : "s were"
          } clustered. ${summary.remainingUnassignedRows.toLocaleString()} unassigned item${
            summary.remainingUnassignedRows === 1 ? " remains" : "s remain"
          } across ${summary.themeCount.toLocaleString()} themes.`,
        );
      }

      router.refresh();
    } catch {
      setError("Theme clustering is temporarily unavailable. Please try again.");
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleCluster}
        disabled={isRunning}
        className="inline-flex items-center justify-center rounded-xl bg-loop-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-loop-800 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isRunning ? "Clustering feedback…" : "Cluster unassigned feedback"}
      </button>

      {message ? (
        <p className="mt-3 text-sm font-medium text-emerald-700" role="status" aria-live="polite">
          {message}
        </p>
      ) : null}

      {error ? (
        <p className="mt-3 text-sm font-medium text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}