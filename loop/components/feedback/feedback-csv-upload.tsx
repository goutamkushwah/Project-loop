"use client";

import { type ChangeEvent, type DragEvent, type FormEvent, useRef, useState } from "react";

import { MAX_CSV_FILE_BYTES } from "@/lib/feedback-import-constants";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api";
import type { FeedbackCsvImportSummary } from "@/types/feedback-import";

type FeedbackCsvUploadProps = {
  onImported: (summary: FeedbackCsvImportSummary) => Promise<void> | void;
};

type CsvImportResponse = {
  summary: FeedbackCsvImportSummary;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FeedbackCsvUpload({ onImported }: FeedbackCsvUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formErrorDetails, setFormErrorDetails] = useState<string[]>([]);
  const [summary, setSummary] = useState<FeedbackCsvImportSummary | null>(null);

  function validateAndSelectFile(nextFile: File | null) {
    setFormError(null);
    setFormErrorDetails([]);
    setSummary(null);

    if (!nextFile) {
      setFile(null);
      return;
    }

    if (!nextFile.name.toLowerCase().endsWith(".csv")) {
      setFile(null);
      setFormError("Select a file ending in .csv.");
      return;
    }

    if (nextFile.size === 0) {
      setFile(null);
      setFormError("The selected CSV file is empty.");
      return;
    }

    if (nextFile.size > MAX_CSV_FILE_BYTES) {
      setFile(null);
      setFormError("The selected CSV file is larger than 5 MB.");
      return;
    }

    setFile(nextFile);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    validateAndSelectFile(event.target.files?.[0] ?? null);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    validateAndSelectFile(event.dataTransfer.files[0] ?? null);
  }

  function clearSelection() {
    setFile(null);
    setSummary(null);
    setFormError(null);
    setFormErrorDetails([]);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFormErrorDetails([]);
    setSummary(null);

    if (!file) {
      setFormError("Select a CSV file before starting the import.");
      return;
    }

    setIsUploading(true);

    try {
      const body = new FormData();
      body.set("file", file);

      const response = await fetch("/api/feedback/import/csv", {
        method: "POST",
        body,
      });
      const result = (await response.json()) as
        ApiSuccessResponse<CsvImportResponse> | ApiErrorResponse;

      if (!response.ok || !result.success) {
        if (!result.success) {
          setFormError(result.error.message);
          setFormErrorDetails(
            Object.values(result.error.fieldErrors ?? {})
              .flatMap((messages) => messages ?? [])
              .filter((message): message is string => message.length > 0),
          );
        } else {
          setFormError("The CSV import could not be completed.");
        }
        return;
      }

      setSummary(result.data.summary);
      setFile(null);

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      if (result.data.summary.importedRows > 0) {
        await onImported(result.data.summary);
      }
    } catch {
      setFormError("The CSV import is temporarily unavailable. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      {formError ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
        >
          <p>{formError}</p>
          {formErrorDetails.length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {formErrorDetails.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragging(false);
        }}
        onDrop={handleDrop}
        className={`rounded-2xl border-2 border-dashed p-6 text-center transition ${
          isDragging
            ? "border-loop-500 bg-loop-50"
            : "border-slate-300 bg-slate-50 hover:border-loop-300"
        }`}
      >
        <label htmlFor="feedback-csv-file" className="cursor-pointer">
          <span
            aria-hidden="true"
            className="mx-auto grid size-12 place-items-center rounded-2xl bg-white text-xl shadow-sm hover:bg-gray-100 transition"
          >
            ⇧
          </span>
        </label>

        <label className="mt-4 inline-block cursor-pointer rounded-lg font-bold text-loop-800 underline decoration-loop-300 underline-offset-4 focus-within:ring-2 focus-within:ring-loop-500 focus-within:ring-offset-2">
          Choose a CSV file
          <input
            ref={inputRef}
            id="feedback-csv-file"
            name="file"
            type="file"
            accept=".csv,text/csv,application/csv,application/vnd.ms-excel"
            disabled={isUploading}
            onChange={handleFileChange}
            className="sr-only"
          />
        </label>
        <p className="mt-2 text-sm text-slate-600">or drag and drop it here</p>
        <p className="mt-1 text-xs text-slate-500">UTF-8 CSV · maximum 5 MB · up to 2,000 rows</p>
      </div>

      {file ? (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">{file.name}</p>
            <p className="mt-1 text-xs text-slate-500">{formatBytes(file.size)}</p>
          </div>
          <button
            type="button"
            onClick={clearSelection}
            disabled={isUploading}
            className="shrink-0 rounded-lg px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2 disabled:opacity-50"
          >
            Remove
          </button>
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
        <p className="font-bold text-slate-900">Required columns</p>
        <code className="mt-2 block overflow-x-auto rounded-lg bg-white px-3 py-2 text-xs text-slate-800 ring-1 ring-inset ring-slate-200">
          content, channel
        </code>
        <p className="mt-3">
          Optional: <code>customer_label</code>, <code>source_ref</code>, and{" "}
          <code>created_at</code>. Keep <code>sentiment</code> and <code>themes</code> blank.
        </p>
        <a
          href="/templates/feedback-import-template.csv"
          download
          className="mt-3 inline-flex font-bold text-loop-700 underline decoration-loop-300 underline-offset-4 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2"
        >
          Download CSV template
        </a>
      </div>

      <button
        type="submit"
        disabled={!file || isUploading}
        className="inline-flex w-full items-center justify-center rounded-xl bg-loop-900 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-loop-800 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isUploading ? "Validating and importing…" : "Import CSV"}
      </button>

      {summary ? (
        <section
          aria-live="polite"
          className="rounded-2xl border border-slate-200 bg-white p-5"
          aria-label="CSV import result"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-bold text-loop-700">Import complete</p>
              <h3 className="mt-1 break-words text-lg font-black text-loop-900">
                {summary.fileName}
              </h3>
            </div>
            <span
              className={`w-fit rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${
                summary.failedRows === 0
                  ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                  : "bg-amber-50 text-amber-800 ring-amber-200"
              }`}
            >
              {summary.failedRows === 0
                ? "All rows imported"
                : summary.importedRows === 0
                  ? "No rows imported"
                  : "Partial import"}
            </span>
          </div>

          <dl className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-slate-50 p-3 text-center">
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Rows</dt>
              <dd className="mt-1 text-xl font-black text-slate-900">{summary.totalRows}</dd>
            </div>
            <div className="rounded-xl bg-emerald-50 p-3 text-center">
              <dt className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                Imported
              </dt>
              <dd className="mt-1 text-xl font-black text-emerald-900">{summary.importedRows}</dd>
            </div>
            <div className="rounded-xl bg-red-50 p-3 text-center">
              <dt className="text-xs font-bold uppercase tracking-wide text-red-700">Failed</dt>
              <dd className="mt-1 text-xl font-black text-red-900">{summary.failedRows}</dd>
            </div>
          </dl>

          {summary.errors.length > 0 ? (
            <div className="mt-5">
              <p className="text-sm font-bold text-slate-900">Rows requiring correction</p>
              <div className="mt-3 max-h-64 overflow-auto rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="sticky top-0 bg-slate-50">
                    <tr>
                      <th scope="col" className="px-3 py-2 font-bold text-slate-700">
                        Row
                      </th>
                      <th scope="col" className="px-3 py-2 font-bold text-slate-700">
                        Field
                      </th>
                      <th scope="col" className="px-3 py-2 font-bold text-slate-700">
                        Issue
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {summary.errors.map((error, index) => (
                      <tr key={`${error.row}-${error.field ?? "row"}-${index}`}>
                        <td className="whitespace-nowrap px-3 py-2 font-semibold text-slate-900">
                          {error.row}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                          {error.field ?? "row"}
                        </td>
                        <td className="px-3 py-2 leading-5 text-slate-700">{error.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {summary.truncatedErrorCount > 0 ? (
                <p className="mt-2 text-xs text-slate-500">
                  {summary.truncatedErrorCount.toLocaleString()} additional validation issue
                  {summary.truncatedErrorCount === 1 ? "" : "s"} not shown.
                </p>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}
    </form>
  );
}
