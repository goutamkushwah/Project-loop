
"use client";

type ThemeCardProps = {
  id: string;
  name: string;
  description: string;
  color: string;
  count: number;
  onClick: (id: string) => void;
};

export function ThemeCard({
  id,
  name,
  description,
  color,
  count,
  onClick,
}: ThemeCardProps) {
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      className="w-full rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: color }}
          />

          <h3 className="font-semibold text-slate-900">
            {name}
          </h3>
        </div>

        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
          {count}
        </span>
      </div>

      <p className="mt-3 line-clamp-2 text-sm text-slate-500">
        {description}
      </p>

      <div className="mt-4 text-sm font-medium text-indigo-600">
        View feedback →
      </div>
    </button>
  );
}
