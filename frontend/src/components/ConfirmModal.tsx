type Props = {
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
};

export default function ConfirmModal({
    open,
    title,
    message,
    confirmLabel = "Eliminar",
    onConfirm,
    onCancel,
}: Props) {
    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={onCancel}
        >
            <div
                className="w-full max-w-md rounded-2xl border border-border bg-secondary p-6 shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="mb-2 text-lg font-semibold text-text-logo">{title}</h2>
                <p className="mb-6 text-sm text-muted">{message}</p>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="rounded border border-border px-4 py-2 text-sm text-muted hover:bg-primary/30"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        className="rounded bg-error px-4 py-2 text-sm font-semibold text-white hover:bg-error/80"
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
