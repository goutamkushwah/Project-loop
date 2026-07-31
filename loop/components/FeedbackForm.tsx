"use client";

import { useState } from "react";

const CHANNELS = [
    { value: "SUPPORT_TICKET", label: "Support ticket" },
    { value: "APP_STORE_REVIEW", label: "App store review" },
    { value: "SURVEY", label: "Survey response" },
    { value: "SALES_CALL_NOTE", label: "Sales call note" },
    { value: "SOCIAL_MENTION", label: "Social mention" },
] as const;

type FormState = {
    content: string;
    channel: string;
    customerLabel: string;
};

const initialState: FormState = {
    content: "",
    channel: "",
    customerLabel: "",
};

export default function FeedbackForm() {
    const [form, setForm] = useState<FormState>(initialState);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">(
        "idle"
    );
    const [errorMessage, setErrorMessage] = useState("");

    function updateField(key: keyof FormState, value: string) {
        setForm((prev) => ({ ...prev, [key]: value }));
        if (errors[key]) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next[key];
                return next;
            });
        }
    }

    function validate(): boolean {
        const newErrors: Record<string, string> = {};

        if (form.content.trim().length < 3) {
            newErrors.content = "Feedback must be at least 3 characters";
        }
        if (form.content.trim().length > 4000) {
            newErrors.content = "Feedback is too long (max 4000 characters)";
        }
        if (!form.channel) {
            newErrors.channel = "Select a channel";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!validate()) return;

        setStatus("submitting");
        setErrorMessage("");

        try {
            const res = await fetch("/api/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: form.content.trim(),
                    channel: form.channel,
                    customerLabel: form.customerLabel.trim() || undefined,
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error ?? "Something went wrong");
            }

            setStatus("success");
            setForm(initialState);
            setTimeout(() => setStatus("idle"), 2500);
        } catch (err) {
            setStatus("error");
            setErrorMessage(err instanceof Error ? err.message : "Something went wrong");
        }
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="w-full max-w-lg space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            noValidate
        >
            <div>
                <h2 className="text-lg font-semibold text-slate-900">Add feedback</h2>
                <p className="mt-1 text-sm text-slate-500">
                    Drop in a single piece of customer feedback to add it to the inbox.
                </p>
            </div>

            {/* Content */}
            <div>
                <label htmlFor="content" className="block text-sm font-medium text-slate-700">
                    Feedback content
                </label>
                <textarea
                    id="content"
                    rows={4}
                    value={form.content}
                    onChange={(e) => updateField("content", e.target.value)}
                    placeholder="e.g. Customer asked for CSV export again on the call today."
                    aria-invalid={!!errors.content}
                    className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 ${errors.content
                            ? "border-red-300 focus:ring-red-400"
                            : "border-slate-300 focus:ring-slate-400"
                        }`}
                />
                {errors.content && (
                    <p className="mt-1 text-sm text-red-600">{errors.content}</p>
                )}
            </div>

            {/* Channel */}
            <div>
                <label htmlFor="channel" className="block text-sm font-medium text-slate-700">
                    Channel
                </label>
                <select
                    id="channel"
                    value={form.channel}
                    onChange={(e) => updateField("channel", e.target.value)}
                    aria-invalid={!!errors.channel}
                    className={`mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 ${errors.channel
                            ? "border-red-300 focus:ring-red-400"
                            : "border-slate-300 focus:ring-slate-400"
                        }`}
                >
                    <option value="" disabled>
                        Select a channel
                    </option>
                    {CHANNELS.map((c) => (
                        <option key={c.value} value={c.value}>
                            {c.label}
                        </option>
                    ))}
                </select>
                {errors.channel && (
                    <p className="mt-1 text-sm text-red-600">{errors.channel}</p>
                )}
            </div>

            {/* Customer label (optional) */}
            <div>
                <label htmlFor="customerLabel" className="block text-sm font-medium text-slate-700">
                    Customer <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <input
                    id="customerLabel"
                    type="text"
                    value={form.customerLabel}
                    onChange={(e) => updateField("customerLabel", e.target.value)}
                    placeholder="e.g. Acme Corp"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1"
                />
            </div>

            {status === "error" && (
                <p role="alert" className="text-sm text-red-600">
                    {errorMessage}
                </p>
            )}
            {status === "success" && (
                <p role="status" className="text-sm text-emerald-600">
                    Feedback added.
                </p>
            )}

            <button
                type="submit"
                disabled={status === "submitting"}
                className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
                {status === "submitting" ? "Saving…" : "Add feedback"}
            </button>
        </form>
    );
}