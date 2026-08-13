"use client";

import { useState } from "react";

type ClassifyButtonProps = {
  feedbackId: string;
};

export function ClassifyButton({
  feedbackId,
}: ClassifyButtonProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleClassify() {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(
        `/api/feedback/${feedbackId}/classify`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Classification failed"
        );
      }

      setMessage("Classification completed successfully");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Classification failed"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClassify}
        disabled={loading}
        className="rounded-lg bg-loop-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? "Classifying..." : "Re-Classify"}
      </button>

      {message && (
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {message}
        </p>
      )}
    </div>
  );
}