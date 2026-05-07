import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useProcessors } from "../hooks/useProcessors";
import {
    createPipeline,
    createPipelineProcessor,
    getPipelineFull,
    getPipelineProcessors,
    updatePipeline,
    deletePipelineProcessor,
} from "../services/api";
import type { Pipeline, PipelineProcessorDraft, ProcessorDefinition } from "../types";
import LoadingState from "../components/LoadingState";

type PipelineFormPrefill = Partial<Pick<Pipeline, "name" | "description">> & {
    fromPipelineId?: string;
};

function isBooleanType(value: unknown): boolean {
    return String(value).toLowerCase() === "boolean";
}

function isNumericType(value: unknown): boolean {
    const type = String(value).toLowerCase();
    return ["number", "int", "float", "decimal"].includes(type);
}

function isArrayType(value: unknown): boolean {
    return Array.isArray(value);
}

function emptyConfigFor(def: ProcessorDefinition): Record<string, unknown> {
    const cfg: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(def.schema)) {
        if (isArrayType(value)) {
            cfg[key] = [];
            continue;
        }
        if (isBooleanType(value)) {
            cfg[key] = false;
            continue;
        }
        if (isNumericType(value)) {
            cfg[key] = 0;
            continue;
        }
        cfg[key] = "";
    }
    return cfg;
}

type ProcessorRowProps = {
    index: number;
    draft: PipelineProcessorDraft;
    definitions: ProcessorDefinition[];
    canRemove: boolean;
    canMoveUp: boolean;
    canMoveDown: boolean;
    onTypeChange: (processorId: string) => void;
    onConfigChange: (config: Record<string, unknown>) => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onRemove: () => void;
};

