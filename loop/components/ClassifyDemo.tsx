"use client";

import { useState } from "react";
import type { Classification } from "@/lib/schemas";

/**
 * ---------------------------------------------------------------
 * Yeh component UI pe dikhega. Isse tum kisi bhi page me daal sakte ho,
 * jaise: app/(app)/inbox/page.tsx
 *
 * IMPORTANT: Yeh "lib/ai.ts" ko import NAHI karta — kyunki lib/ai.ts
 * server-side hai (API key hold karta hai) aur browser me chal hi nahi
 * sakta. Yeh sirf apne API route ko fetch() karta hai.
 * ---------------------------------------------------------------
 */
export default function ClassifyDemo({ feedbackId }: { feedbackId: string }) {
    const [content, setContent] = useState("");
    const [result, setResult] = useState<Classification | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleClassify() {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const res = await fetch("/api/feedback/classify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    feedbackId,
                    content,
                    existingThemeNames: [], // real app me DB se existing themes lao
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error ?? "Classification failed");
            }

            const data = await res.json();
            setResult(data.classification);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-xl space-y-4 rounded-lg border p-4">
            <h2 className="text-lg font-semibold">Classify Feedback</h2>

            <textarea
                className="w-full rounded border p-2"
                rows={4}
                placeholder="Paste feedback text here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
            />

            <button
                onClick={handleClassify}
                disabled={loading || !content}
                className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
            >
                {loading ? "Classifying..." : "Classify with Claude"}
            </button>

            {error && <p className="text-sm text-red-600">{error}</p>}

            {result && (
                <div className="rounded bg-gray-50 p-3 text-sm">
                    <p>
                        <strong>Sentiment:</strong> {result.sentiment} (
                        {result.sentimentScore.toFixed(2)})
                    </p>
                    <p>
                        <strong>Themes:</strong> {result.themes.join(", ")}
                    </p>
                    <p>
                        <strong>Feature Area:</strong> {result.featureArea}
                    </p>
                    <p>
                        <strong>Why:</strong> {result.rationale}
                    </p>
                </div>
            )}
        </div>
    );
}