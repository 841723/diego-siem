import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePipelines } from "../hooks/usePipelines";
import { deletePipeline } from "../services/api";
import type { Pipeline } from "../types";
import ConfirmModal from "../components/ConfirmModal";
import DataTable from "../components/DataTable";
import LoadingState from "../components/LoadingState";

export default function PipelinesPage() {
    const { pipelines, loading, error, refetch } = usePipelines();
    const navigate = useNavigate();

    const [confirmItem, setConfirmItem] = useState<Pipeline | null>(null);
    const [actionError, setActionError] = useState("");

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

    function handleDuplicate(pl: Pipeline) {
        navigate("/pipelines/new", {
            state: { name: `${pl.name} (copia)`, description: pl.description },
        });
    }

    const tableRows = pipelines.map((pl) => [
        <span className="font-mono text-xs text-muted">{pl.id.slice(0, 8)}…</span>,
        <button
            onClick={() => navigate(`/pipelines/${pl.id}`)}
            className="text-left text-sm text-text hover:underline"
        >
            {pl.name}
        </button>,
        <span className="text-xs text-muted line-clamp-2">{pl.description || "—"}</span>,
        <div className="flex gap-1.5">
            <button
                onClick={() => navigate(`/pipelines/${pl.id}/edit`)}
                className="rounded border border-border px-2 py-0.5 text-xs text-muted hover:bg-primary/30"
            >
                Editar
            </button>
            <button
                onClick={() => handleDuplicate(pl)}
                className="rounded border border-border px-2 py-0.5 text-xs text-muted hover:bg-primary/30"
            >
                Duplicar
            </button>
            <button
                onClick={() => setConfirmItem(pl)}
                className="rounded border border-error/50 px-2 py-0.5 text-xs text-error hover:bg-error/10"
            >
                Eliminar
            </button>
        </div>,
    ]);

    return (
        <main className="flex flex-col h-full overflow-hidden">
            {/* Top bar */}
            <div className="flex items-center justify-between border-b border-border bg-background px-6 py-4 shrink-0">
                <div>
                    <h1 className="text-xl font-semibold text-text-logo">Pipelines</h1>
                    <p className="text-xs text-muted">Define cadenas de procesadores para transformar logs entrantes</p>
                </div>
                <button
                    onClick={() => navigate("/pipelines/new")}
                    className="rounded bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/80"
                >
                    + Nuevo pipeline
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-6">
                {(error || actionError) && (
                    <p className="mb-4 rounded bg-error/20 px-3 py-2 text-sm text-error">
                        {error || actionError}
                    </p>
                )}

                {loading ? (
                    <LoadingState message="Cargando pipelines…" />
                ) : (
                    <DataTable
                        headers={["ID", "Nombre", "Descripción", "Acciones"]}
                        rows={tableRows}
                        emptyMessage="No hay pipelines configurados"
                    />
                )}
            </div>

            <ConfirmModal
                open={confirmItem !== null}
                title="Eliminar pipeline"
                message={`¿Seguro que quieres eliminar "${confirmItem?.name}"? Esta acción no se puede deshacer.`}
                onConfirm={() => confirmItem && handleDelete(confirmItem)}
                onCancel={() => setConfirmItem(null)}
            />
        </main>
    );
}
