import { useMemo, useState } from "react";
import ConfirmModal from "../components/ConfirmModal";
import DataTable from "../components/DataTable";
import Drawer from "../components/Drawer";
import LoadingState from "../components/LoadingState";
import { usePipelines } from "../hooks/usePipelines";
import { useProcessors } from "../hooks/useProcessors";
import {
    createPipeline,
    deletePipeline,
    getPipelineFull,
    getPipelineProcessors,
    updatePipeline,
    updatePipelineProcessor,
} from "../services/api";
import type { Pipeline } from "../types";

type DraftProcessor = {
    clientId: string;
    serverId: string | null;
    processorId: string;
    config: Record<string, unknown>;
};

export default function PipelinesPage() {
    const { pipelines, loading, error, refetch } = usePipelines();
    const { processors, loading: processorsLoading } = useProcessors();

    const [confirmItem, setConfirmItem] = useState<Pipeline | null>(null);
    const [actionError, setActionError] = useState("");
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Pipeline | null>(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [drafts, setDrafts] = useState<DraftProcessor[]>([]);
    const [saving, setSaving] = useState(false);
    const [loadingItem, setLoadingItem] = useState(false);
    const [dragIndex, setDragIndex] = useState<number | null>(null);

    const sortedPipelines = useMemo(
        () => [...pipelines].sort((a, b) => a.name.localeCompare(b.name)),
        [pipelines],
    );

    const emptyDraft = useMemo(() => {
        const firstProcessor = processors[0];
        if (!firstProcessor) return null;
        return {
            clientId: crypto.randomUUID(),
            serverId: null,
            processorId: firstProcessor.id,
            config: {},
        } satisfies DraftProcessor;
    }, [processors]);

    async function handleDelete(pl: Pipeline) {
        try {
            await deletePipeline(pl.id);
            refetch();
        } catch (err) {
            setActionError((err as Error).message || "Error al eliminar pipeline");
        } finally {
            setConfirmItem(null);
        }
    }

    async function openCreateOrDuplicateDrawer(prefill?: Pipeline) {
        setEditingItem(null);
        setName(prefill?.name ?? "");
        setDescription(prefill?.description ?? "");
        setDrafts(emptyDraft ? [{ ...emptyDraft, clientId: crypto.randomUUID() }] : []);
        setActionError("");
        setDrawerOpen(true);
    }

    async function openEditDrawer(item: Pipeline) {
        setActionError("");
        setLoadingItem(true);
        setDrawerOpen(true);
        try {
            const full = await getPipelineFull(item.id);
            const ordered = [...full.processors].sort((a, b) => a.order - b.order);
            setEditingItem(full.pipeline);
            setName(full.pipeline.name);
            setDescription(full.pipeline.description);
            setDrafts(
                ordered.map((processor, index) => ({
                    clientId: `existing-${index}-${processor.id}`,
                    serverId: processor.id,
                    processorId: processor.processorid,
                    config: processor.config,
                })),
            );
        } catch (err) {
            setActionError((err as Error).message || "Error cargando pipeline");
            setDrawerOpen(false);
        } finally {
            setLoadingItem(false);
        }
    }

    function addProcessor() {
        if (!emptyDraft) return;
        setDrafts((prev) => [
            ...prev,
            { ...emptyDraft, clientId: crypto.randomUUID() },
        ]);
    }

    function removeProcessor(index: number) {
        setDrafts((prev) => prev.filter((_, current) => current !== index));
    }

    function updateProcessorType(index: number, processorId: string) {
        setDrafts((prev) =>
            prev.map((draft, current) =>
                current === index ? { ...draft, processorId } : draft,
            ),
        );
    }

    async function syncPipelineProcessors(pipelineId: string, orderedDrafts: DraftProcessor[]) {
        const existing = await getPipelineProcessors(pipelineId);
        const usedIds = new Set<string>();
        await updatePipelineProcessor(
            pipelineId,
            orderedDrafts.map((draft, index) => ({
                id: (() => {
                    if (draft.serverId) {
                        usedIds.add(draft.serverId);
                        return draft.serverId;
                    }

                    const byIndex = existing[index]?.id;
                    if (byIndex && !usedIds.has(byIndex)) {
                        usedIds.add(byIndex);
                        return byIndex;
                    }

                    const byProcessor = existing.find(
                        (candidate) =>
                            candidate.processorid === draft.processorId &&
                            !usedIds.has(candidate.id),
                    )?.id;
                    if (byProcessor) {
                        usedIds.add(byProcessor);
                        return byProcessor;
                    }

                    const generated = crypto.randomUUID();
                    usedIds.add(generated);
                    return generated;
                })(),
                processorid: draft.processorId,
                config: draft.config,
            })),
        );
    }

    async function onDropProcessor(targetIndex: number) {
        if (dragIndex === null) return;

        const currentDrafts = [...drafts];
        if (
            dragIndex < 0 ||
            dragIndex >= currentDrafts.length ||
            targetIndex < 0 ||
            targetIndex >= currentDrafts.length
        ) {
            setDragIndex(null);
            return;
        }
        const [moved] = currentDrafts.splice(dragIndex, 1);
        currentDrafts.splice(targetIndex, 0, moved);
        setDrafts(currentDrafts);
        setDragIndex(null);

        if (editingItem) {
            try {
                await syncPipelineProcessors(editingItem.id, currentDrafts);
                refetch();
            } catch (err) {
                setActionError(
                    (err as Error).message || "Error guardando el orden de procesadores",
                );
            }
        }
    }

    async function savePipeline() {
        setSaving(true);
        setActionError("");

        try {
            const pipelineId = editingItem?.id ?? crypto.randomUUID();
            if (editingItem) {
                await updatePipeline(pipelineId, { name, description });
            } else {
                await createPipeline({ id: pipelineId, name, description });
            }

            await syncPipelineProcessors(pipelineId, drafts);
            setDrawerOpen(false);
            refetch();
        } catch (err) {
            setActionError((err as Error).message || "Error al guardar pipeline");
        } finally {
            setSaving(false);
        }
    }

    const tableRows = sortedPipelines.map((pl) => [
        <span className='font-mono text-xs text-muted'>{pl.id.slice(0, 8)}…</span>,
        <button
            onClick={() => openEditDrawer(pl)}
            className='text-left text-sm text-text hover:underline'
        >
            {pl.name}
        </button>,
        <span className='text-xs text-muted line-clamp-2'>{pl.description || "—"}</span>,
        <div className='flex gap-1.5'>
            <button
                onClick={() => openEditDrawer(pl)}
                className='rounded border border-border px-2 py-0.5 text-xs text-muted hover:bg-primary/30'
            >
                Editar
            </button>
            <button
                onClick={() =>
                    openCreateOrDuplicateDrawer({
                        ...pl,
                        name: `${pl.name} (copia)`,
                    })
                }
                className='rounded border border-border px-2 py-0.5 text-xs text-muted hover:bg-primary/30'
            >
                Duplicar
            </button>
            <button
                onClick={() => setConfirmItem(pl)}
                className='rounded border border-error/50 px-2 py-0.5 text-xs text-error hover:bg-error/10'
            >
                Eliminar
            </button>
        </div>,
    ]);

    return (
        <main className='flex flex-col h-full overflow-hidden'>
            <div className='flex items-center justify-between border-b border-border bg-background px-6 py-4 shrink-0'>
                <div>
                    <h1 className='text-xl font-semibold text-text-logo'>Pipelines</h1>
                    <p className='text-xs text-muted'>
                        Define cadenas de procesadores para transformar logs entrantes
                    </p>
                </div>
                <button
                    onClick={() => openCreateOrDuplicateDrawer()}
                    className='rounded bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/80'
                >
                    + Nuevo pipeline
                </button>
            </div>

            <div className='flex-1 overflow-y-auto p-6'>
                {(error || actionError) && (
                    <p className='mb-4 rounded bg-error/20 px-3 py-2 text-sm text-error'>
                        {error || actionError}
                    </p>
                )}

                {loading ? (
                    <LoadingState message='Cargando pipelines…' />
                ) : (
                    <DataTable
                        headers={["ID", "Nombre", "Descripción", "Acciones"]}
                        rows={tableRows}
                        emptyMessage='No hay pipelines configurados'
                    />
                )}
            </div>

            <Drawer
                open={drawerOpen}
                title={editingItem ? "Editar pipeline" : "Crear pipeline"}
                onClose={() => setDrawerOpen(false)}
                footer={
                    <div className='flex justify-end gap-3'>
                        <button
                            className='rounded border border-border px-4 py-2 text-sm text-muted hover:bg-primary/30'
                            onClick={() => setDrawerOpen(false)}
                        >
                            Cancelar
                        </button>
                        <button
                            className='rounded bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/80 disabled:opacity-50'
                            onClick={savePipeline}
                            disabled={
                                saving ||
                                !name.trim() ||
                                drafts.length === 0 ||
                                processorsLoading
                            }
                        >
                            {saving ? "Guardando…" : "Guardar"}
                        </button>
                    </div>
                }
            >
                {loadingItem ? (
                    <LoadingState message='Cargando pipeline…' />
                ) : (
                    <div className='space-y-4'>
                        <div className='space-y-1'>
                            <label className='block text-xs font-semibold uppercase tracking-wider text-muted'>
                                Nombre
                            </label>
                            <input
                                className='w-full rounded border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent'
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                            />
                        </div>

                        <div className='space-y-1'>
                            <label className='block text-xs font-semibold uppercase tracking-wider text-muted'>
                                Descripción
                            </label>
                            <textarea
                                rows={2}
                                className='w-full rounded border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent'
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                            />
                        </div>

                        <div className='space-y-2'>
                            <div className='flex items-center justify-between'>
                                <span className='text-xs font-semibold uppercase tracking-wider text-muted'>
                                    Procesadores (arrastra para reordenar)
                                </span>
                                <button
                                    type='button'
                                    onClick={addProcessor}
                                    className='rounded border border-border px-2 py-1 text-xs text-muted hover:bg-primary/30'
                                >
                                    + Crear nuevo
                                </button>
                            </div>

                            <div className='space-y-2'>
                                {drafts.map((draft, index) => (
                                    <div
                                        key={draft.clientId}
                                        className='rounded border border-border bg-surface/70 p-3'
                                        draggable
                                        onDragStart={() => setDragIndex(index)}
                                        onDragOver={(event) => event.preventDefault()}
                                        onDrop={() => onDropProcessor(index)}
                                    >
                                        <div className='mb-2 flex items-center justify-between gap-3'>
                                            <div className='flex items-center gap-2'>
                                                <span className='flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs text-muted'>
                                                    {index + 1}
                                                </span>
                                                <span className='text-xs uppercase tracking-wider text-muted'>
                                                    Orden {index + 1}
                                                </span>
                                            </div>
                                            <button
                                                type='button'
                                                onClick={() => removeProcessor(index)}
                                                className='rounded border border-error/50 px-2 py-0.5 text-xs text-error hover:bg-error/10'
                                                disabled={drafts.length === 1}
                                            >
                                                Eliminar
                                            </button>
                                        </div>

                                        <select
                                            className='w-full rounded border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent'
                                            value={draft.processorId}
                                            onChange={(event) =>
                                                updateProcessorType(index, event.target.value)
                                            }
                                        >
                                            {processors.map((processor) => (
                                                <option key={processor.id} value={processor.id}>
                                                    {processor.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </Drawer>

            <ConfirmModal
                open={confirmItem !== null}
                title='Eliminar pipeline'
                message={`¿Seguro que quieres eliminar "${confirmItem?.name}"? Esta acción no se puede deshacer.`}
                onConfirm={() => confirmItem && handleDelete(confirmItem)}
                onCancel={() => setConfirmItem(null)}
            />
        </main>
    );
}
