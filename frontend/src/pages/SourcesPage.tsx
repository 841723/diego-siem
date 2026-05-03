import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmModal from "../components/ConfirmModal";
import DataTable from "../components/DataTable";
import LoadingState from "../components/LoadingState";
import { useSources } from "../hooks/useSources";
import { deleteSource } from "../services/api";
import type { SourceConfig } from "../types";

export default function SourcesPage() {
    const { sources, loading, error, refetch } = useSources();
    const navigate = useNavigate();

    const [confirmItem, setConfirmItem] = useState<SourceConfig | null>(null);
    const [actionError, setActionError] = useState("");

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

    function handleDuplicate(src: SourceConfig) {
        const { id: _id, ...rest } = src;
        navigate("/sources/new", {
            state: { ...rest, name: `${rest.name} (copia)` },
        });
    }

    const tableRows = sources
        .sort((a, b) => a.id.localeCompare(b.id))
        .map((src) => [
            // <span className="font-mono text-xs text-muted">{src.id}</span>,
            <button
                onClick={() => navigate(`/sources/${src.id}`)}
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
                    onClick={() => navigate(`/sources/${src.id}/edit`)}
                    className='rounded border border-border px-2 py-0.5 text-xs text-muted hover:bg-primary/30'
                >
                    Editar
                </button>
                <button
                    onClick={() => handleDuplicate(src)}
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
                    onClick={() => navigate("/sources/new")}
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
