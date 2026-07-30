"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import type { ApiErrorResponse, ApiFieldErrors, ApiSuccessResponse } from "@/types/api";

type InvitationAcceptFormProps = {
  token: string;
  email: string;
  role: "ADMIN" | "ANALYST" | "VIEWER";
  workspaceName: string;
};

type InvitationAcceptData = {
  user: {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "ANALYST" | "VIEWER";
  };
  workspace: {
    id: string;
    name: string;
    slug: string;
  };
};

export function InvitationAcceptForm({
  token,
  email,
  role,
  workspaceName,
}: InvitationAcceptFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ApiFieldErrors>({});

  function firstError(field: string): string | undefined {
    return fieldErrors[field]?.[0];
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "");
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      setFieldErrors({
        confirmPassword: ["Passwords do not match."],
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/invitations/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          password,
        }),
      });

      const result = (await response.json()) as
        | ApiSuccessResponse<InvitationAcceptData>
        | ApiErrorResponse;

      if (!response.ok || !result.success) {
        if (!result.success && result.error.fieldErrors) {
          setFieldErrors(result.error.fieldErrors);
        }

        setFormError(
          !result.success ? result.error.message : "The invitation could not be accepted.",
        );
        return;
      }

      const signInResult = await signIn("credentials", {
        email,
        password,
        callbackUrl: "/dashboard",
        redirect: false,
      });

      if (!signInResult || signInResult.error) {
        router.replace("/login?registered=1&callbackUrl=%2Fdashboard");
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setFormError("Invitation acceptance is temporarily unavailable. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      <div className="rounded-xl border border-loop-200 bg-loop-50 px-4 py-3 text-sm text-loop-900">
        <p className="font-bold">{workspaceName}</p>
        <p className="mt-1 text-loop-700">
          {email} · {role}
        </p>
      </div>

      {formError ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
        >
          {formError}
        </div>
      ) : null}

      <div>
        <label htmlFor="name" className="block text-sm font-semibold text-slate-800">
          Your name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          minLength={2}
          maxLength={120}
          disabled={isSubmitting}
          aria-invalid={Boolean(firstError("name"))}
          aria-describedby={firstError("name") ? "invite-name-error" : undefined}
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-loop-500 focus:ring-4 focus:ring-loop-100 disabled:cursor-not-allowed disabled:bg-slate-100"
          placeholder="Your full name"
        />
        {firstError("name") ? (
          <p id="invite-name-error" className="mt-2 text-sm font-medium text-red-700">
            {firstError("name")}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-semibold text-slate-800">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          maxLength={128}
          disabled={isSubmitting}
          aria-invalid={Boolean(firstError("password"))}
          aria-describedby="invite-password-help invite-password-error"
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-loop-500 focus:ring-4 focus:ring-loop-100 disabled:cursor-not-allowed disabled:bg-slate-100"
          placeholder="Create a strong password"
        />
        <p id="invite-password-help" className="mt-2 text-xs leading-5 text-slate-500">
          Use at least 12 characters with uppercase, lowercase, number, and symbol.
        </p>
        {firstError("password") ? (
          <p id="invite-password-error" className="mt-2 text-sm font-medium text-red-700">
            {firstError("password")}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-800">
          Confirm password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          maxLength={128}
          disabled={isSubmitting}
          aria-invalid={Boolean(firstError("confirmPassword"))}
          aria-describedby={
            firstError("confirmPassword") ? "invite-confirm-password-error" : undefined
          }
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-loop-500 focus:ring-4 focus:ring-loop-100 disabled:cursor-not-allowed disabled:bg-slate-100"
          placeholder="Repeat your password"
        />
        {firstError("confirmPassword") ? (
          <p
            id="invite-confirm-password-error"
            className="mt-2 text-sm font-medium text-red-700"
          >
            {firstError("confirmPassword")}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-full items-center justify-center rounded-xl bg-loop-900 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-loop-800 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Joining workspace…" : "Join workspace"}
      </button>
    </form>
  );
}