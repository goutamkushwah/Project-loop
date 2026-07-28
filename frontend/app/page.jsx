"use client";

import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, Boxes, BarChart3, MessagesSquare } from "lucide-react";
import { Card, FONTS, AuthTopBar } from "@/components/ui";

export default function LandingPage() {
  const router = useRouter();
  const nav = (path) => router.push(path);

  const features = [
    { icon: Boxes, title: "Every channel, one inbox", text: "Tickets, reviews, surveys, and call notes land in a single triaged queue." },
    { icon: BarChart3, title: "Themes that surface themselves", text: "Feedback is clustered and ranked automatically, no manual tagging." },
    { icon: MessagesSquare, title: "Ask in plain English", text: "Ask LOOP answers from your real feedback, and cites every source." },
  ];

  return (
    <div className="w-full min-h-screen" style={{ background: "#0A0A12" }}>
      <style>{FONTS}</style>
      <div style={{ fontFamily: "'Inter', sans-serif" }}>
        <AuthTopBar nav={nav} />

        <div className="max-w-4xl mx-auto px-6 pt-16 pb-20 text-center">
          <div
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium mb-6"
            style={{ background: "rgba(124,111,255,0.12)", color: "#B9AFFF" }}
          >
            <Sparkles size={13} /> AI customer-feedback intelligence
          </div>
          <h1
            className="text-4xl sm:text-5xl font-semibold leading-[1.1]"
            style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#F1F0F5" }}
          >
            Close the loop on
            <br />
            <span style={{ color: "#7C6FFF" }}>every customer voice.</span>
          </h1>
          <p className="mt-5 text-base max-w-lg mx-auto" style={{ color: "#8B899C" }}>
            LOOP turns scattered support tickets, reviews, and survey replies into a
            ranked, evidence-backed list of what to build next.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              onClick={() => nav("/signup")}
              className="flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-medium"
              style={{ background: "#7C6FFF", color: "#0A0A12" }}
            >
              Get started free <ArrowRight size={16} />
            </button>
            <button
              onClick={() => nav("/login")}
              className="rounded-lg px-5 py-3 text-sm font-medium"
              style={{ border: "1px solid #232336", color: "#F1F0F5" }}
            >
              Log in
            </button>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 pb-24 grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <Card key={f.title} className="p-6">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center mb-4"
                  style={{ background: "rgba(124,111,255,0.14)" }}
                >
                  <Icon size={17} color="#B9AFFF" />
                </div>
                <div className="text-sm font-semibold" style={{ color: "#F1F0F5" }}>{f.title}</div>
                <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "#8B899C" }}>{f.text}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
