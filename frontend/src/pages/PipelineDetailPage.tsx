import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { deletePipeline, getPipeline } from "../services/api";
import type { Pipeline } from "../types";
import ConfirmModal from "../components/ConfirmModal";
import LoadingState from "../components/LoadingState";

export default function PipelineDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [pipeline, setPipeline] = useState<Pipeline | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [confirmOpen, setConfirmOpen] = useState(false);

    useEffect(() => {
        if (!id) return;
        let cancelled = false;
        setLoading(true);
        getPipeline(id)
            .then((pl) => { if (!cancelled) setPipeline(pl); })
            .catch((err: Error) => { if (!cancelled) setError(err.message || "Error cargando pipeline"); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [id]);

    async function handleDelete() {
        if (!id) return;
        try {
            await deletePipeline(id);
            navigate("/pipelines");
        } catch (err) {
            setError((err as Error).message || "Error al eliminar pipeline");
            setConfirmOpen(false);
        }
    }

    function handleDuplicate() {
        if (!pipeline) return;
        navigate("/pipelines/new", {
            state: {
                name: `${pipeline.name} (copia)`,
                description: pipeline.description,
            },
        });
    }

    return (
        <main className="flex flex-col h-full overflow-hidden">
            {/* Top bar */}
            <div className="flex items-center justify-between border-b border-border bg-background px-6 py-4 shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate("/pipelines")}
                        className="rounded border border-border px-3 py-1.5 text-sm text-muted hover:bg-primary/30"
                    >
                        ← Volver
                    </button>
                    <h1 className="text-xl font-semibold text-text-logo">
                        {pipeline ? pipeline.name : "Pipeline"}
                    </h1>
                </div>

                {pipeline && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => navigate(`/pipelines/${id}/edit`)}
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
                    <LoadingState message="Cargando pipeline…" />
                ) : error ? (
                    <p className="rounded bg-error/20 px-3 py-2 text-sm text-error">{error}</p>
                ) : pipeline ? (
                    <div className="mx-auto max-w-2xl space-y-6">
                        <dl className="overflow-hidden rounded-xl border border-border">
                            {(
                                [
                                    ["ID", pipeline.id],
                                    ["Nombre", pipeline.name],
                                    ["Descripción", pipeline.description || "—"],
                                ] as [string, string][]
                            ).map(([label, value], i) => (
                                <div
                                    key={label}
                                    className={`flex gap-4 px-4 py-3 ${i % 2 === 0 ? "bg-primary/30" : "bg-primary/20"}`}
                                >
                                    <dt className="w-36 shrink-0 text-xs font-semibold uppercase tracking-wider text-muted">
                                        {label}
                                    </dt>
                                    <dd className={`text-sm text-text ${label === "ID" ? "font-mono" : ""}`}>
                                        {value}
                                    </dd>
                                </div>
                            ))}
                        </dl>

                        {/* Processors placeholder */}
                        <div className="rounded-xl border border-border/50 bg-surface p-4">
                            <p className="text-xs text-muted">
                                Los procesadores del pipeline se mostrarán aquí cuando el endpoint{" "}
                                <code className="font-mono">GET /pipelines/:id/processors</code> esté disponible.
                            </p>
                        </div>
                    </div>
                ) : null}
            </div>

            <ConfirmModal
                open={confirmOpen}
                title="Eliminar pipeline"
                message={`¿Seguro que quieres eliminar "${pipeline?.name}"? Esta acción no se puede deshacer.`}
                onConfirm={handleDelete}
                onCancel={() => setConfirmOpen(false)}
            />
        </main>
    );
}
