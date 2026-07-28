"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { FONTS } from "@/components/ui";
import {
  Sidebar, TopBar, NAV_ITEMS, DashboardView, InboxView, TrendsView,
  AskLoopView, ReportsView,
} from "@/components/views";

export function DashboardApp({ session }) {
  const [active, setActive] = useState("dashboard");

  const titles = {
    dashboard: ["Dashboard", "Your feedback, at a glance"],
    inbox: ["Inbox", "Search, filter, and triage every item"],
    trends: ["Trends", "What's growing, what's fading"],
    ask: ["Ask LOOP", "Plain-English answers, grounded in real feedback"],
    reports: ["Reports", "Voice-of-Customer digests, ready to share"],
  };

  const views = {
    dashboard: <DashboardView />,
    inbox: <InboxView />,
    trends: <TrendsView />,
    ask: <AskLoopView />,
    reports: <ReportsView />,
  };

  const initials = (session?.user?.name || "U")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="w-full min-h-screen flex" style={{ background: "#0A0A12" }}>
      <style>{FONTS}</style>
      <div style={{ fontFamily: "'Inter', sans-serif" }} className="w-full flex">
        <Sidebar active={active} setActive={setActive} workspaceName={session?.user?.workspace} />
        <div className="flex-1 flex flex-col overflow-x-hidden">
          <div className="flex justify-end px-6 md:px-8 pt-4">
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-xs font-medium"
              style={{ color: "#8B899C" }}
            >
              Log out
            </button>
          </div>
          {/* mobile nav */}
          <div className="flex md:hidden gap-1 px-4 pt-4 overflow-x-auto">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = active === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActive(item.id)}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium whitespace-nowrap"
                  style={{
                    background: isActive ? "rgba(124,111,255,0.14)" : "transparent",
                    color: isActive ? "#B9AFFF" : "#8B899C",
                  }}
                >
                  <Icon size={14} /> {item.label}
                </button>
              );
            })}
          </div>
          <TopBar title={titles[active][0]} subtitle={titles[active][1]} initials={initials} />
          {views[active]}
        </div>
      </div>
    </div>
  );
}
