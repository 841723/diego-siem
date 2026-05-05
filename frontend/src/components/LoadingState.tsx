export default function LoadingState({ message = "Cargando…" }: { message?: string }) {
    return (
        <div className="flex items-center justify-center gap-3 rounded-xl bg-primary py-16">
            <svg
                className="h-6 w-6 animate-spin text-muted"
                fill="none"
                viewBox="0 0 24 24"
            >
                <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                />
                <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                />
            </svg>
            <span className="text-sm text-muted">{message}</span>
        </div>
    );
}
