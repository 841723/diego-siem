import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ConfirmModal from "../components/ConfirmModal";
import LoadingState from "../components/LoadingState";
import { deletePipeline, getPipelineFull } from "../services/api";
import type { FullPipeline } from "../types";

export default function PipelineDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [pipeline, setPipeline] = useState<FullPipeline | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [confirmOpen, setConfirmOpen] = useState(false);

    useEffect(() => {
        if (!id) return;
        let cancelled = false;
        setLoading(true);
        setError("");

        getPipelineFull(id)
            .then((full) => {
                if (!cancelled) setPipeline(full);
            })
            .catch((err: Error) => {
                if (!cancelled) {
                    setError(err.message || "Error cargando pipeline");
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
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
                name: `${pipeline.pipeline.name} (copia)`,
                description: pipeline.pipeline.description,
                fromPipelineId: pipeline.pipeline.id,
            },
        });
    }

    return (
        <main className="flex h-full flex-col overflow-hidden">
            <div className="shrink-0 border-b border-border bg-background px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate("/pipelines")}
                            className="rounded border border-border px-3 py-1.5 text-sm text-muted hover:bg-primary/30"
                        >
                            ← Volver
                        </button>
                        <h1 className="text-xl font-semibold text-text-logo">
                            {pipeline ? pipeline.pipeline.name : "Pipeline"}
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
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                {loading ? (
                    <LoadingState message="Cargando pipeline…" />
                ) : error ? (
                    <p className="rounded bg-error/20 px-3 py-2 text-sm text-error">
                        {error}
                    </p>
                ) : pipeline ? (
                    <div className="mx-auto max-w-3xl space-y-6">
                        <dl className="overflow-hidden rounded-xl border border-border">
                            {(
                                [
                                    ["ID", pipeline.pipeline.id],
                                    ["Nombre", pipeline.pipeline.name],
                                    [
                                        "Descripción",
                                        pipeline.pipeline.description || "—",
                                    ],
                                ] as [string, string][]
                            ).map(([label, value], index) => (
                                <div
                                    key={label}
                                    className={`flex gap-4 px-4 py-3 ${index % 2 === 0 ? "bg-primary/30" : "bg-primary/20"}`}
                                >
                                    <dt className="w-36 shrink-0 text-xs font-semibold uppercase tracking-wider text-muted">
                                        {label}
                                    </dt>
                                    <dd
                                        className={`text-sm text-text ${label === "ID" ? "font-mono" : ""}`}
                                    >
                                        {value}
                                    </dd>
                                </div>
                            ))}
                        </dl>

                        <div className="rounded-xl border border-border bg-surface/60 p-4">
                            <div className="mb-3 flex items-center justify-between">
                                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
                                    Flujo de procesadores
                                </h2>
                                <span className="text-xs text-muted">
                                    {pipeline.processors.length} total
                                </span>
                            </div>

                            {pipeline.processors.length === 0 ? (
                                <p className="text-sm text-muted">
                                    Este pipeline no tiene procesadores
                                    configurados.
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {pipeline.processors.map((item, index) => (
                                        <div key={item.id}>
                                            <div className="rounded border border-border bg-surface p-3">
                                                <div className="mb-1 flex items-center gap-2">
                                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-xs text-muted">
                                                        {index + 1}
                                                    </span>
                                                    <span className="text-sm font-semibold text-text">
                                                        {item.processor?.name ??
                                                            item.processorid}
                                                    </span>
                                                </div>
                                                <pre className="overflow-auto rounded bg-primary/20 p-2 text-xs text-text">
                                                    {JSON.stringify(
                                                        item.config,
                                                        null,
                                                        2,
                                                    )}
                                                </pre>
                                            </div>
                                            {index <
                                                pipeline.processors.length - 1 && (
                                                <div className="py-1 text-center text-xs text-muted/70">
                                                    ↓
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ) : null}
            </div>

            <ConfirmModal
                open={confirmOpen}
                title="Eliminar pipeline"
                message={`¿Seguro que quieres eliminar "${pipeline?.pipeline.name}"? Esta acción no se puede deshacer.`}
                onConfirm={handleDelete}
                onCancel={() => setConfirmOpen(false)}
            />
        </main>
    );
}