function ProcessorRow({
    index,
    draft,
    definitions,
    canRemove,
    canMoveUp,
    canMoveDown,
    onTypeChange,
    onConfigChange,
    onMoveUp,
    onMoveDown,
    onRemove,
}: ProcessorRowProps) {
    const def =
        definitions.find((candidate) => candidate.id === draft.processorId) ??
        definitions[0];
    const schemaEntries = def ? Object.entries(def.schema) : [];

    function handleTypeChange(newType: string) {
        const nextDef = definitions.find((candidate) => candidate.id === newType);
        onConfigChange(nextDef ? emptyConfigFor(nextDef) : {});
        onTypeChange(newType);
    }

    function updateField(key: string, value: unknown) {
        onConfigChange({ ...draft.config, [key]: value });
    }

    return (
        <div className="rounded border border-border bg-surface/80 p-3">
            <div className="flex items-end gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary font-mono text-xs text-muted">
                    {index + 1}
                </span>

                <div className="flex-1 space-y-1">
                    <label className="block text-xs text-muted">
                        Tipo de procesador
                    </label>
                    <select
                        className="w-full rounded border border-border bg-surface px-2 py-1 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
                        value={draft.processorId}
                        onChange={(event) => handleTypeChange(event.target.value)}
                    >
                        {definitions.map((item) => (
                            <option key={item.id} value={item.id}>
                                {item.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mb-0.5 flex gap-1">
                    <button
                        type="button"
                        onClick={onMoveUp}
                        disabled={!canMoveUp}
                        className="rounded border border-border px-2 py-0.5 text-xs text-muted hover:bg-primary/30 disabled:opacity-40"
                        title="Mover arriba"
                    >
                        ↑
                    </button>
                    <button
                        type="button"
                        onClick={onMoveDown}
                        disabled={!canMoveDown}
                        className="rounded border border-border px-2 py-0.5 text-xs text-muted hover:bg-primary/30 disabled:opacity-40"
                        title="Mover abajo"
                    >
                        ↓
                    </button>
                    <button
                        type="button"
                        onClick={onRemove}
                        disabled={!canRemove}
                        className="rounded border border-error/50 px-2 py-0.5 text-xs text-error hover:bg-error/10 disabled:opacity-40"
                        title="Eliminar procesador"
                    >
                        ✕
                    </button>
                </div>
            </div>

            {def?.description && (
                <p className="mt-2 pl-7 text-xs text-muted/80">{def.description}</p>
            )}

            {schemaEntries.length > 0 && (
                <div className="mt-3 grid grid-cols-1 gap-2 pl-7 sm:grid-cols-2">
                    {schemaEntries.map(([key, schemaType]) => {
                        const currentValue = draft.config[key];
                        if (isBooleanType(schemaType)) {
                            return (
                                <label
                                    key={key}
                                    className="flex items-center gap-2 rounded border border-border px-2 py-1 text-xs text-text"
                                >
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 accent-accent"
                                        checked={Boolean(currentValue ?? false)}
                                        onChange={(event) =>
                                            updateField(key, event.target.checked)
                                        }
                                    />
                                    {key}
                                </label>
                            );
                        }

                        if (isArrayType(schemaType)) {
                            return (
                                <div key={key} className="space-y-0.5">
                                    <label className="block text-xs text-muted">
                                        {key}
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full rounded border border-border bg-surface px-2 py-1 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
                                        value={
                                            Array.isArray(currentValue)
                                                ? currentValue.join(", ")
                                                : ""
                                        }
                                        onChange={(event) =>
                                            updateField(
                                                key,
                                                event.target.value
                                                    .split(",")
                                                    .map((item) => item.trim())
                                                    .filter(Boolean),
                                            )
                                        }
                                        placeholder="valor1, valor2"
                                    />
                                </div>
                            );
                        }

                        return (
                            <div key={key} className="space-y-0.5">
                                <label className="block text-xs text-muted">{key}</label>
                                <input
                                    type={isNumericType(schemaType) ? "number" : "text"}
                                    className="w-full rounded border border-border bg-surface px-2 py-1 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
                                    value={
                                        isNumericType(schemaType)
                                            ? String(currentValue ?? 0)
                                            : String(currentValue ?? "")
                                    }
                                    onChange={(event) =>
                                        updateField(
                                            key,
                                            isNumericType(schemaType)
                                                ? Number(event.target.value)
                                                : event.target.value,
                                        )
                                    }
                                />
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default function PipelineFormPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const isEdit = Boolean(id);
    const prefill = (location.state as PipelineFormPrefill | null) ?? null;

    const { processors: processorDefs, loading: defsLoading, error: defsError } =
        useProcessors();

    const [name, setName] = useState(prefill?.name ?? "");
    const [description, setDescription] = useState(prefill?.description ?? "");
    const [drafts, setDrafts] = useState<PipelineProcessorDraft[]>([]);
    const [loadingItem, setLoadingItem] = useState(isEdit || Boolean(prefill?.fromPipelineId));
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const defaultDraft = useMemo<PipelineProcessorDraft | null>(() => {
        if (processorDefs.length === 0) return null;
        return {
            processorId: processorDefs[0].id,
            config: emptyConfigFor(processorDefs[0]),
        };
    }, [processorDefs]);

    useEffect(() => {
        if (!isEdit || !id) return;
        let cancelled = false;

        setLoadingItem(true);
        getPipelineFull(id)
            .then((full) => {
                if (cancelled) return;
                setName(full.pipeline.name);
                setDescription(full.pipeline.description ?? "");
                setDrafts(
                    full.processors.map((item) => ({
                        processorId: item.processorid,
                        config: item.config,
                    })),
                );
            })
            .catch((err: Error) => {
                if (!cancelled) {
                    setError(err.message || "Error cargando pipeline");
                }
            })
            .finally(() => {
                if (!cancelled) setLoadingItem(false);
            });

        return () => {
            cancelled = true;
        };
    }, [id, isEdit]);

    useEffect(() => {
        if (isEdit || !prefill?.fromPipelineId) return;
        let cancelled = false;
        setLoadingItem(true);
        getPipelineFull(prefill.fromPipelineId)
            .then((full) => {
                if (cancelled) return;
                setDrafts(
                    full.processors.map((item) => ({
                        processorId: item.processorid,
                        config: item.config,
                    })),
                );
            })
            .catch((err: Error) => {
                if (!cancelled) {
                    setError(err.message || "Error cargando pipeline origen");
                }
            })
            .finally(() => {
                if (!cancelled) setLoadingItem(false);
            });

        return () => {
            cancelled = true;
        };
    }, [isEdit, prefill?.fromPipelineId]);

    useEffect(() => {
        if (defsLoading || loadingItem || drafts.length > 0 || !defaultDraft) return;
        setDrafts([defaultDraft]);
    }, [defaultDraft, defsLoading, drafts.length, loadingItem]);

    function addProcessor() {
        if (!defaultDraft) return;
        setDrafts((prev) => [
            ...prev,
            { ...defaultDraft, config: { ...defaultDraft.config } },
        ]);
    }

    function removeProcessor(index: number) {
        setDrafts((prev) => prev.filter((_, current) => current !== index));
    }

    function moveProcessor(index: number, direction: -1 | 1) {
        setDrafts((prev) => {
            const nextIndex = index + direction;
            if (nextIndex < 0 || nextIndex >= prev.length) return prev;
            const copy = [...prev];
            const [item] = copy.splice(index, 1);
            copy.splice(nextIndex, 0, item);
            return copy;
        });
    }

    function updateType(index: number, processorId: string) {
        setDrafts((prev) =>
            prev.map((item, current) =>
                current === index ? { ...item, processorId } : item,
            ),
        );
    }

    function updateConfig(index: number, config: Record<string, unknown>) {
        setDrafts((prev) =>
            prev.map((item, current) =>
                current === index ? { ...item, config } : item,
            ),
        );
    }

    async function syncPipelineProcessors(pipelineId: string) {
        const existing = await getPipelineProcessors(pipelineId);
        await Promise.all(
            existing.map((item) => deletePipelineProcessor(pipelineId, item.id)),
        );
        for (const draft of drafts) {
            await createPipelineProcessor(pipelineId, {
                id: crypto.randomUUID(),
                processorid: draft.processorId,
                config: draft.config,
            });
        }
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setSubmitting(true);

        try {
            const pipelineId = isEdit && id ? id : crypto.randomUUID();
            if (isEdit && id) {
                await updatePipeline(id, { name, description });
            } else {
                await createPipeline({ id: pipelineId, name, description });
            }
            await syncPipelineProcessors(pipelineId);
            navigate("/pipelines");
        } catch (err) {
            setError((err as Error).message || "Error al guardar pipeline");
        } finally {
            setSubmitting(false);
        }
    }

    if (loadingItem) return <LoadingState message="Cargando pipeline…" />;

    return (
        <main className="flex h-full flex-col overflow-hidden">
            <div className="shrink-0 border-b border-border bg-background px-6 py-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate("/pipelines")}
                        className="rounded border border-border px-3 py-1.5 text-sm text-muted hover:bg-primary/30"
                    >
                        ← Volver
                    </button>
                    <h1 className="text-xl font-semibold text-text-logo">
                        {isEdit
                            ? "Editar pipeline"
                            : prefill
                              ? "Duplicar pipeline"
                              : "Nuevo pipeline"}
                    </h1>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                <div className="mx-auto max-w-3xl">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                                Nombre
                            </label>
                            <input
                                className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent"
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                placeholder="ej. syslog-normalize"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                                Descripción
                            </label>
                            <textarea
                                className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent"
                                rows={2}
                                value={description}
                                onChange={(event) =>
                                    setDescription(event.target.value)
                                }
                                placeholder="Describe qué hace este pipeline…"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="block text-xs font-semibold uppercase tracking-wider text-muted">
                                    Procesadores (flujo)
                                </span>
                                <button
                                    type="button"
                                    onClick={addProcessor}
                                    disabled={defsLoading || processorDefs.length === 0}
                                    className="rounded border border-border px-2 py-0.5 text-xs text-muted hover:bg-primary/30 disabled:opacity-40"
                                >
                                    + Añadir procesador
                                </button>
                            </div>

                            {(defsError || error) && (
                                <p className="rounded bg-error/20 px-3 py-2 text-sm text-error">
                                    {defsError || error}
                                </p>
                            )}

                            {defsLoading ? (
                                <p className="text-xs text-muted">
                                    Cargando tipos de procesadores…
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {drafts.map((draft, index) => (
                                        <div key={`${draft.processorId}-${index}`}>
                                            <ProcessorRow
                                                index={index}
                                                draft={draft}
                                                definitions={processorDefs}
                                                canRemove={drafts.length > 1}
                                                canMoveUp={index > 0}
                                                canMoveDown={index < drafts.length - 1}
                                                onTypeChange={(value) =>
                                                    updateType(index, value)
                                                }
                                                onConfigChange={(value) =>
                                                    updateConfig(index, value)
                                                }
                                                onMoveUp={() =>
                                                    moveProcessor(index, -1)
                                                }
                                                onMoveDown={() =>
                                                    moveProcessor(index, 1)
                                                }
                                                onRemove={() => removeProcessor(index)}
                                            />
                                            {index < drafts.length - 1 && (
                                                <div className="px-2 py-1 text-center text-xs text-muted/70">
                                                    ↓
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={
                                    submitting ||
                                    defsLoading ||
                                    processorDefs.length === 0 ||
                                    drafts.length === 0
                                }
                                className="rounded bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent/80 disabled:opacity-50"
                            >
                                {submitting
                                    ? "Guardando…"
                                    : isEdit
                                      ? "Guardar cambios"
                                      : "Crear pipeline"}
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
