import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { deleteMapping, getMapping } from "../services/api";
import type { Mapping } from "../types";
import ConfirmModal from "../components/ConfirmModal";
import LoadingState from "../components/LoadingState";

export default function MappingDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [mapping, setMapping] = useState<Mapping | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [confirmOpen, setConfirmOpen] = useState(false);

    useEffect(() => {
        if (!id) return;
        let cancelled = false;
        setLoading(true);
        getMapping(id)
            .then((m) => { if (!cancelled) setMapping(m); })
            .catch((err: Error) => { if (!cancelled) setError(err.message || "Error cargando mapping"); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [id]);

    async function handleDelete() {
        if (!id) return;
        try {
            await deleteMapping(id);
            navigate("/mappings");
        } catch (err) {
            setError((err as Error).message || "Error al eliminar mapping");
            setConfirmOpen(false);
        }
    }

    function handleDuplicate() {
        if (!mapping) return;
        navigate("/mappings/new", {
            state: { name: `${mapping.name} (copia)`, fields: mapping.fields },
        });
    }

    return (
        <main className="flex flex-col h-full overflow-hidden">
            {/* Top bar */}
            <div className="flex items-center justify-between border-b border-border bg-background px-6 py-4 shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate("/mappings")}
                        className="rounded border border-border px-3 py-1.5 text-sm text-muted hover:bg-primary/30"
                    >
                        ← Volver
                    </button>
                    <h1 className="text-xl font-semibold text-text-logo">
                        {mapping ? mapping.name : "Mapping"}
                    </h1>
                </div>

                {mapping && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => navigate(`/mappings/${id}/edit`)}
                            className="rounded border border-border px-3 py-1.5 text-sm text-muted hover:bg-primary/30"
                        >
                            Editar
                        </button>
                        <button
                            onClick={handleDuplicate}
                            className="rounded border border-border px-3 py-1.5 text-sm text-muted hover:bg-primary/30"
                        >
                            Duplicar
                        </button>
                        <button
                            onClick={() => setConfirmOpen(true)}
                            className="rounded border border-error/50 px-3 py-1.5 text-sm text-error hover:bg-error/10"
                        >
                            Eliminar
                        </button>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {loading ? (
                    <LoadingState message="Cargando mapping…" />
                ) : error ? (
                    <p className="rounded bg-error/20 px-3 py-2 text-sm text-error">{error}</p>
                ) : mapping ? (
                    <div className="mx-auto max-w-2xl space-y-6">
                        <dl className="overflow-hidden rounded-xl border border-border">
                            {(
                                [
                                    ["ID", String(mapping.id)],
                                    ["Nombre", mapping.name],
                                    ["Nº campos", String(mapping.fields.length)],
                                ] as [string, string][]
                            ).map(([label, value], i) => (
                                <div
                                    key={label}
                                    className={`flex gap-4 px-4 py-3 ${i % 2 === 0 ? "bg-primary/30" : "bg-primary/20"}`}
                                >
                                    <dt className="w-32 shrink-0 text-xs font-semibold uppercase tracking-wider text-muted">
                                        {label}
                                    </dt>
                                    <dd className="font-mono text-sm text-text">{value}</dd>
                                </div>
                            ))}
                        </dl>

                        {/* Fields table */}
                        <div>
                            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
                                Campos ({mapping.fields.length})
                            </h2>
                            <div className="overflow-auto rounded-xl border border-border">
                                <table className="min-w-full border-collapse text-sm">
                                    <thead className="bg-secondary">
                                        <tr>
                                            {["#", "Nombre", "Tipo"].map((h) => (
                                                <th
                                                    key={h}
                                                    className="border-b border-border p-2 text-left text-xs font-semibold text-text-logo"
                                                >
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {mapping.fields.map((f, i) => (
                                            <tr key={i} className="odd:bg-primary/30 even:bg-primary/20">
                                                <td className="border-b border-border p-2 font-mono text-xs text-muted">
                                                    {i + 1}
                                                </td>
                                                <td className="border-b border-border p-2 font-mono text-xs text-text">
                                                    {f.name}
                                                </td>
                                                <td className="border-b border-border p-2">
                                                    <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs text-muted">
                                                        {f.type}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>

            <ConfirmModal
                open={confirmOpen}
                title="Eliminar mapping"
                message={`¿Seguro que quieres eliminar "${mapping?.name}"? Esta acción no se puede deshacer.`}
                onConfirm={handleDelete}
                onCancel={() => setConfirmOpen(false)}
            />
        </main>
    );
}
