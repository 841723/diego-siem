import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
    useLocation,
    useMatch,
    useNavigate,
    useParams,
} from "react-router-dom";
import ConfirmModal from "../components/ConfirmModal";
import LoadingState from "../components/LoadingState";
import {
    type PipelineDraft,
    type PipelineProcessorDraftItem,
    usePipelineDraft,
} from "../hooks/usePipelineDraft";
import { useProcessors } from "../hooks/useProcessors";
import {
    createPipeline,
    deletePipeline,
    getPipelineFull,
    updatePipeline,
    updatePipelineProcessor,
} from "../services/api";
import type { ProcessorDefinition } from "../types";

type PipelineDuplicateState = {
    draft?: PipelineDraft;
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
    const config: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(def.schema)) {
        if (isArrayType(value)) config[key] = [];
        else if (isBooleanType(value)) config[key] = false;
        else if (isNumericType(value)) config[key] = 0;
        else config[key] = "";
    }
    return config;
}

function normalizePipelineDraftFromFull(
    full: Awaited<ReturnType<typeof getPipelineFull>>,
): PipelineDraft {
    const ordered = [...full.processors].sort((a, b) => a.order - b.order);
    return {
        name: full.pipeline.name,
        description: full.pipeline.description,
        processors: ordered.map((processor) => ({
            localId: crypto.randomUUID(),
            id: processor.id,
            processorid: processor.processorid,
            config: processor.config,
        })),
    };
}

function resolveProcessorDefinition(
    definitions: ProcessorDefinition[],
    processorId: string,
): ProcessorDefinition | null {
    return definitions.find((item) => item.id === processorId) ?? definitions[0] ?? null;
}

