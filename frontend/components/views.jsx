"use client";

import { useState, useMemo } from "react";
import {
  AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  LayoutDashboard, Inbox as InboxIcon, TrendingUp, Sparkles, FileText,
  Search, ArrowUpRight, ArrowDownRight, CheckCircle2, Circle, Clock,
  Download, Plus, Send, Quote,
} from "lucide-react";
import {
  Card, Pill, StatCard, LoopMark, FEEDBACK, VOLUME_DATA, SENTIMENT_DATA,
  THEME_DATA, TREND_DATA, SENT_COLOR, SENT_LABEL,
} from "./ui";

export const STATUS_ICON = { NEW: Circle, REVIEWED: Clock, ACTIONED: CheckCircle2 };
export const STATUS_COLOR = { NEW: "#8B899C", REVIEWED: "#F5A623", ACTIONED: "#2DD4BF" };

export const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "inbox", label: "Inbox", icon: InboxIcon },
  { id: "trends", label: "Trends", icon: TrendingUp },
  { id: "ask", label: "Ask LOOP", icon: Sparkles },
  { id: "reports", label: "Reports", icon: FileText },
];

export function Sidebar({ active, setActive, workspaceName = "Acme Corp" }) {
  return (
    <div
      className="hidden md:flex w-56 shrink-0 flex-col justify-between py-6 px-4"
      style={{ background: "#0A0A12", borderRight: "1px solid #1D1D2B" }}
    >
      <div>
        <div className="flex items-center gap-2 px-2 mb-8">
          <LoopMark size={26} />
          <span
            className="text-lg font-semibold"
            style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#F1F0F5" }}
          >
            LOOP
          </span>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-left"
                style={{
                  background: isActive ? "rgba(124,111,255,0.14)" : "transparent",
                  color: isActive ? "#B9AFFF" : "#8B899C",
                }}
              >
                <Icon size={17} strokeWidth={2} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
      <div className="px-2">
        <div
          className="rounded-xl px-3 py-3 text-xs"
          style={{ background: "#14141F", border: "1px solid #232336", color: "#8B899C" }}
        >
          <div className="font-medium" style={{ color: "#F1F0F5" }}>{workspaceName}</div>
          <div className="mt-0.5">Admin workspace</div>
        </div>
      </div>
    </div>
  );
}

export function TopBar({ title, subtitle, initials = "PM" }) {
  return (
    <div className="flex items-center justify-between px-6 md:px-8 py-6">
      <div>
        <h1
          className="text-2xl font-semibold"
          style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#F1F0F5" }}
        >
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm" style={{ color: "#8B899C" }}>{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold"
          style={{ background: "#7C6FFF", color: "#0A0A12" }}
        >
          {initials}
        </div>
      </div>
    </div>
  );
}

