"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ---------- Types ----------
type Sentiment = "POS" | "NEU" | "NEG";
type Status = "NEW" | "REVIEWED" | "ACTIONED";

interface FeedbackItem {
    id: string;
    content: string;
    channel: string;
    sentiment: Sentiment;
    sentimentScore: number;
    status: Status;
    createdAt: string;
    themes: { theme: { id: string; name: string; color: string } }[];
}

interface SearchHistoryEntry {
    id: string;
    query: string;
    filters: Record<string, string | undefined> | null;
    resultCount: number;
    createdAt: string;
}

interface SearchResponse {
    items: FeedbackItem[];
    pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

const sentimentColor: Record<Sentiment, string> = {
    POS: "bg-green-100 text-green-800",
    NEU: "bg-gray-100 text-gray-700",
    NEG: "bg-red-100 text-red-800",
};

export default function FeedbackSearch() {
    const [query, setQuery] = useState("");
    const [channel, setChannel] = useState("");
    const [sentiment, setSentiment] = useState<Sentiment | "">("");
    const [status, setStatus] = useState<Status | "">("");

    const [results, setResults] = useState<FeedbackItem[]>([]);
    const [pagination, setPagination] = useState<SearchResponse["pagination"] | null>(null);
    const [page, setPage] = useState(1);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [history, setHistory] = useState<SearchHistoryEntry[]>([]);
    const [showHistory, setShowHistory] = useState(false);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // ---------- Load search history on mount ----------
    const loadHistory = useCallback(async () => {
        try {
            const res = await fetch("/api/search-history");
            if (!res.ok) return;
            const data = await res.json();
            setHistory(data.history ?? []);
        } catch {
            // Silent fail — history is a convenience feature, never block the UI on it
        }
    }, []);

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    // ---------- Close history dropdown on outside click ----------
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowHistory(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // ---------- Run the actual search ----------
    const runSearch = useCallback(
        async (searchQuery: string, targetPage = 1) => {
            if (!searchQuery.trim()) {
                setResults([]);
                setPagination(null);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const params = new URLSearchParams({
                    q: searchQuery,
                    page: String(targetPage),
                    pageSize: "20",
                    saveHistory: "true",
                });
                if (channel) params.set("channel", channel);
                if (sentiment) params.set("sentiment", sentiment);
                if (status) params.set("status", status);

                const res = await fetch(`/api/feedback/search?${params.toString()}`);
                if (!res.ok) {
                    const body = await res.json().catch(() => ({}));
                    throw new Error(body.error || "Search failed");
                }
                const data: SearchResponse = await res.json();
                setResults(data.items);
                setPagination(data.pagination);
                setPage(targetPage);
                loadHistory(); // refresh history so the new search shows up
            } catch (err) {
                setError(err instanceof Error ? err.message : "Something went wrong");
                setResults([]);
                setPagination(null);
            } finally {
                setLoading(false);
            }
        },
        [channel, sentiment, status, loadHistory]
    );

    // ---------- Debounced live search as user types ----------
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            runSearch(query, 1);
        }, 400);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query, channel, sentiment, status]);

    // ---------- Re-run a past search from history ----------
    function applyHistoryEntry(entry: SearchHistoryEntry) {
        setQuery(entry.query);
        if (entry.filters?.channel) setChannel(entry.filters.channel);
        if (entry.filters?.sentiment) setSentiment(entry.filters.sentiment as Sentiment);
        if (entry.filters?.status) setStatus(entry.filters.status as Status);
        setShowHistory(false);
    }

    async function deleteHistoryEntry(id: string, e: React.MouseEvent) {
        e.stopPropagation();
        setHistory((prev) => prev.filter((h) => h.id !== id));
        await fetch(`/api/search-history?id=${id}`, { method: "DELETE" }).catch(() => { });
    }

    async function clearAllHistory() {
        setHistory([]);
        await fetch(`/api/search-history?all=true`, { method: "DELETE" }).catch(() => { });
    }

    return (
        <div className="w-full max-w-3xl mx-auto" ref={containerRef}>
            {/* ---------- Search bar ---------- */}
            <div className="relative">
                <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-500">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"
                        />
                    </svg>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => setShowHistory(true)}
                        placeholder="Search feedback — e.g. 'onboarding', 'billing issue'..."
                        className="flex-1 outline-none text-sm text-gray-800 placeholder:text-gray-400"
                    />
                    {query && (
                        <button
                            onClick={() => setQuery("")}
                            className="text-gray-400 hover:text-gray-600 text-sm"
                            aria-label="Clear search"
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* ---------- Search history dropdown ---------- */}
                {showHistory && history.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-72 overflow-y-auto">
                        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
                            <span className="text-xs font-medium text-gray-500">Recent searches</span>
                            <button
                                onClick={clearAllHistory}
                                className="text-xs text-blue-600 hover:underline"
                            >
                                Clear all
                            </button>
                        </div>
                        {history.map((entry) => (
                            <button
                                key={entry.id}
                                onClick={() => applyHistoryEntry(entry)}
                                className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50 text-sm"
                            >
                                <span className="flex items-center gap-2 text-gray-700 truncate">
                                    <svg className="h-3.5 w-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {entry.query}
                                    <span className="text-xs text-gray-400">({entry.resultCount} results)</span>
                                </span>
                                <span
                                    onClick={(e) => deleteHistoryEntry(entry.id, e)}
                                    className="text-gray-300 hover:text-red-500 shrink-0 ml-2"
                                    role="button"
                                    aria-label="Remove from history"
                                >
                                    ✕
                                </span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* ---------- Filters ---------- */}
            <div className="flex flex-wrap gap-2 mt-3">
                <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                    className="text-sm border border-gray-300 rounded-md px-2 py-1"
                >
                    <option value="">All channels</option>
                    <option value="support_ticket">Support ticket</option>
                    <option value="app_store">App store review</option>
                    <option value="nps_survey">NPS survey</option>
                    <option value="sales_call">Sales call note</option>
                    <option value="community">Community post</option>
                </select>

                <select
                    value={sentiment}
                    onChange={(e) => setSentiment(e.target.value as Sentiment | "")}
                    className="text-sm border border-gray-300 rounded-md px-2 py-1"
                >
                    <option value="">All sentiments</option>
                    <option value="POS">Positive</option>
                    <option value="NEU">Neutral</option>
                    <option value="NEG">Negative</option>
                </select>

                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Status | "")}
                    className="text-sm border border-gray-300 rounded-md px-2 py-1"
                >
                    <option value="">All statuses</option>
                    <option value="NEW">New</option>
                    <option value="REVIEWED">Reviewed</option>
                    <option value="ACTIONED">Actioned</option>
                </select>
            </div>

            {/* ---------- Results ---------- */}
            <div className="mt-4">
                {loading && <p className="text-sm text-gray-500">Searching…</p>}

                {error && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                        {error}
                    </p>
                )}

                {!loading && !error && query && results.length === 0 && (
                    <p className="text-sm text-gray-500">No feedback matches "{query}".</p>
                )}

                {!loading && results.length > 0 && (
                    <>
                        <p className="text-xs text-gray-500 mb-2">
                            {pagination?.total} result{pagination?.total === 1 ? "" : "s"}
                        </p>
                        <ul className="space-y-2">
                            {results.map((item) => (
                                <li
                                    key={item.id}
                                    className="border border-gray-200 rounded-lg px-4 py-3 hover:shadow-sm transition"
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${sentimentColor[item.sentiment]}`}>
                                            {item.sentiment}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-800">{item.content}</p>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {item.themes.map((t) => (
                                            <span
                                                key={t.theme.id}
                                                className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700"
                                            >
                                                {t.theme.name}
                                            </span>
                                        ))}
                                    </div>
                                </li>
                            ))}
                        </ul>

                        {/* ---------- Pagination ---------- */}
                        {pagination && pagination.totalPages > 1 && (
                            <div className="flex items-center justify-center gap-3 mt-4">
                                <button
                                    disabled={page <= 1}
                                    onClick={() => runSearch(query, page - 1)}
                                    className="text-sm px-3 py-1 rounded-md border border-gray-300 disabled:opacity-40"
                                >
                                    Previous
                                </button>
                                <span className="text-xs text-gray-500">
                                    Page {pagination.page} of {pagination.totalPages}
                                </span>
                                <button
                                    disabled={page >= pagination.totalPages}
                                    onClick={() => runSearch(query, page + 1)}
                                    className="text-sm px-3 py-1 rounded-md border border-gray-300 disabled:opacity-40"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}