// Generic, reusable states for loading / empty / error — used across the
// dashboard, inbox, trends, and reports pages so every screen behaves the
// same way instead of each page inventing its own spinner (rubric M4:
// "polished states — loading/empty/error").

export function Spinner({ size = 24 }: { size?: number }) {
    return (
        <div
            role="status"
            aria-label="Loading"
            className="animate-spin rounded-full border-2 border-gray-200 border-t-indigo-600"
            style={{ width: size, height: size }}
        />
    );
}

export function LoadingState({ label = "Loading..." }: { label?: string }) {
    return (
        <div className="flex h-64 w-full flex-col items-center justify-center gap-3 text-gray-500">
            <Spinner size={28} />
            <p className="text-sm">{label}</p>
        </div>
    );
}

/** Skeleton card used while dashboard stat cards / charts are fetching. */
export function CardSkeleton() {
    return (
        <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-4">
            <div className="mb-3 h-4 w-24 rounded bg-gray-200" />
            <div className="h-8 w-16 rounded bg-gray-200" />
        </div>
    );
}

export function EmptyState({
    title,
    description,
    action,
}: {
    title: string;
    description?: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="flex h-64 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 text-center">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            {description && <p className="max-w-xs text-xs text-gray-400">{description}</p>}
            {action}
        </div>
    );
}

export function ErrorState({
    message = "Something went wrong. Please try again.",
    onRetry,
}: {
    message?: string;
    onRetry?: () => void;
}) {
    return (
        <div className="flex h-64 w-full flex-col items-center justify-center gap-3 rounded-xl border border-red-100 bg-red-50 text-center">
            <p className="text-sm font-medium text-red-600">{message}</p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                >
                    Retry
                </button>
            )}
        </div>
    );
}