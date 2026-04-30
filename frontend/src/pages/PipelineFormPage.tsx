import { type FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { createPipeline, getPipeline, updatePipeline } from "../services/api";
import type { Pipeline, Processor, ProcessorType } from "../types";
import LoadingState from "../components/LoadingState";

const PROCESSOR_TYPES: ProcessorType[] = [
    "set",
    "drop",
    "copy",
    "call_pipeline",
    "rename",
    "lowercase",
    "uppercase",
];

const EMPTY_PROCESSOR: Processor = { type: "set", config: {} };

function configToText(config: Record<string, unknown>): string {
    if (Object.keys(config).length === 0) return "{}";
    return JSON.stringify(config, null, 2);
}

export default function PipelineFormPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    const isEdit = Boolean(id);
    const prefill = location.state as Partial<Omit<Pipeline, "id">> | null;

    const [name, setName] = useState(prefill?.name ?? "");
    const [processors, setProcessors] = useState<Processor[]>(
        prefill?.processors ?? [{ ...EMPTY_PROCESSOR }],
    );
    const [configTexts, setConfigTexts] = useState<string[]>(
        prefill?.processors?.map((p) => configToText(p.config)) ?? ["{}"],
    );
    const [loadingItem, setLoadingItem] = useState(isEdit);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!isEdit || !id) return;
        let cancelled = false;
        setLoadingItem(true);
        getPipeline(Number(id))
            .then((pl) => {
                if (!cancelled) {
                    setName(pl.name);
                    const procs = pl.processors.length > 0 ? pl.processors : [{ ...EMPTY_PROCESSOR }];
                    setProcessors(procs);
                    setConfigTexts(procs.map((p) => configToText(p.config)));
                }
            })
            .catch((err: Error) => {
                if (!cancelled) setError(err.message || "Error cargando pipeline");
            })
            .finally(() => {
                if (!cancelled) setLoadingItem(false);
            });
        return () => { cancelled = true; };
    }, [id, isEdit]);

    function addProcessor() {
        setProcessors((prev) => [...prev, { ...EMPTY_PROCESSOR }]);
        setConfigTexts((prev) => [...prev, "{}"]);
    }

    function removeProcessor(index: number) {
        setProcessors((prev) => prev.filter((_, i) => i !== index));
        setConfigTexts((prev) => prev.filter((_, i) => i !== index));
    }

    function updateProcessorType(index: number, type: ProcessorType) {
        setProcessors((prev) => prev.map((p, i) => (i === index ? { ...p, type } : p)));
    }

    function updateConfigText(index: number, text: string) {
        setConfigTexts((prev) => prev.map((t, i) => (i === index ? text : t)));
    }

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");

        const parsedProcessors: Processor[] = [];
        for (let i = 0; i < processors.length; i++) {
            try {
                const config = JSON.parse(configTexts[i] || "{}") as Record<string, unknown>;
                parsedProcessors.push({ type: processors[i].type, config });
            } catch {
                setError(`El config del procesador ${i + 1} no es JSON válido.`);
                return;
            }
        }

        setSubmitting(true);
        try {
            if (isEdit && id) {
                await updatePipeline(Number(id), { name, processors: parsedProcessors });
            } else {
                await createPipeline({ name, processors: parsedProcessors });
            }
            navigate("/pipelines");
        } catch (err) {
            setError((err as Error).message || "Error al guardar pipeline");
        } finally {
            setSubmitting(false);
        }
    }

    if (loadingItem) return <LoadingState message="Cargando pipeline…" />;

    return (
        <main className="flex flex-col h-full overflow-hidden">
            {/* Top bar */}
            <div className="flex items-center gap-4 border-b border-border bg-background px-6 py-4 shrink-0">
                <button
                    onClick={() => navigate("/pipelines")}
                    className="rounded border border-border px-3 py-1.5 text-sm text-muted hover:bg-primary/30"
                >
                    ← Volver
                </button>
                <h1 className="text-xl font-semibold text-text-logo">
                    {isEdit ? "Editar pipeline" : prefill ? "Duplicar pipeline" : "Nuevo pipeline"}
                </h1>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="mx-auto max-w-2xl">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                                Nombre
                            </label>
                            <input
                                className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="ej. syslog-normalize"
                                required
                            />
                        </div>

                        {/* Processors editor */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                                    Procesadores (en orden)
                                </label>
                                <button
                                    type="button"
                                    onClick={addProcessor}
                                    className="rounded border border-border px-2 py-0.5 text-xs text-muted hover:bg-primary/30"
                                >
                                    + Añadir procesador
                                </button>
                            </div>

                            <div className="space-y-2">
                                {processors.map((proc, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-start gap-3 rounded border border-border bg-surface p-3"
                                    >
                                        <span className="mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary font-mono text-xs text-muted">
                                            {idx + 1}
                                        </span>

                                        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                                            <div className="space-y-1 sm:w-40">
                                                <label className="block text-xs text-muted">Tipo</label>
                                                <select
                                                    className="w-full rounded border border-border bg-surface px-2 py-1 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
                                                    value={proc.type}
                                                    onChange={(e) =>
                                                        updateProcessorType(idx, e.target.value as ProcessorType)
                                                    }
                                                >
                                                    {PROCESSOR_TYPES.map((t) => (
                                                        <option key={t} value={t}>{t}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="flex-1 space-y-1">
                                                <label className="block text-xs text-muted">
                                                    Config (JSON)
                                                </label>
                                                <textarea
                                                    className="h-16 w-full rounded border border-border bg-surface px-2 py-1 font-mono text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
                                                    value={configTexts[idx]}
                                                    onChange={(e) => updateConfigText(idx, e.target.value)}
                                                    placeholder='{"field": "host", "value": "unknown"}'
                                                />
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => removeProcessor(idx)}
                                            disabled={processors.length === 1}
                                            className="mt-1 rounded px-2 py-0.5 text-xs text-error hover:bg-error/10 disabled:opacity-30"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {error && (
                            <p className="rounded bg-error/20 px-3 py-2 text-sm text-error">
                                {error}
                            </p>
                        )}

                        <div className="flex gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="rounded bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent/80 disabled:opacity-50"
                            >
                                {submitting ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear pipeline"}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate("/pipelines")}
                                className="rounded border border-border px-5 py-2 text-sm text-muted hover:bg-primary/30"
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    );
}
