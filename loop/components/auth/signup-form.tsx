"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { sanitizeCallbackUrl } from "@/lib/navigation";
import type { ApiErrorResponse, ApiFieldErrors, ApiSuccessResponse } from "@/types/api";

type SignupFormProps = {
  callbackUrl: string;
};

type SignupRole = "ANALYST" | "VIEWER";

type RegistrationData = {
  user: {
    id: string;
    name: string;
    email: string;
    role: SignupRole;
  };
  workspace: {
    id: string;
    name: string;
    slug: string;
  };
};

const ROLE_OPTIONS: Array<{
  value: SignupRole;
  label: string;
  description: string;
}> = [
  {
    value: "ANALYST",
    label: "Analyst",
    description: ".",
  },
  {
    value: "VIEWER",
    label: "Viewer",
    description: "",
  },
];

export function SignupForm({ callbackUrl }: SignupFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ApiFieldErrors>({});
  const [role, setRole] = useState<SignupRole>("ANALYST");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "");
    const workspaceName = String(formData.get("workspaceName") ?? "");
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
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
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          workspaceName,
          email,
          password,
          role,
        }),
      });

      const result = (await response.json()) as
        | ApiSuccessResponse<RegistrationData>
        | ApiErrorResponse;

      if (!response.ok || !result.success) {
        if (!result.success && result.error.fieldErrors) {
          setFieldErrors(result.error.fieldErrors);
        }

        setFormError(
          !result.success ? result.error.message : "Registration failed. Please try again.",
        );
        return;
      }

      const signInResult = await signIn("credentials", {
        email,
        password,
        callbackUrl,
        redirect: false,
      });

      if (!signInResult || signInResult.error) {
        router.replace(`/login?registered=1&callbackUrl=${encodeURIComponent(callbackUrl)}`);
        return;
      }

      router.replace(sanitizeCallbackUrl(callbackUrl));
      router.refresh();
    } catch {
      setFormError("Registration is temporarily unavailable. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function firstError(field: string): string | undefined {
    return fieldErrors[field]?.[0];
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
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
          aria-describedby={firstError("name") ? "name-error" : undefined}
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-loop-500 focus:ring-4 focus:ring-loop-100 disabled:cursor-not-allowed disabled:bg-slate-100"
          placeholder="John Doe"
        />
        {firstError("name") ? (
          <p id="name-error" className="mt-2 text-sm font-medium text-red-700">
            {firstError("name")}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="workspaceName" className="block text-sm font-semibold text-slate-800">
          Company or workspace name
        </label>
        <input
          id="workspaceName"
          name="workspaceName"
          type="text"
          autoComplete="organization"
          required
          minLength={2}
          maxLength={120}
          disabled={isSubmitting}
          aria-invalid={Boolean(firstError("workspaceName"))}
          aria-describedby={firstError("workspaceName") ? "workspace-error" : undefined}
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-loop-500 focus:ring-4 focus:ring-loop-100 disabled:cursor-not-allowed disabled:bg-slate-100"
          placeholder="Acme Cloud"
        />
        {firstError("workspaceName") ? (
          <p id="workspace-error" className="mt-2 text-sm font-medium text-red-700">
            {firstError("workspaceName")}
          </p>
        ) : null}
      </div>

      <fieldset disabled={isSubmitting}>
        <legend className="block text-sm font-semibold text-slate-800">
          How will you use LOOP?
        </legend>
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {ROLE_OPTIONS.map((option) => {
            const isSelected = role === option.value;
            return (
              <label
                key={option.value}
                htmlFor={`role-${option.value}`}
                className={`relative flex cursor-pointer flex-col rounded-xl border px-4 py-3 text-left transition focus-within:ring-4 focus-within:ring-loop-100 ${
                  isSelected
                    ? "border-loop-500 bg-loop-50 ring-2 ring-loop-500"
                    : "border-slate-300 bg-white hover:border-loop-300"
                } ${isSubmitting ? "cursor-not-allowed opacity-60" : ""}`}
              >
                <input
                  id={`role-${option.value}`}
                  name="role"
                  type="radio"
                  value={option.value}
                  checked={isSelected}
                  onChange={() => setRole(option.value)}
                  disabled={isSubmitting}
                  className="sr-only"
                />
                <span className="text-sm font-bold text-slate-900">{option.label}</span>
                <span className="mt-1 text-xs leading-5 text-slate-600">
                  {option.description}
                </span>
              </label>
            );
          })}
        </div>
        {firstError("role") ? (
          <p className="mt-2 text-sm font-medium text-red-700">{firstError("role")}</p>
        ) : null}
      </fieldset>

      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-slate-800">
          Work email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          maxLength={254}
          disabled={isSubmitting}
          aria-invalid={Boolean(firstError("email"))}
          aria-describedby={firstError("email") ? "email-error" : undefined}
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-loop-500 focus:ring-4 focus:ring-loop-100 disabled:cursor-not-allowed disabled:bg-slate-100"
          placeholder="you@company.com"
        />
        {firstError("email") ? (
          <p id="email-error" className="mt-2 text-sm font-medium text-red-700">
            {firstError("email")}
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
          aria-describedby="password-help password-error"
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-loop-500 focus:ring-4 focus:ring-loop-100 disabled:cursor-not-allowed disabled:bg-slate-100"
          placeholder="Create a strong password"
        />
        <p id="password-help" className="mt-2 text-xs leading-5 text-slate-500">
          Use at least 12 characters with uppercase, lowercase, number, and symbol.
        </p>
        {firstError("password") ? (
          <p id="password-error" className="mt-2 text-sm font-medium text-red-700">
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
            firstError("confirmPassword") ? "confirm-password-error" : undefined
          }
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-loop-500 focus:ring-4 focus:ring-loop-100 disabled:cursor-not-allowed disabled:bg-slate-100"
          placeholder="Repeat your password"
        />
        {firstError("confirmPassword") ? (
          <p id="confirm-password-error" className="mt-2 text-sm font-medium text-red-700">
            {firstError("confirmPassword")}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-full items-center justify-center rounded-xl bg-loop-900 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-loop-800 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Creating workspace…" : "Create workspace"}
      </button>

      <p className="text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link
          href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="font-bold text-loop-700 underline decoration-loop-300 underline-offset-4 hover:text-loop-900 focus:outline-none focus:ring-2 focus:ring-loop-500 focus:ring-offset-2"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}