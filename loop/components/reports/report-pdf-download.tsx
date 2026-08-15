"use client";

import { useState } from "react";

type ReportPdfDownloadProps = {
  reportId: string;
};

export function ReportPdfDownload({
  reportId,
}: ReportPdfDownloadProps) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    try {
      setLoading(true);

      const response = await fetch(
        `/api/reports/${reportId}/pdf`,
      );

      if (!response.ok) {
        throw new Error("PDF download failed.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `loop-report-${reportId}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF download failed.", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={loading}
      className="rounded-xl bg-loop-700 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-loop-800 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? "Generating PDF..." : "Download PDF"}
    </button>
  );
}