"use client";

import { useEffect, useState } from "react";

import { ThemeCard } from "@/components/feedback/theme-card";

type Theme = {
  id: string;
  name: string;
  description: string;
  color: string;
  count: number;
};

type ThemeListProps = {
  onSelectTheme: (themeId: string) => void;
};

export function ThemeList({
  onSelectTheme,
}: ThemeListProps) {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadThemes() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/feedback/themes",
          {
            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error("Failed to load themes");
        }

        const data = await response.json();

        setThemes(data.themes ?? []);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load themes",
        );
      } finally {
        setLoading(false);
      }
    }

    loadThemes();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-40 animate-pulse rounded-2xl bg-slate-200"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (themes.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <h3 className="font-semibold text-slate-900">
          No themes yet
        </h3>

        <p className="mt-2 text-sm text-slate-500">
          Classify some feedback to start building themes.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {themes.map((theme) => (
        <ThemeCard
          key={theme.id}
          {...theme}
          onClick={onSelectTheme}
        />
      ))}
    </div>
  );
}