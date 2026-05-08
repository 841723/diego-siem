import { useMemo, useState } from "react";
import ConfirmModal from "../components/ConfirmModal";
import DataTable from "../components/DataTable";
import Drawer from "../components/Drawer";
import LoadingState from "../components/LoadingState";
import { useSources } from "../hooks/useSources";
import { createSource, deleteSource, updateSource } from "../services/api";
import type { SourceConfig } from "../types";

type SourceForm = Omit<SourceConfig, "id">;

const EMPTY_FORM: SourceForm = {
    name: "",
    port: 9001,
    protocol: "udp",
    parser: "syslog",
    pipelineid: "",
};

export default function SourcesPage() {
    const { sources, loading, error, refetch } = useSources();
    const [confirmItem, setConfirmItem] = useState<SourceConfig | null>(null);
    const [actionError, setActionError] = useState("");
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<SourceConfig | null>(null);
    const [form, setForm] = useState<SourceForm>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const isEdit = editingItem !== null;

    const sortedSources = useMemo(
        () => [...sources].sort((a, b) => a.name.localeCompare(b.name)),
        [sources],
    );

    async function handleDelete(src: SourceConfig) {
        try {
            await deleteSource(src.id);
            refetch();
        } catch (err) {
            setActionError(
                (err as Error).message || "Error al eliminar fuente",
            );
        } finally {
            setConfirmItem(null);
        }
    }

    function openCreateDrawer() {
        setEditingItem(null);
        setForm(EMPTY_FORM);
        setActionError("");
        setDrawerOpen(true);
    }

    function openEditDrawer(src: SourceConfig) {
        setEditingItem(src);
        setForm({
            name: src.name,
            port: src.port,
            protocol: src.protocol,
            parser: src.parser,
            pipelineid: src.pipelineid,
        });
        setActionError("");
        setDrawerOpen(true);
    }

    async function handleSave() {
        setSaving(true);
        setActionError("");
        try {
            if (isEdit && editingItem) {
                await updateSource(editingItem.id, form);
            } else {
                await createSource(form);
            }
            setDrawerOpen(false);
            refetch();
        } catch (err) {
            setActionError((err as Error).message || "Error al guardar fuente");
        } finally {
            setSaving(false);
        }
    }

    const tableRows = sortedSources.map((src) => [
            <button
                onClick={() => openEditDrawer(src)}
                className='text-left text-sm text-muted hover:underline'
            >
                {src.name}
            </button>,
            <span className='font-mono text-xs text-muted'>{src.port}</span>,
            <span className='text-xs text-muted'>{src.protocol}</span>,
            <span className='text-xs text-muted'>{src.parser}</span>,
            <span className='font-mono text-xs text-muted'>
                {src.pipelineid}
            </span>,
            <div className='flex gap-1.5'>
                <button
                    onClick={() => openEditDrawer(src)}
                    className='rounded border border-border px-2 py-0.5 text-xs text-muted hover:bg-primary/30'
                >
                    Editar
                </button>
                <button
                    onClick={() => {
                        setEditingItem(null);
                        setForm({
                            name: `${src.name} (copia)`,
                            port: src.port,
                            protocol: src.protocol,
                            parser: src.parser,
                            pipelineid: src.pipelineid,
                        });
                        setDrawerOpen(true);
                    }}
                    className='rounded border border-border px-2 py-0.5 text-xs text-muted hover:bg-primary/30'
                >
                    Duplicar
                </button>
                <button
                    onClick={() => setConfirmItem(src)}
                    className='rounded border-2 border-error px-2 py-0.5 text-xs text-muted bg-error/80 hover:bg-error/40 hover:text-white'
                >
                    Eliminar
                </button>
            </div>,
        ]);

    return (
        <main className='flex flex-col h-full overflow-hidden'>
            {/* Top bar */}
            <div className='flex items-center justify-between border-b border-border bg-background px-6 py-4 shrink-0'>
                <div>
                    <h1 className='text-xl font-semibold text-text-logo'>
                        Fuentes
                    </h1>
                    <p className='text-xs text-muted'>
                        Gestiona las fuentes de logs del sistema
                    </p>
                </div>
                <button
                    onClick={openCreateDrawer}
                    className='rounded bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/80'
                >
                    + Nueva fuente
                </button>
            </div>

            {/* List */}
            <div className='flex-1 flex flex-col overflow-hidden p-6 h-full'>
                {(error || actionError) && (
                    <p className='mb-4 rounded bg-error/20 px-3 py-2 text-sm text-error'>
                        {error || actionError}
                    </p>
                )}

                {loading ? (
                    <LoadingState message='Cargando fuentes…' />
                ) : (
                    <DataTable
                        headers={[
                            "Nombre",
                            "Puerto",
                            "Protocolo",
                            "Parser",
                            "Pipeline ID",
                            "Acciones",
                        ]}
                        rows={tableRows}
                        emptyMessage='No hay fuentes configuradas'
                    />
                )}
            </div>

            <Drawer
                open={drawerOpen}
                title={isEdit ? "Editar fuente" : "Crear fuente"}
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
                            disabled={saving || !form.name.trim()}
                            onClick={handleSave}
                        >
                            {saving ? "Guardando…" : "Guardar"}
                        </button>
                    </div>
                }
            >
                <div className='space-y-4'>
                    <div className='space-y-1'>
                        <label className='block text-xs font-semibold uppercase tracking-wider text-muted'>
                            Nombre
                        </label>
                        <input
                            className='w-full rounded border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent'
                            value={form.name}
                            onChange={(event) =>
                                setForm((prev) => ({
                                    ...prev,
                                    name: event.target.value,
                                }))
                            }
                            required
                        />
                    </div>

                    <div className='space-y-1'>
                        <label className='block text-xs font-semibold uppercase tracking-wider text-muted'>
                            Puerto UDP
                        </label>
                        <input
                            type='number'
                            min={1}
                            max={65535}
                            className='w-full rounded border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent'
                            value={form.port}
                            onChange={(event) =>
                                setForm((prev) => ({
                                    ...prev,
                                    port: Number(event.target.value),
                                }))
                            }
                        />
                    </div>

                    <div className='space-y-1'>
                        <label className='block text-xs font-semibold uppercase tracking-wider text-muted'>
                            Protocolo
                        </label>
                        <input
                            className='w-full rounded border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent'
                            value={form.protocol}
                            onChange={(event) =>
                                setForm((prev) => ({
                                    ...prev,
                                    protocol: event.target.value,
                                }))
                            }
                        />
                    </div>

                    <div className='space-y-1'>
                        <label className='block text-xs font-semibold uppercase tracking-wider text-muted'>
                            Parser
                        </label>
                        <input
                            className='w-full rounded border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent'
                            value={form.parser}
                            onChange={(event) =>
                                setForm((prev) => ({
                                    ...prev,
                                    parser: event.target.value,
                                }))
                            }
                        />
                    </div>

                    <div className='space-y-1'>
                        <label className='block text-xs font-semibold uppercase tracking-wider text-muted'>
                            Pipeline ID
                        </label>
                        <input
                            className='w-full rounded border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent'
                            value={form.pipelineid}
                            onChange={(event) =>
                                setForm((prev) => ({
                                    ...prev,
                                    pipelineid: event.target.value,
                                }))
                            }
                        />
                    </div>

                    {actionError && (
                        <p className='rounded bg-error/20 px-3 py-2 text-sm text-error'>
                            {actionError}
                        </p>
                    )}
                </div>
            </Drawer>

            <ConfirmModal
                open={confirmItem !== null}
                title='Eliminar fuente'
                message={`¿Seguro que quieres eliminar "${confirmItem?.name}"? Esta acción no se puede deshacer.`}
                onConfirm={() => confirmItem && handleDelete(confirmItem)}
                onCancel={() => setConfirmItem(null)}
            />
        </main>
    );
}
