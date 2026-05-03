import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { createPipeline, getPipeline, updatePipeline } from "../services/api";
import { useProcessors } from "../hooks/useProcessors";
import type { Pipeline, PipelineProcessorDraft, ProcessorDefinition } from "../types";
import LoadingState from "../components/LoadingState";

// ── Helpers ───────────────────────────────────────────────────────────────────

function emptyConfigFor(def: ProcessorDefinition): Record<string, unknown> {
    const cfg: Record<string, unknown> = {};
    for (const [key, type] of Object.entries(def.config)) {
        cfg[key] = type === "number" ? 0 : type === "boolean" ? false : "";
    }
    return cfg;
}

// ── Processor row component ───────────────────────────────────────────────────

type ProcessorRowProps = {
    index: number;
    draft: PipelineProcessorDraft;
    definitions: ProcessorDefinition[];
    canRemove: boolean;
    onTypeChange: (type: string) => void;
    onConfigChange: (config: Record<string, unknown>) => void;
    onRemove: () => void;
};

function ProcessorRow({
    index,
    draft,
    definitions,
    canRemove,
    onTypeChange,
    onConfigChange,
    onRemove,
}: ProcessorRowProps) {
    const def = definitions.find((d) => d.id === draft.type) ?? definitions[0];
    const configKeys = def ? Object.entries(def.config) : [];

    function handleTypeChange(newType: string) {
        const newDef = definitions.find((d) => d.id === newType);
        onConfigChange(newDef ? emptyConfigFor(newDef) : {});
        onTypeChange(newType);
    }

    function handleFieldChange(key: string, value: unknown) {
        onConfigChange({ ...draft.config, [key]: value });
    }

    return (
        <div className="rounded border border-border bg-surface p-3 space-y-3">
            <div className="flex items-center gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary font-mono text-xs text-muted">
                    {index + 1}
                </span>

                <div className="flex-1 space-y-1">
                    <label className="block text-xs text-muted">Tipo de procesador</label>
                    <select
                        className="w-full rounded border border-border bg-surface px-2 py-1 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
                        value={draft.type}
                        onChange={(e) => handleTypeChange(e.target.value)}
                    >
                        {definitions.map((d) => (
                            <option key={d.id} value={d.id}>
                                {d.name}
                                {d.description ? ` — ${d.description}` : ""}
                            </option>
                        ))}
                    </select>
                </div>

                <button
                    type="button"
                    onClick={onRemove}
                    disabled={!canRemove}
                    className="mt-4 rounded px-2 py-0.5 text-xs text-error hover:bg-error/10 disabled:opacity-30"
                    title="Eliminar procesador"
                >
                    ✕
                </button>
            </div>

            {/* Dynamic config fields */}
            {configKeys.length > 0 && (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 pl-8">
                    {configKeys.map(([key, fieldType]) => (
                        <div key={key} className="space-y-0.5">
                            <label className="block text-xs text-muted">{key}</label>
                            {fieldType === "boolean" ? (
                                <input
                                    type="checkbox"
                                    className="h-4 w-4 accent-accent"
                                    checked={Boolean(draft.config[key] ?? false)}
                                    onChange={(e) => handleFieldChange(key, e.target.checked)}
                                />
                            ) : (
                                <input
                                    type={fieldType === "number" ? "number" : "text"}
                                    className="w-full rounded border border-border bg-surface px-2 py-1 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
                                    value={String(draft.config[key] ?? "")}
                                    onChange={(e) =>
                                        handleFieldChange(
                                            key,
                                            fieldType === "number"
                                                ? Number(e.target.value)
                                                : e.target.value,
                                        )
                                    }
                                    placeholder={key}
                                />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Main form ─────────────────────────────────────────────────────────────────

export default function PipelineFormPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    const isEdit = Boolean(id);
    const prefill = location.state as Partial<Pick<Pipeline, "name" | "description">> | null;

    const { processors: processorDefs, loading: defsLoading, usingFallback } = useProcessors();

    const [name, setName] = useState(prefill?.name ?? "");
    const [description, setDescription] = useState(prefill?.description ?? "");
    const [drafts, setDrafts] = useState<PipelineProcessorDraft[]>([]);
    const [loadingItem, setLoadingItem] = useState(isEdit);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Once processor definitions are loaded, initialise the drafts list
    const defaultDraft = useMemo<PipelineProcessorDraft | null>(() => {
        if (processorDefs.length === 0) return null;
        return { type: processorDefs[0].id, config: emptyConfigFor(processorDefs[0]) };
    }, [processorDefs]);

    useEffect(() => {
        if (!isEdit || !id) return;
        let cancelled = false;
        setLoadingItem(true);
        getPipeline(id)
            .then((pl) => {
                if (!cancelled) {
                    setName(pl.name);
                    setDescription(pl.description ?? "");
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

    // Seed one empty processor row once definitions are ready
    useEffect(() => {
        if (!defsLoading && defaultDraft && drafts.length === 0) {
            setDrafts([defaultDraft]);
        }
    }, [defsLoading, defaultDraft, drafts.length]);

    function addProcessor() {
        if (!defaultDraft) return;
        setDrafts((prev) => [...prev, { ...defaultDraft, config: { ...defaultDraft.config } }]);
    }

    function removeProcessor(index: number) {
        setDrafts((prev) => prev.filter((_, i) => i !== index));
    }

    function updateType(index: number, type: string) {
        setDrafts((prev) =>
            prev.map((d, i) => (i === index ? { ...d, type } : d)),
        );
    }

    function updateConfig(index: number, config: Record<string, unknown>) {
        setDrafts((prev) =>
            prev.map((d, i) => (i === index ? { ...d, config } : d)),
        );
    }

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");
        setSubmitting(true);

        try {
            if (isEdit && id) {
                await updatePipeline(id, { name, description });
            } else {
                await createPipeline({ name, description });
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

                        {/* Name */}
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

                        {/* Description */}
                        <div className="space-y-1">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                                Descripción
                            </label>
                            <textarea
                                className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent"
                                rows={2}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe qué hace este pipeline…"
                            />
                        </div>

                        {/* Processors */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="block text-xs font-semibold uppercase tracking-wider text-muted">
                                        Procesadores (en orden)
                                    </span>
                                    {usingFallback && (
                                        <span className="text-xs text-muted/70">
                                            Tipos por defecto — <code className="font-mono">GET /processors</code> no disponible
                                        </span>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={addProcessor}
                                    disabled={defsLoading || processorDefs.length === 0}
                                    className="rounded border border-border px-2 py-0.5 text-xs text-muted hover:bg-primary/30 disabled:opacity-40"
                                >
                                    + Añadir procesador
                                </button>
                            </div>

                            {defsLoading ? (
                                <p className="text-xs text-muted">Cargando tipos de procesadores…</p>
                            ) : (
                                <div className="space-y-2">
                                    {drafts.map((draft, idx) => (
                                        <ProcessorRow
                                            key={idx}
                                            index={idx}
                                            draft={draft}
                                            definitions={processorDefs}
                                            canRemove={drafts.length > 1}
                                            onTypeChange={(type) => updateType(idx, type)}
                                            onConfigChange={(cfg) => updateConfig(idx, cfg)}
                                            onRemove={() => removeProcessor(idx)}
                                        />
                                    ))}
                                </div>
                            )}

                            <p className="text-xs text-muted/60">
                                Los procesadores se persistirán cuando el endpoint{" "}
                                <code className="font-mono">POST /pipelines/:id/processors</code> esté disponible.
                            </p>
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
