import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMappings } from "../hooks/useMappings";
import { deleteMapping } from "../services/api";
import type { Mapping } from "../types";
import ConfirmModal from "../components/ConfirmModal";
import DataTable from "../components/DataTable";
import LoadingState from "../components/LoadingState";

export default function MappingsPage() {
    const { mappings, loading, error, refetch } = useMappings();
    const navigate = useNavigate();

    const [confirmItem, setConfirmItem] = useState<Mapping | null>(null);
    const [actionError, setActionError] = useState("");

    async function handleDelete(m: Mapping) {
        try {
            await deleteMapping(m.id);
            refetch();
        } catch (err) {
            setActionError((err as Error).message || "Error al eliminar mapping");
        } finally {
            setConfirmItem(null);
        }
    }

    function handleDuplicate(m: Mapping) {
        navigate("/mappings/new", {
            state: { name: `${m.name} (copia)`, fields: m.fields },
        });
    }

    const tableRows = mappings.map((m) => [
        <span className="font-mono text-xs text-muted">{m.id}</span>,
        <button
            onClick={() => navigate(`/mappings/${m.id}`)}
            className="text-left text-sm text-text hover:underline"
        >
            {m.name}
        </button>,
        <div className="flex flex-wrap gap-1">
            {m.fields.map((f) => (
                <span
                    key={f.name}
                    className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs text-muted"
                >
                    {f.name}:{f.type}
                </span>
            ))}
        </div>,
        <span className="font-mono text-xs text-muted">{m.fields.length}</span>,
        <div className="flex gap-1.5">
            <button
                onClick={() => navigate(`/mappings/${m.id}/edit`)}
                className="rounded border border-border px-2 py-0.5 text-xs text-muted hover:bg-primary/30"
            >
                Editar
            </button>
            <button
                onClick={() => handleDuplicate(m)}
                className="rounded border border-border px-2 py-0.5 text-xs text-muted hover:bg-primary/30"
            >
                Duplicar
            </button>
            <button
                onClick={() => setConfirmItem(m)}
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
                    <h1 className="text-xl font-semibold text-text-logo">Mappings</h1>
                    <p className="text-xs text-muted">Define la estructura de campos de tus fuentes de logs</p>
                </div>
                <button
                    onClick={() => navigate("/mappings/new")}
                    className="rounded bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/80"
                >
                    + Nuevo mapping
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
                    <LoadingState message="Cargando mappings…" />
                ) : (
                    <DataTable
                        headers={["ID", "Nombre", "Campos", "Nº campos", "Acciones"]}
                        rows={tableRows}
                        emptyMessage="No hay mappings configurados"
                    />
                )}
            </div>

            <ConfirmModal
                open={confirmItem !== null}
                title="Eliminar mapping"
                message={`¿Seguro que quieres eliminar "${confirmItem?.name}"? Esta acción no se puede deshacer.`}
                onConfirm={() => confirmItem && handleDelete(confirmItem)}
                onCancel={() => setConfirmItem(null)}
            />
        </main>
    );
}
