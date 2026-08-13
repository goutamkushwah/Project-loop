
"use client";

import { useState } from "react";

import { ThemeDrilldown } from "@/components/feedback/theme-drilldown";
import { ThemeList } from "@/components/feedback/theme-list";

export default function ThemesPage() {
  const [selectedThemeId, setSelectedThemeId] =
    useState<string | null>(null);

  if (selectedThemeId) {
    return (
      <main className="min-h-screen bg-white px-6 py-8">
        <div className="mx-auto max-w-7xl">
          <ThemeDrilldown
            themeId={selectedThemeId}
            onBack={() => setSelectedThemeId(null)}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-sm font-medium text-indigo-600">
            AI Feedback Intelligence
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Theme Clustering
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Explore customer feedback grouped into AI-generated
            themes.
          </p>
        </div>

        <ThemeList
          onSelectTheme={setSelectedThemeId}
        />
      </div>
    </main>
  );
}
