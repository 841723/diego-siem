import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { deleteSource, getSource } from "../services/api";
import type { SourceConfig } from "../types";
import ConfirmModal from "../components/ConfirmModal";
import LoadingState from "../components/LoadingState";

export default function SourceDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [source, setSource] = useState<SourceConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [confirmOpen, setConfirmOpen] = useState(false);

    useEffect(() => {
        if (!id) return;
        let cancelled = false;
        setLoading(true);
        getSource(id)
            .then((src) => { if (!cancelled) setSource(src); })
            .catch((err: Error) => { if (!cancelled) setError(err.message || "Error cargando fuente"); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [id]);

    async function handleDelete() {
        if (!id) return;
        try {
            await deleteSource(id);
            navigate("/sources");
        } catch (err) {
            setError((err as Error).message || "Error al eliminar fuente");
            setConfirmOpen(false);
        }
    }

    function handleDuplicate() {
        if (!source) return;
        const { id: _id, ...rest } = source;
        navigate("/sources/new", {
            state: { ...rest, name: `${rest.name} (copia)` },
        });
    }

    return (
        <main className="flex flex-col h-full overflow-hidden">
            {/* Top bar */}
            <div className="flex items-center justify-between border-b border-border bg-background px-6 py-4 shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate("/sources")}
                        className="rounded border border-border px-3 py-1.5 text-sm text-muted hover:bg-primary/30"
                    >
                        ← Volver
                    </button>
                    <h1 className="text-xl font-semibold text-text-logo">
                        {source ? source.name : "Fuente"}
                    </h1>
                </div>

                {source && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => navigate(`/sources/${id}/edit`)}
                            className="rounded border border-border px-3 py-1.5 text-sm text-muted hover:bg-primary/30"
                        >
                            Editar
                        </button>
                        <button
                            onClick={handleDuplicate}
                            className="rounded border border-border px-3 py-1.5 text-sm text-muted hover:bg-primary/30"
                        >
                            Duplicar
                        </button>
                        <button
                            onClick={() => setConfirmOpen(true)}
                            className="rounded border border-error/50 px-3 py-1.5 text-sm text-error hover:bg-error/10"
                        >
                            Eliminar
                        </button>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {loading ? (
                    <LoadingState message="Cargando fuente…" />
                ) : error ? (
                    <p className="rounded bg-error/20 px-3 py-2 text-sm text-error">{error}</p>
                ) : source ? (
                    <div className="mx-auto max-w-lg space-y-4">
                        <dl className="overflow-hidden rounded-xl border border-border">
                            {(
                                [
                                    ["ID", String(source.id)],
                                    ["Nombre", source.name],
                                    ["Puerto", String(source.port)],
                                    ["Protocolo", source.protocol],
                                    ["Parser", source.parser],
                                    ["Pipeline ID", String(source.pipelineid)],
                                ] as [string, string][]
                            ).map(([label, value], i) => (
                                <div
                                    key={label}
                                    className={`flex gap-4 px-4 py-3 ${i % 2 === 0 ? "bg-primary/30" : "bg-primary/20"}`}
                                >
                                    <dt className="w-32 shrink-0 text-xs font-semibold uppercase tracking-wider text-muted">
                                        {label}
                                    </dt>
                                    <dd className="font-mono text-sm text-text">{value}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                ) : null}
            </div>

            <ConfirmModal
                open={confirmOpen}
                title="Eliminar fuente"
                message={`¿Seguro que quieres eliminar "${source?.name}"? Esta acción no se puede deshacer.`}
                onConfirm={handleDelete}
                onCancel={() => setConfirmOpen(false)}
            />
        </main>
    );
}
