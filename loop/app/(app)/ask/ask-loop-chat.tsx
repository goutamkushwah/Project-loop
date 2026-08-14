"use client";

import { useState, useRef, useEffect } from "react";

interface Source {
  index: number;
  feedbackId: string;
  channel: string;
  excerpt: string;
  similarity: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
}

export function AskLoopChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const question = input.trim();
    if (!question || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "Failed to get an answer");
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer, sources: data.sources },
      ]);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8 flex flex-col rounded-3xl border border-slate-200 bg-white">
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 min-h-[400px] max-h-[60vh]">
        {messages.length === 0 && (
          <div className="text-sm text-slate-400 mt-8 text-center">
            Try: "What are customers saying about the checkout flow?"
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={msg.role === "user" ? "text-right" : "text-left"}>
            <div
              className={
                msg.role === "user"
                  ? "inline-block bg-loop-600 text-white rounded-xl px-4 py-2 max-w-[80%]"
                  : "inline-block bg-slate-100 rounded-xl px-4 py-2 max-w-[80%] text-left"
              }
            >
              <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
            </div>

            {msg.sources && msg.sources.length > 0 && (
              <div className="mt-2 space-y-1 text-left">
                <p className="text-xs font-bold text-slate-500">Sources</p>
                {msg.sources.map((s) => (
                  <a
                    key={s.feedbackId}
                    href={`/inbox?feedbackId=${s.feedbackId}`}
                    className="block text-xs text-slate-600 border border-slate-200 rounded-lg px-2 py-1 hover:bg-slate-50"
                  >
                    [{s.index}] {s.channel} · similarity {s.similarity} — {s.excerpt}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="text-left text-sm text-slate-400">LOOP is thinking...</div>
        )}
        {error && <div className="text-left text-sm text-red-500">{error}</div>}

        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t border-slate-200 px-6 py-4 flex gap-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask something about your feedback..."
          className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-loop-500"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-xl bg-loop-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          Ask
        </button>
      </form>
    </div>
  );
}