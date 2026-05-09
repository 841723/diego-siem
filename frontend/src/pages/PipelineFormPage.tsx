import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ConfirmModal from "../components/ConfirmModal";
import LoadingState from "../components/LoadingState";
import { useProcessors } from "../hooks/useProcessors";
import { useSources } from "../hooks/useSources";
import {
    createPipeline,
    deletePipeline,
    getPipelineFull,
    updatePipeline,
    updatePipelineProcessor,
} from "../services/api";
import type { ProcessorDefinition } from "../types";

type DraftProcessor = {
    localId: string;
    id?: string;
    processorid: string;
    humanDescription: string;
    config: Record<string, unknown>;
};

type PipelineDraftState = {
    name: string;
    description: string;
    processors: DraftProcessor[];
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

function resolveDefinition(
    definitions: ProcessorDefinition[],
    processorId: string,
): ProcessorDefinition | null {
    return definitions.find((item) => item.id === processorId) ?? definitions[0] ?? null;
}

export default function PipelineFormPage() {
    const { id } = useParams<{ id: string }>();
    const isEdit = Boolean(id);
    const navigate = useNavigate();
    const { processors: processorDefs, loading: loadingDefs } = useProcessors();
    const { sources } = useSources();

    const [draft, setDraft] = useState<PipelineDraftState>({
        name: "",
        description: "",
        processors: [],
    });
    const [loading, setLoading] = useState(isEdit);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [dropIndex, setDropIndex] = useState<number | null>(null);

    const [modalIndex, setModalIndex] = useState<number | null>(null);
    const [modalDraft, setModalDraft] = useState<DraftProcessor | null>(null);

    const sourceCountUsingPipeline = useMemo(() => {
        if (!id) return 0;
        return sources.filter((source) => source.pipelineid === id).length;
    }, [id, sources]);

    useEffect(() => {
        let cancelled = false;
        async function loadPipeline() {
            if (!isEdit || !id) {
                setDraft({ name: "", description: "", processors: [] });
                setLoading(false);
                return;
            }

            setLoading(true);
            setError("");
            try {
                const full = await getPipelineFull(id);
                if (cancelled) return;
                const ordered = [...full.processors].sort((a, b) => a.order - b.order);
                setDraft({
                    name: full.pipeline.name,
                    description: full.pipeline.description,
                    processors: ordered.map((processor) => ({
                        localId: crypto.randomUUID(),
                        id: processor.id,
                        processorid: processor.processorid,
                        humanDescription:
                            (typeof processor.config.humanDescription === "string"
                                ? processor.config.humanDescription
                                : undefined) ??
                            processor.processor?.humanDescription ??
                            processor.processor?.description ??
                            "",
                        config: processor.config,
                    })),
                });
            } catch (err) {
                if (!cancelled) {
                    setError((err as Error).message || "Error cargando pipeline");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        void loadPipeline();
        return () => {
            cancelled = true;
        };
    }, [id, isEdit]);

    function reorderProcessors(from: number, to: number) {
        setDraft((prev) => {
            const next = [...prev.processors];
            if (from < 0 || to < 0 || from >= next.length || to >= next.length) {
                return prev;
            }
            const [moved] = next.splice(from, 1);
            next.splice(to, 0, moved);
            return { ...prev, processors: next };
        });
    }

    function onDrop(targetIndex: number) {
        if (dragIndex === null) return;
        reorderProcessors(dragIndex, targetIndex);
        setDragIndex(null);
        setDropIndex(null);
    }

    function openProcessorModal(index: number) {
        const processor = draft.processors[index];
        if (!processor) return;
        setModalIndex(index);
        setModalDraft({
            ...processor,
            config: { ...processor.config },
        });
    }

    function applyModalChangesAndClose() {
        if (modalIndex === null || !modalDraft) {
            setModalIndex(null);
            setModalDraft(null);
            return;
        }
        setDraft((prev) => ({
            ...prev,
            processors: prev.processors.map((processor, index) =>
                index === modalIndex ? modalDraft : processor,
            ),
        }));
        setModalIndex(null);
        setModalDraft(null);
    }

    function closeModalDiscardingChanges() {
        setModalIndex(null);
        setModalDraft(null);
    }

    function addProcessor() {
        if (loadingDefs || processorDefs.length === 0) return;
        const processorDef = processorDefs[0];
        const newProcessor: DraftProcessor = {
            localId: crypto.randomUUID(),
            processorid: processorDef.id,
            humanDescription:
                processorDef.humanDescription || processorDef.description || "",
            config: emptyConfigFor(processorDef),
        };
        setDraft((prev) => ({
            ...prev,
            processors: [...prev.processors, newProcessor],
        }));
        setModalIndex(draft.processors.length);
        setModalDraft(newProcessor);
    }

    async function persistPipeline(nextId?: string) {
        const pipelineId = nextId ?? id ?? crypto.randomUUID();
        if (id) {
            await updatePipeline(id, {
                name: draft.name,
                description: draft.description,
            });
        } else {
            await createPipeline({
                id: pipelineId,
                name: draft.name,
                description: draft.description,
            });
        }

        await updatePipelineProcessor(
            pipelineId,
            draft.processors.map((processor) => ({
                id: processor.id ?? crypto.randomUUID(),
                processorid: processor.processorid,
                config: {
                    ...processor.config,
                    humanDescription: processor.humanDescription,
                },
            })),
        );

        return pipelineId;
    }

    async function handleSavePipeline(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSubmitting(true);
        setError("");
        try {
            const pipelineId = await persistPipeline();
            navigate(`/pipelines/${pipelineId}/edit`);
        } catch (err) {
            setError((err as Error).message || "Error guardando pipeline");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDuplicatePipeline() {
        setSubmitting(true);
        setError("");
        try {
            const newPipelineId = crypto.randomUUID();
            await createPipeline({
                id: newPipelineId,
                name: `${draft.name} (copia)`,
                description: draft.description,
            });
            await updatePipelineProcessor(
                newPipelineId,
                draft.processors.map((processor) => ({
                    id: crypto.randomUUID(),
                    processorid: processor.processorid,
                    config: {
                        ...processor.config,
                        humanDescription: processor.humanDescription,
                    },
                })),
            );
            navigate(`/pipelines/${newPipelineId}/edit`);
        } catch (err) {
            setError((err as Error).message || "Error duplicando pipeline");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDeletePipeline() {
        if (!id) return;
        if (sourceCountUsingPipeline > 0) {
            setError(
                `Cannot delete pipeline because it is being used by ${sourceCountUsingPipeline} sources`,
            );
            setConfirmDeleteOpen(false);
            return;
        }

        setSubmitting(true);
        setError("");
        try {
            await deletePipeline(id);
            navigate("/pipelines");
        } catch (err) {
            setError((err as Error).message || "Error eliminando pipeline");
            setSubmitting(false);
            setConfirmDeleteOpen(false);
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
                        checked={Boolean(value)}
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

    const modalProcessorDef = modalDraft
        ? resolveDefinition(processorDefs, modalDraft.processorid)
        : null;

    if (loading) return <LoadingState message='Cargando pipeline…' />;

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
                    {isEdit && (
                        <div className='flex gap-2'>
                            <button
                                type='button'
                                onClick={handleDuplicatePipeline}
                                disabled={submitting}
                                className='rounded border border-border px-3 py-1.5 text-sm text-muted hover:bg-primary/30 disabled:opacity-50'
                            >
                                Duplicar
                            </button>
                            <button
                                type='button'
                                onClick={() => setConfirmDeleteOpen(true)}
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
                                <button
                                    type='button'
                                    onClick={addProcessor}
                                    className='rounded border border-border px-2 py-1 text-xs text-muted hover:bg-primary/30'
                                >
                                    + Añadir processor
                                </button>
                            </div>

                            <div className='space-y-2'>
                                {draft.processors.map((processor, index) => {
                                    const definition = resolveDefinition(
                                        processorDefs,
                                        processor.processorid,
                                    );
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
                                                    onDrop(index);
                                                }}
                                                onClick={() => openProcessorModal(index)}
                                                className={`rounded border border-border bg-surface/70 p-3 transition-all cursor-pointer hover:bg-surface ${
                                                    dragIndex === index
                                                        ? "opacity-60 scale-[0.99]"
                                                        : ""
                                                }`}
                                            >
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
                                                            {processor.humanDescription ||
                                                                definition?.humanDescription ||
                                                                definition?.description ||
                                                                "Sin descripción"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

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

            {modalDraft && modalProcessorDef && (
                <div className='fixed inset-0 z-50'>
                    <div
                        className='absolute inset-0 bg-black/40'
                        onClick={applyModalChangesAndClose}
                        aria-hidden='true'
                    />
                    <aside className='absolute right-0 top-0 h-full w-full max-w-xl border-l border-border bg-background shadow-2xl'>
                        <div className='flex h-full flex-col'>
                            <div className='flex items-center justify-between border-b border-border px-6 py-4'>
                                <div>
                                    <h2 className='text-lg font-semibold text-text-logo'>
                                        {modalProcessorDef.name}
                                    </h2>
                                    <p className='text-xs text-muted'>
                                        {modalDraft.humanDescription ||
                                            modalProcessorDef.humanDescription ||
                                            modalProcessorDef.description}
                                    </p>
                                </div>
                                <button
                                    type='button'
                                    onClick={applyModalChangesAndClose}
                                    className='rounded border border-border px-3 py-1.5 text-sm text-muted hover:bg-primary/30'
                                >
                                    Cerrar
                                </button>
                            </div>

                            <div className='flex-1 overflow-y-auto p-6 space-y-4'>
                                <div className='space-y-1'>
                                    <label className='block text-xs font-semibold uppercase tracking-wider text-muted'>
                                        Tipo de processor
                                    </label>
                                    <select
                                        className='w-full rounded border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent'
                                        value={modalDraft.processorid}
                                        onChange={(event) => {
                                            const nextDef = resolveDefinition(
                                                processorDefs,
                                                event.target.value,
                                            );
                                            if (!nextDef) return;
                                            setModalDraft((prev) =>
                                                prev
                                                    ? {
                                                          ...prev,
                                                          processorid:
                                                              event.target.value,
                                                          humanDescription:
                                                              nextDef.humanDescription ||
                                                              nextDef.description ||
                                                              "",
                                                          config: emptyConfigFor(
                                                              nextDef,
                                                          ),
                                                      }
                                                    : prev,
                                            );
                                        }}
                                    >
                                        {processorDefs.map((processor) => (
                                            <option key={processor.id} value={processor.id}>
                                                {processor.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className='space-y-1'>
                                    <label className='block text-xs font-semibold uppercase tracking-wider text-muted'>
                                        HumanDescription
                                    </label>
                                    <textarea
                                        rows={3}
                                        className='w-full rounded border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent'
                                        value={modalDraft.humanDescription}
                                        onChange={(event) =>
                                            setModalDraft((prev) =>
                                                prev
                                                    ? {
                                                          ...prev,
                                                          humanDescription:
                                                              event.target.value,
                                                      }
                                                    : prev,
                                            )
                                        }
                                    />
                                </div>

                                <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                                    {Object.entries(modalProcessorDef.schema).map(
                                        ([key, schemaType]) =>
                                            renderConfigField(
                                                key,
                                                schemaType,
                                                modalDraft.config[key],
                                                (nextValue) =>
                                                    setModalDraft((prev) =>
                                                        prev
                                                            ? {
                                                                  ...prev,
                                                                  config: {
                                                                      ...prev.config,
                                                                      [key]: nextValue,
                                                                  },
                                                              }
                                                            : prev,
                                                    ),
                                            ),
                                    )}
                                </div>
                            </div>

                            <div className='flex items-center justify-between border-t border-border px-6 py-4'>
                                <button
                                    type='button'
                                    onClick={() => {
                                        if (modalIndex === null) return;
                                        setDraft((prev) => ({
                                            ...prev,
                                            processors: prev.processors.filter(
                                                (_, index) => index !== modalIndex,
                                            ),
                                        }));
                                        closeModalDiscardingChanges();
                                    }}
                                    className='rounded border border-error/50 px-4 py-2 text-sm text-error hover:bg-error/10'
                                >
                                    Eliminar processor
                                </button>
                                <div className='flex gap-3'>
                                    <button
                                        type='button'
                                        onClick={closeModalDiscardingChanges}
                                        className='rounded border border-border px-4 py-2 text-sm text-muted hover:bg-primary/30'
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type='button'
                                        onClick={applyModalChangesAndClose}
                                        className='rounded bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/80'
                                    >
                                        Guardar cambios
                                    </button>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            )}

            <ConfirmModal
                open={confirmDeleteOpen}
                title='Eliminar pipeline'
                message={
                    sourceCountUsingPipeline > 0
                        ? `Cannot delete pipeline because it is being used by ${sourceCountUsingPipeline} sources`
                        : "¿Seguro que quieres eliminar este pipeline?"
                }
                onConfirm={handleDeletePipeline}
                onCancel={() => setConfirmDeleteOpen(false)}
            />
        </main>
    );
}