export function DashboardView() {
  return (
    <div className="px-6 md:px-8 pb-10 flex flex-col gap-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total feedback" value="1,284" delta="+8.2% this week" positive />
        <StatCard label="% negative" value="27%" delta="+3.1pt vs last week" positive={false} />
        <StatCard label="New this week" value="148" delta="+12.4%" positive />
        <StatCard label="Themes tracked" value="6" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5">
          <div className="text-sm font-medium mb-4" style={{ color: "#F1F0F5" }}>Volume over time</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={VOLUME_DATA}>
              <defs>
                <linearGradient id="vol" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7C6FFF" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#7C6FFF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1D1D2B" vertical={false} />
              <XAxis dataKey="day" stroke="#8B899C" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#8B899C" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "#14141F", border: "1px solid #232336", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="items" stroke="#7C6FFF" strokeWidth={2} fill="url(#vol)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <div className="text-sm font-medium mb-4" style={{ color: "#F1F0F5" }}>Sentiment breakdown</div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={SENTIMENT_DATA} dataKey="value" nameKey="name" innerRadius={48} outerRadius={70} paddingAngle={3}>
                {SENTIMENT_DATA.map((d, i) => <Cell key={i} fill={d.color} stroke="none" />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#14141F", border: "1px solid #232336", borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {SENTIMENT_DATA.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs" style={{ color: "#8B899C" }}>
                <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                {d.name}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="text-sm font-medium mb-4" style={{ color: "#F1F0F5" }}>Top themes</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={THEME_DATA} layout="vertical" margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1D1D2B" horizontal={false} />
            <XAxis type="number" stroke="#8B899C" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="theme" stroke="#8B899C" fontSize={12} tickLine={false} axisLine={false} width={100} />
            <Tooltip contentStyle={{ background: "#14141F", border: "1px solid #232336", borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="count" fill="#7C6FFF" radius={[0, 6, 6, 0]} barSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

export function InboxView() {
  const [query, setQuery] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState("all");

  const rows = useMemo(() => {
    return FEEDBACK.filter((f) => {
      const matchesQuery = f.content.toLowerCase().includes(query.toLowerCase());
      const matchesSentiment = sentimentFilter === "all" || f.sentiment === sentimentFilter;
      return matchesQuery && matchesSentiment;
    });
  }, [query, sentimentFilter]);

  return (
    <div className="px-6 md:px-8 pb-10 flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2 flex-1"
          style={{ background: "#14141F", border: "1px solid #232336" }}
        >
          <Search size={16} color="#8B899C" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search feedback content..."
            className="bg-transparent outline-none text-sm w-full"
            style={{ color: "#F1F0F5" }}
          />
        </div>
        <div className="flex gap-2">
          {["all", "pos", "neu", "neg"].map((s) => (
            <button
              key={s}
              onClick={() => setSentimentFilter(s)}
              className="rounded-lg px-3 py-2 text-xs font-medium"
              style={{
                background: sentimentFilter === s ? "rgba(124,111,255,0.16)" : "#14141F",
                border: `1px solid ${sentimentFilter === s ? "#7C6FFF" : "#232336"}`,
                color: sentimentFilter === s ? "#B9AFFF" : "#8B899C",
              }}
            >
              {s === "all" ? "All" : SENT_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden">
        <div
          className="grid grid-cols-12 gap-2 px-5 py-3 text-xs font-medium uppercase tracking-wide"
          style={{ color: "#8B899C", borderBottom: "1px solid #232336" }}
        >
          <div className="col-span-5">Feedback</div>
          <div className="col-span-2">Channel</div>
          <div className="col-span-2">Theme</div>
          <div className="col-span-1">Sentiment</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1">Date</div>
        </div>
        {rows.map((f) => {
          const StatusIcon = STATUS_ICON[f.status];
          return (
            <div
              key={f.id}
              className="grid grid-cols-12 gap-2 px-5 py-3.5 text-sm items-center"
              style={{ borderBottom: "1px solid #1D1D2B" }}
            >
              <div className="col-span-5 pr-4" style={{ color: "#F1F0F5" }}>{f.content}</div>
              <div className="col-span-2 text-xs" style={{ color: "#8B899C" }}>{f.channel}</div>
              <div className="col-span-2">
                <Pill color="#B9AFFF" bg="rgba(124,111,255,0.12)">{f.theme}</Pill>
              </div>
              <div className="col-span-1">
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ background: SENT_COLOR[f.sentiment] }}
                  title={SENT_LABEL[f.sentiment]}
                />
              </div>
              <div className="col-span-1 flex items-center gap-1.5 text-xs" style={{ color: STATUS_COLOR[f.status] }}>
                <StatusIcon size={13} />
              </div>
              <div className="col-span-1 text-xs font-mono" style={{ color: "#8B899C" }}>{f.date}</div>
            </div>
          );
        })}
        {rows.length === 0 && (
          <div className="py-12 text-center text-sm" style={{ color: "#8B899C" }}>
            No feedback matches these filters.
          </div>
        )}
      </Card>
    </div>
  );
}

export function TrendsView() {
  const spiking = [
    { theme: "Onboarding", change: "+58%", up: true },
    { theme: "Billing", change: "+41%", up: true },
    { theme: "Support speed", change: "-12%", up: false },
  ];
  return (
    <div className="px-6 md:px-8 pb-10 flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {spiking.map((s) => (
          <Card key={s.theme} className="p-5">
            <div className="text-xs font-medium uppercase tracking-wide" style={{ color: "#8B899C" }}>{s.theme}</div>
            <div
              className="mt-2 flex items-center gap-1.5 text-2xl font-semibold"
              style={{ fontFamily: "'Space Grotesk', sans-serif", color: s.up ? "#FB7166" : "#2DD4BF" }}
            >
              {s.up ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
              {s.change}
            </div>
            <div className="mt-1 text-xs" style={{ color: "#8B899C" }}>vs. previous 7-day period</div>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <div className="text-sm font-medium mb-4" style={{ color: "#F1F0F5" }}>Theme volume over time</div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={TREND_DATA}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1D1D2B" vertical={false} />
            <XAxis dataKey="week" stroke="#8B899C" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#8B899C" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: "#14141F", border: "1px solid #232336", borderRadius: 8, fontSize: 12 }} />
            <Line type="monotone" dataKey="Onboarding" stroke="#7C6FFF" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Billing" stroke="#FB7166" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Mobile" stroke="#F5A623" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-3">
          {[["Onboarding", "#7C6FFF"], ["Billing", "#FB7166"], ["Mobile", "#F5A623"]].map(([label, color]) => (
            <div key={label} className="flex items-center gap-1.5 text-xs" style={{ color: "#8B899C" }}>
              <span className="w-2 h-2 rounded-full" style={{ background: color }} />
              {label}
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <div className="text-sm font-medium mb-4" style={{ color: "#F1F0F5" }}>Themes</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {THEME_DATA.map((t) => (
            <div
              key={t.theme}
              className="rounded-xl px-4 py-3 flex items-center justify-between"
              style={{ background: "#0F0F19", border: "1px solid #1D1D2B" }}
            >
              <span className="text-sm" style={{ color: "#F1F0F5" }}>{t.theme}</span>
              <span className="text-sm font-mono" style={{ color: "#8B899C" }}>{t.count}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function AskLoopView() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Ask me anything about your customer feedback, I'll answer only from what's actually been reported.",
      sources: [],
    },
  ]);
  const [input, setInput] = useState("");

  const canned = {
    onboarding: {
      text: "Onboarding is the most-mentioned pain point this month, largely around unclear setup steps and slow invite flows. 3 items reference this directly.",
      sources: [FEEDBACK[0], FEEDBACK[8], FEEDBACK[14]],
    },
    default: {
      text: "Based on the retrieved feedback, users are split: praise for the new dashboard and export tools, but recurring friction around billing pages and mobile stability. 3 items reference this directly.",
      sources: [FEEDBACK[1], FEEDBACK[5], FEEDBACK[7]],
    },
  };

  function send() {
    if (!input.trim()) return;
    const userMsg = { role: "user", text: input, sources: [] };
    const key = input.toLowerCase().includes("onboard") ? "onboarding" : "default";
    const reply = { role: "assistant", ...canned[key] };
    setMessages((m) => [...m, userMsg, reply]);
    setInput("");
  }

  return (
    <div className="px-6 md:px-8 pb-10 flex flex-col h-full">
      <Card className="flex-1 flex flex-col p-5" style={{ minHeight: 460 }}>
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto pb-2">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[75%]">
                <div
                  className="rounded-2xl px-4 py-3 text-sm"
                  style={{
                    background: m.role === "user" ? "#7C6FFF" : "#0F0F19",
                    color: m.role === "user" ? "#0A0A12" : "#F1F0F5",
                    border: m.role === "user" ? "none" : "1px solid #1D1D2B",
                  }}
                >
                  {m.text}
                </div>
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-2 flex flex-col gap-1.5">
                    {m.sources.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-start gap-2 rounded-lg px-3 py-2 text-xs"
                        style={{ background: "#0F0F19", border: "1px solid #1D1D2B", color: "#8B899C" }}
                      >
                        <Quote size={12} className="mt-0.5 shrink-0" color="#7C6FFF" />
                        <span>
                          <span className="font-mono" style={{ color: "#B9AFFF" }}>{s.id}</span> · {s.content}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: "1px solid #1D1D2B" }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="What are users saying about onboarding?"
            className="flex-1 bg-transparent outline-none text-sm px-2"
            style={{ color: "#F1F0F5" }}
          />
          <button
            onClick={send}
            className="rounded-lg p-2.5"
            style={{ background: "#7C6FFF", color: "#0A0A12" }}
          >
            <Send size={16} />
          </button>
        </div>
      </Card>
    </div>
  );
}

export function ReportsView() {
  return (
    <div className="px-6 md:px-8 pb-10 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="text-sm" style={{ color: "#8B899C" }}>Weekly Voice-of-Customer digests, generated from real feedback data.</div>
        <button
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
          style={{ background: "#7C6FFF", color: "#0A0A12" }}
        >
          <Plus size={15} /> Generate report
        </button>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide" style={{ color: "#8B899C" }}>Jul 21 – Jul 27, 2026</div>
            <h2
              className="text-xl font-semibold mt-1"
              style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#F1F0F5" }}
            >
              Voice of Customer — Week 30
            </h2>
          </div>
          <button
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium"
            style={{ background: "#0F0F19", border: "1px solid #232336", color: "#8B899C" }}
          >
            <Download size={13} /> Export
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
          <div>
            <div className="text-sm font-medium mb-2" style={{ color: "#F1F0F5" }}>Summary</div>
            <p className="text-sm leading-relaxed" style={{ color: "#8B899C" }}>
              Feedback volume rose 8% week-over-week. Onboarding friction is the fastest-growing
              theme, up 58% versus the prior period, driven by unclear invite flows. Billing
              complaints continue to climb alongside invoice-page timeouts. Sentiment on the new
              dashboard and export tools remains strongly positive.
            </p>
          </div>
          <div>
            <div className="text-sm font-medium mb-2" style={{ color: "#F1F0F5" }}>Recommended actions</div>
            <ul className="text-sm space-y-2" style={{ color: "#8B899C" }}>
              <li className="flex gap-2"><span style={{ color: "#7C6FFF" }}>—</span> Ship a redesigned invite flow before next sprint.</li>
              <li className="flex gap-2"><span style={{ color: "#7C6FFF" }}>—</span> Fix invoice-page timeout reported across 4 tickets.</li>
              <li className="flex gap-2"><span style={{ color: "#7C6FFF" }}>—</span> Prioritise SSO for pipeline deals citing it as a blocker.</li>
            </ul>
          </div>
        </div>

        <div className="mt-6">
          <div className="text-sm font-medium mb-3" style={{ color: "#F1F0F5" }}>Notable verbatim</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[FEEDBACK[0], FEEDBACK[6], FEEDBACK[11]].map((f) => (
              <div
                key={f.id}
                className="rounded-lg px-4 py-3 text-sm flex gap-2"
                style={{ background: "#0F0F19", border: "1px solid #1D1D2B", color: "#F1F0F5" }}
              >
                <Quote size={13} className="mt-0.5 shrink-0" color="#7C6FFF" />
                <span>{f.content}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="text-sm font-medium mb-3" style={{ color: "#F1F0F5" }}>Previous reports</div>
        {["Week 29 · Jul 14 – Jul 20", "Week 28 · Jul 07 – Jul 13", "Week 27 · Jun 30 – Jul 06"].map((r) => (
          <div
            key={r}
            className="flex items-center justify-between py-3 text-sm"
            style={{ borderTop: "1px solid #1D1D2B", color: "#8B899C" }}
          >
            {r}
            <FileText size={15} />
          </div>
        ))}
      </Card>
    </div>
  );
}