export default function PipelineFormPage() {
    const { id, processorId } = useParams<{ id: string; processorId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const isProcessorCreateRoute = useMatch("/pipelines/:id/processors/new") !== null;
    const isProcessorEditRoute = useMatch("/pipelines/:id/processors/:processorId/edit") !== null;
    const isEdit = Boolean(id);
    const scope = id ?? "new";

    const { processors: processorDefs, loading: defsLoading } = useProcessors();
    const { loadDraft, saveDraft, clearDraft } = usePipelineDraft(scope);

    const [draft, setDraft] = useState<PipelineDraft>({
        name: "",
        description: "",
        processors: [],
    });
    const [loadingDraft, setLoadingDraft] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [confirmDeletePipeline, setConfirmDeletePipeline] = useState(false);
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [dropIndex, setDropIndex] = useState<number | null>(null);

    const selectedProcessorIndex = useMemo(() => {
        if (!isProcessorEditRoute || !processorId) return -1;
        return draft.processors.findIndex(
            (item) => item.id === processorId || item.localId === processorId,
        );
    }, [draft.processors, isProcessorEditRoute, processorId]);

    const selectedProcessor =
        selectedProcessorIndex >= 0 ? draft.processors[selectedProcessorIndex] : null;
    const selectedProcessorDef = selectedProcessor
        ? resolveProcessorDefinition(processorDefs, selectedProcessor.processorid)
        : null;

    useEffect(() => {
        let cancelled = false;
        async function initDraft() {
            setLoadingDraft(true);
            setError("");
            try {
                const fromStorage = loadDraft();
                if (fromStorage) {
                    if (!cancelled) setDraft(fromStorage);
                    return;
                }

                const duplicateState = location.state as PipelineDuplicateState | null;
                if (duplicateState?.draft) {
                    if (!cancelled) setDraft(duplicateState.draft);
                    return;
                }

                if (isEdit && id) {
                    const full = await getPipelineFull(id);
                    if (!cancelled) setDraft(normalizePipelineDraftFromFull(full));
                    return;
                }

                if (!cancelled) {
                    setDraft({
                        name: "",
                        description: "",
                        processors: [],
                    });
                }
            } catch (err) {
                if (!cancelled) {
                    setError((err as Error).message || "Error cargando pipeline");
                }
            } finally {
                if (!cancelled) setLoadingDraft(false);
            }
        }

        void initDraft();
        return () => {
            cancelled = true;
        };
    }, [id, isEdit, loadDraft, location.state]);

    useEffect(() => {
        if (loadingDraft) return;
        saveDraft(draft);
    }, [draft, loadingDraft, saveDraft]);

    useEffect(() => {
        if (!isProcessorCreateRoute || !id || defsLoading || processorDefs.length === 0) {
            return;
        }
        const processorDef = processorDefs[0];
        const newProcessor: PipelineProcessorDraftItem = {
            localId: crypto.randomUUID(),
            processorid: processorDef.id,
            config: emptyConfigFor(processorDef),
        };
        setDraft((prev) => ({
            ...prev,
            processors: [...prev.processors, newProcessor],
        }));
        navigate(`/pipelines/${id}/processors/${newProcessor.localId}/edit`, {
            replace: true,
        });
    }, [defsLoading, id, isProcessorCreateRoute, navigate, processorDefs]);

    function addLocalProcessor() {
        if (defsLoading || processorDefs.length === 0) return;
        const processorDef = processorDefs[0];
        const nextProcessor: PipelineProcessorDraftItem = {
            localId: crypto.randomUUID(),
            processorid: processorDef.id,
            config: emptyConfigFor(processorDef),
        };
        setDraft((prev) => ({
            ...prev,
            processors: [...prev.processors, nextProcessor],
        }));
    }

    function updateProcessor(
        processorIndex: number,
        updater: (item: PipelineProcessorDraftItem) => PipelineProcessorDraftItem,
    ) {
        setDraft((prev) => ({
            ...prev,
            processors: prev.processors.map((item, index) =>
                index === processorIndex ? updater(item) : item,
            ),
        }));
    }

    function removeProcessor(processorIndex: number) {
        setDraft((prev) => ({
            ...prev,
            processors: prev.processors.filter((_, index) => index !== processorIndex),
        }));
    }

    function reorderProcessors(from: number, to: number) {
        setDraft((prev) => {
            if (
                from < 0 ||
                to < 0 ||
                from >= prev.processors.length ||
                to >= prev.processors.length
            ) {
                return prev;
            }
            const next = [...prev.processors];
            const [moved] = next.splice(from, 1);
            next.splice(to, 0, moved);
            return { ...prev, processors: next };
        });
    }

    function submitDrop(targetIndex: number) {
        if (dragIndex === null) return;
        reorderProcessors(dragIndex, targetIndex);
        setDragIndex(null);
        setDropIndex(null);
    }

    async function persistPipelineAndProcessors() {
        const pipelineId = id ?? crypto.randomUUID();
        if (isEdit && id) {
            await updatePipeline(id, { name: draft.name, description: draft.description });
        } else {
            await createPipeline({
                id: pipelineId,
                name: draft.name,
                description: draft.description,
            });
        }

        const payload = draft.processors.map((item) => ({
            id: item.id ?? crypto.randomUUID(),
            processorid: item.processorid,
            config: item.config,
        }));
        await updatePipelineProcessor(pipelineId, payload);

        clearDraft();
        navigate(`/pipelines/${pipelineId}/edit`);
    }

    async function handleSavePipeline(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSubmitting(true);
        setError("");
        try {
            await persistPipelineAndProcessors();
        } catch (err) {
            setError((err as Error).message || "Error guardando pipeline");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDeletePipeline() {
        if (!id) return;
        setSubmitting(true);
        try {
            await deletePipeline(id);
            clearDraft();
            navigate("/pipelines");
        } catch (err) {
            setError((err as Error).message || "Error eliminando pipeline");
            setSubmitting(false);
            setConfirmDeletePipeline(false);
        }
    }

    function renderConfigField(
        key: string,
        schemaType: unknown,
        value: unknown,
        onChange: (next: unknown) => void,
    ) {
        if (isBooleanType(schemaType)) {
            return (
                <label
                    key={key}
                    className='flex items-center gap-2 rounded border border-border px-3 py-2 text-sm text-text'
                >
                    <input
                        type='checkbox'
                        className='h-4 w-4 accent-accent'
                        checked={Boolean(value ?? false)}
                        onChange={(event) => onChange(event.target.checked)}
                    />
                    {key}
                </label>
            );
        }

        if (isArrayType(schemaType)) {
            return (
                <div key={key} className='space-y-1'>
                    <label className='block text-xs font-semibold uppercase tracking-wider text-muted'>
                        {key}
                    </label>
                    <input
                        className='w-full rounded border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent'
                        value={Array.isArray(value) ? value.join(", ") : ""}
                        onChange={(event) =>
                            onChange(
                                event.target.value
                                    .split(",")
                                    .map((item) => item.trim())
                                    .filter(Boolean),
                            )
                        }
                    />
                </div>
            );
        }

        return (
            <div key={key} className='space-y-1'>
                <label className='block text-xs font-semibold uppercase tracking-wider text-muted'>
                    {key}
                </label>
                <input
                    type={isNumericType(schemaType) ? "number" : "text"}
                    className='w-full rounded border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent'
                    value={
                        isNumericType(schemaType)
                            ? String(value ?? 0)
                            : String(value ?? "")
                    }
                    onChange={(event) =>
                        onChange(
                            isNumericType(schemaType)
                                ? Number(event.target.value)
                                : event.target.value,
                        )
                    }
                />
            </div>
        );
    }

    if (loadingDraft) return <LoadingState message='Cargando pipeline…' />;

    if (isProcessorEditRoute && !selectedProcessor) {
        return (
            <main className='p-6'>
                <p className='rounded bg-error/20 px-3 py-2 text-sm text-error'>
                    Processor no encontrado en el estado local del pipeline.
                </p>
            </main>
        );
    }

    if (isProcessorEditRoute && selectedProcessor && selectedProcessorDef) {
        const schemaEntries = Object.entries(selectedProcessorDef.schema);
        return (
            <main className='flex flex-col h-full overflow-hidden'>
                <div className='flex items-center justify-between gap-4 border-b border-border bg-background px-6 py-4 shrink-0'>
                    <div className='flex items-center gap-4'>
                        <button
                            onClick={() => navigate(`/pipelines/${id}/edit`)}
                            className='rounded border border-border px-3 py-1.5 text-sm text-muted hover:bg-primary/30'
                        >
                            ← Volver al pipeline
                        </button>
                        <h1 className='text-xl font-semibold text-text-logo'>
                            Editar processor
                        </h1>
                    </div>
                    <button
                        onClick={() => {
                            removeProcessor(selectedProcessorIndex);
                            navigate(`/pipelines/${id}/edit`);
                        }}
                        className='rounded border border-error/50 px-3 py-1.5 text-sm text-error hover:bg-error/10'
                    >
                        Eliminar processor
                    </button>
                </div>

                <div className='flex-1 overflow-y-auto p-6'>
                    <div className='mx-auto max-w-3xl space-y-4'>
                        <div className='space-y-1'>
                            <label className='block text-xs font-semibold uppercase tracking-wider text-muted'>
                                Tipo de processor
                            </label>
                            <select
                                className='w-full rounded border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent'
                                value={selectedProcessor.processorid}
                                onChange={(event) => {
                                    const nextDef = resolveProcessorDefinition(
                                        processorDefs,
                                        event.target.value,
                                    );
                                    updateProcessor(selectedProcessorIndex, (item) => ({
                                        ...item,
                                        processorid: event.target.value,
                                        config: nextDef
                                            ? emptyConfigFor(nextDef)
                                            : item.config,
                                    }));
                                }}
                            >
                                {processorDefs.map((processor) => (
                                    <option key={processor.id} value={processor.id}>
                                        {processor.name}
                                    </option>
                                ))}
                            </select>
                            <p className='text-xs text-muted'>
                                {selectedProcessorDef.humanDescription ||
                                    selectedProcessorDef.description}
                            </p>
                        </div>

                        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                            {schemaEntries.map(([key, schemaType]) =>
                                renderConfigField(
                                    key,
                                    schemaType,
                                    selectedProcessor.config[key],
                                    (nextValue) =>
                                        updateProcessor(selectedProcessorIndex, (item) => ({
                                            ...item,
                                            config: {
                                                ...item.config,
                                                [key]: nextValue,
                                            },
                                        })),
                                ),
                            )}
                        </div>

                        {error && (
                            <p className='rounded bg-error/20 px-3 py-2 text-sm text-error'>
                                {error}
                            </p>
                        )}
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className='flex h-full flex-col overflow-hidden'>
            <div className='shrink-0 border-b border-border bg-background px-6 py-4'>
                <div className='flex items-center justify-between gap-4'>
                    <div className='flex items-center gap-4'>
                        <button
                            onClick={() => navigate("/pipelines")}
                            className='rounded border border-border px-3 py-1.5 text-sm text-muted hover:bg-primary/30'
                        >
                            ← Volver
                        </button>
                        <h1 className='text-xl font-semibold text-text-logo'>
                            {isEdit ? "Editar pipeline" : "Nuevo pipeline"}
                        </h1>
                    </div>
                    {isEdit && id && (
                        <div className='flex gap-2'>
                            <button
                                type='button'
                                onClick={() =>
                                    navigate("/pipelines/new", {
                                        state: {
                                            draft: {
                                                ...draft,
                                                name: `${draft.name} (copia)`,
                                                processors: draft.processors.map((item) => ({
                                                    ...item,
                                                    id: undefined,
                                                    localId: crypto.randomUUID(),
                                                })),
                                            },
                                        } satisfies PipelineDuplicateState,
                                    })
                                }
                                className='rounded border border-border px-3 py-1.5 text-sm text-muted hover:bg-primary/30'
                            >
                                Duplicar
                            </button>
                            <button
                                type='button'
                                onClick={() => setConfirmDeletePipeline(true)}
                                className='rounded border border-error/50 px-3 py-1.5 text-sm text-error hover:bg-error/10'
                            >
                                Eliminar
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className='flex-1 overflow-y-auto p-6'>
                <div className='mx-auto max-w-4xl'>
                    <form onSubmit={handleSavePipeline} className='space-y-5'>
                        <div className='space-y-1'>
                            <label className='block text-xs font-semibold uppercase tracking-wider text-muted'>
                                Nombre
                            </label>
                            <input
                                className='w-full rounded border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent'
                                value={draft.name}
                                onChange={(event) =>
                                    setDraft((prev) => ({
                                        ...prev,
                                        name: event.target.value,
                                    }))
                                }
                                required
                            />
                        </div>

                        <div className='space-y-1'>
                            <label className='block text-xs font-semibold uppercase tracking-wider text-muted'>
                                Descripción
                            </label>
                            <textarea
                                rows={2}
                                className='w-full rounded border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent'
                                value={draft.description}
                                onChange={(event) =>
                                    setDraft((prev) => ({
                                        ...prev,
                                        description: event.target.value,
                                    }))
                                }
                            />
                        </div>

                        <div className='space-y-3'>
                            <div className='flex items-center justify-between'>
                                <span className='text-xs font-semibold uppercase tracking-wider text-muted'>
                                    Processors
                                </span>
                                {id ? (
                                    <button
                                        type='button'
                                        onClick={() =>
                                            navigate(`/pipelines/${id}/processors/new`)
                                        }
                                        className='rounded border border-border px-2 py-1 text-xs text-muted hover:bg-primary/30'
                                    >
                                        + Añadir processor
                                    </button>
                                ) : (
                                    <button
                                        type='button'
                                        onClick={addLocalProcessor}
                                        className='rounded border border-border px-2 py-1 text-xs text-muted hover:bg-primary/30'
                                    >
                                        + Añadir processor
                                    </button>
                                )}
                            </div>

                            <div className='space-y-2'>
                                {draft.processors.map((processor, index) => {
                                    const definition = resolveProcessorDefinition(
                                        processorDefs,
                                        processor.processorid,
                                    );
                                    const processorRouteId =
                                        processor.id ?? processor.localId;
                                    const isDropTarget = dropIndex === index;
                                    return (
                                        <div key={processor.localId} className='space-y-1'>
                                            {isDropTarget && (
                                                <div className='h-1 rounded bg-accent/80 transition-all' />
                                            )}
                                            <div
                                                draggable
                                                onDragStart={() => setDragIndex(index)}
                                                onDragOver={(event) => {
                                                    event.preventDefault();
                                                    setDropIndex(index);
                                                }}
                                                onDragEnd={() => {
                                                    setDragIndex(null);
                                                    setDropIndex(null);
                                                }}
                                                onDrop={(event) => {
                                                    event.preventDefault();
                                                    submitDrop(index);
                                                }}
                                                onClick={() => {
                                                    if (!id) return;
                                                    navigate(
                                                        `/pipelines/${id}/processors/${processorRouteId}/edit`,
                                                    );
                                                }}
                                                className={`rounded border border-border bg-surface/70 p-3 transition-all ${
                                                    id
                                                        ? "cursor-pointer hover:bg-surface"
                                                        : "cursor-default"
                                                } ${
                                                    dragIndex === index
                                                        ? "opacity-60 scale-[0.99]"
                                                        : ""
                                                }`}
                                            >
                                                <div className='flex items-center justify-between'>
                                                    <div className='flex items-center gap-2'>
                                                        <span className='flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs text-muted'>
                                                            {index + 1}
                                                        </span>
                                                        <div>
                                                            <p className='text-sm font-semibold text-text'>
                                                                {definition?.name ??
                                                                    processor.processorid}
                                                            </p>
                                                            <p className='text-xs text-muted'>
                                                                {definition?.humanDescription ||
                                                                    definition?.description ||
                                                                    "Sin descripción"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {!id && (
                                                        <button
                                                            type='button'
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                removeProcessor(index);
                                                            }}
                                                            className='rounded border border-error/50 px-2 py-0.5 text-xs text-error hover:bg-error/10'
                                                        >
                                                            Eliminar
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {dropIndex === draft.processors.length && (
                                    <div className='h-1 rounded bg-accent/80 transition-all' />
                                )}
                                {draft.processors.length === 0 && (
                                    <p className='rounded border border-border bg-surface/60 px-3 py-4 text-sm text-muted'>
                                        Añade al menos un processor.
                                    </p>
                                )}
                            </div>
                        </div>

                        {error && (
                            <p className='rounded bg-error/20 px-3 py-2 text-sm text-error'>
                                {error}
                            </p>
                        )}

                        <div className='flex gap-3 pt-2'>
                            <button
                                type='submit'
                                disabled={submitting || draft.processors.length === 0}
                                className='rounded bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent/80 disabled:opacity-50'
                            >
                                {submitting ? "Guardando…" : "Guardar cambios"}
                            </button>
                            <button
                                type='button'
                                onClick={() => navigate("/pipelines")}
                                className='rounded border border-border px-5 py-2 text-sm text-muted hover:bg-primary/30'
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <ConfirmModal
                open={confirmDeletePipeline}
                title='Eliminar pipeline'
                message='¿Seguro que quieres eliminar este pipeline?'
                onConfirm={handleDeletePipeline}
                onCancel={() => setConfirmDeletePipeline(false)}
            />
        </main>
    );
}
