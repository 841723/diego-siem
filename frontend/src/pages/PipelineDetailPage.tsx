import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ConfirmModal from "../components/ConfirmModal";
import LoadingState from "../components/LoadingState";
import { usePipelineProcessors } from "../hooks/usePipelineProcessors";
import { useProcessors } from "../hooks/useProcessors";
import { deletePipeline, getPipeline } from "../services/api";
import type { Pipeline, PipelineProcessorDraft } from "../types";

export default function PipelineDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [pipeline, setPipeline] = useState<Pipeline | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [confirmOpen, setConfirmOpen] = useState(false);

    const { processors, loading: processorsLoading, error: processorsError } =
        usePipelineProcessors(id);
    const { processors: definitions } = useProcessors();

    const processorsForDuplicate = useMemo<PipelineProcessorDraft[]>(
        () =>
            processors.map((processor) => ({
                type: processor.type,
                config: processor.config,
            })),
        [processors],
    );

    useEffect(() => {
        if (!id) return;
        let cancelled = false;
        setLoading(true);
        getPipeline(id)
            .then((item) => {
                if (!cancelled) setPipeline(item);
            })
            .catch((err: Error) => {
                if (!cancelled) setError(err.message || "Error cargando pipeline");
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
                name: `${pipeline.name} (copia)`,
                description: pipeline.description,
                processors: processorsForDuplicate,
            },
        });
    }

    function renderProcessorTypeLabel(type: string): string {
        const definition = definitions.find((item) => item.id === type);
        return definition?.name ?? type;
    }

    return (
        <main className="flex h-full flex-col overflow-hidden">
            <div className="flex shrink-0 items-center justify-between border-b border-border bg-background px-6 py-4">
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
                {pipeline ? (
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
                ) : null}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                {loading ? (
                    <LoadingState message="Cargando pipeline…" />
                ) : error ? (
                    <p className="rounded bg-error/20 px-3 py-2 text-sm text-error">{error}</p>
                ) : pipeline ? (
                    <div className="mx-auto max-w-3xl space-y-6">
                        <dl className="overflow-hidden rounded-xl border border-border">
                            {(
                                [
                                    ["ID", pipeline.id],
                                    ["Nombre", pipeline.name],
                                    ["Descripción", pipeline.description || "—"],
                                ] as [string, string][]
                            ).map(([label, value], index) => (
                                <div
                                    key={label}
                                    className={`flex gap-4 px-4 py-3 ${index % 2 === 0 ? "bg-primary/30" : "bg-primary/20"}`}
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

                        <section className="space-y-2">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
                                    Flujo de procesadores
                                </h2>
                                <button
                                    onClick={() => navigate(`/pipelines/${id}/edit`)}
                                    className="rounded border border-border px-2 py-0.5 text-xs text-muted hover:bg-primary/30"
                                >
                                    Editar flujo
                                </button>
                            </div>

                            {processorsError ? (
                                <p className="rounded bg-error/20 px-3 py-2 text-sm text-error">
                                    {processorsError}
                                </p>
                            ) : null}

                            {processorsLoading ? (
                                <LoadingState message="Cargando procesadores…" />
                            ) : processors.length === 0 ? (
                                <p className="rounded border border-border/70 p-3 text-sm text-muted">
                                    Este pipeline no tiene procesadores.
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {processors.map((processor, index) => (
                                        <div
                                            key={processor.id}
                                            className="space-y-2 rounded border border-border bg-surface p-3"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary font-mono text-xs text-muted">
                                                    {index + 1}
                                                </span>
                                                <strong className="text-sm text-text">
                                                    {renderProcessorTypeLabel(processor.type)}
                                                </strong>
                                            </div>
                                            <pre className="overflow-x-auto rounded bg-primary/20 p-2 text-xs text-text">
                                                {JSON.stringify(processor.config, null, 2)}
                                            </pre>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
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
