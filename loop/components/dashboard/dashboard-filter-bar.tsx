"use client";

import type { DashboardDateRange } from "@/types/dashboard";

const OPTIONS: { value: DashboardDateRange; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
];

type DashboardFilterBarProps = {
  value: DashboardDateRange;
  onChange: (value: DashboardDateRange) => void;
  disabled?: boolean;
};

export function DashboardFilterBar({ value, onChange, disabled }: DashboardFilterBarProps) {
  return (
    <div className="flex gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(option.value)}
          className={`rounded-lg px-3 py-1.5 text-sm font-bold transition disabled:opacity-50 ${
            value === option.value
              ? "bg-white text-loop-900 shadow-sm"
              : "text-slate-500 hover:text-loop-800"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
