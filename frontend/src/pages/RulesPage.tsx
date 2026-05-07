import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmModal from "../components/ConfirmModal";
import DataTable from "../components/DataTable";
import LoadingState from "../components/LoadingState";
import { useRules } from "../hooks/useRules";
import { createRule, deleteRule } from "../services/api";
import type { Rule } from "../types";

function formatDateTime(value?: string | null): string {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
}

export default function RulesPage() {
    const { rules, loading, error, refetch } = useRules();
    const navigate = useNavigate();

    const [confirmItem, setConfirmItem] = useState<Rule | null>(null);
    const [actionError, setActionError] = useState("");

    async function handleDelete(rule: Rule) {
        try {
            await deleteRule(rule.id);
            refetch();
        } catch (err) {
            setActionError((err as Error).message || "Error al eliminar regla");
        } finally {
            setConfirmItem(null);
        }
    }

    async function handleDuplicate(rule: Rule) {
        try {
            await createRule({
                ...rule,
                id: crypto.randomUUID(),
                name: `${rule.name} (copia)`,
            });
            refetch();
        } catch (err) {
            setActionError((err as Error).message || "Error al duplicar regla");
        }
    }

    const tableRows = rules.map((rule) => [
        <button
            onClick={() => navigate(`/rules/${rule.id}`)}
            className="text-left text-sm text-text hover:underline"
        >
            {rule.name}
        </button>,
        <span
            className={`rounded px-2 py-0.5 text-xs font-semibold ${rule.enabled ? "bg-success/20 text-success" : "bg-warning/20 text-warning"}`}
        >
            {rule.enabled ? "Enabled" : "Disabled"}
        </span>,
        <span className="text-xs text-muted">{rule.type}</span>,
        <span className="text-xs text-muted">{rule.severity}</span>,
        <span className="text-xs text-muted">
            {formatDateTime(rule.last_execution_at)}
        </span>,
        <div className="flex gap-1.5">
            <button
                onClick={() => navigate(`/rules/${rule.id}/edit`)}
                className="rounded border border-border px-2 py-0.5 text-xs text-muted hover:bg-primary/30"
            >
                Editar
            </button>
            <button
                onClick={() => handleDuplicate(rule)}
                className="rounded border border-border px-2 py-0.5 text-xs text-muted hover:bg-primary/30"
            >
                Duplicar
            </button>
            <button
                onClick={() => setConfirmItem(rule)}
                className="rounded border border-error/50 px-2 py-0.5 text-xs text-error hover:bg-error/10"
            >
                Eliminar
            </button>
        </div>,
    ]);

    return (
        <main className="flex h-full flex-col overflow-hidden">
            <div className="shrink-0 border-b border-border bg-background px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-text-logo">Rules</h1>
                        <p className="text-xs text-muted">
                            Gestiona reglas de detección y monitoriza sus alertas
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => navigate("/rules/alerts")}
                            className="rounded border border-border px-4 py-2 text-sm text-muted hover:bg-primary/30"
                        >
                            Ver alertas
                        </button>
                        <button
                            onClick={() => navigate("/rules/new")}
                            className="rounded bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/80"
                        >
                            + Nueva regla
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                {(error || actionError) && (
                    <p className="mb-4 rounded bg-error/20 px-3 py-2 text-sm text-error">
                        {error || actionError}
                    </p>
                )}

                {loading ? (
                    <LoadingState message="Cargando reglas…" />
                ) : (
                    <DataTable
                        headers={[
                            "Regla",
                            "Estado",
                            "Tipo",
                            "Severidad",
                            "Última ejecución",
                            "Acciones",
                        ]}
                        rows={tableRows}
                        emptyMessage="No hay reglas configuradas"
                    />
                )}
            </div>

            <ConfirmModal
                open={confirmItem !== null}
                title="Eliminar regla"
                message={`¿Seguro que quieres eliminar "${confirmItem?.name}"? Esta acción no se puede deshacer.`}
                onConfirm={() => confirmItem && handleDelete(confirmItem)}
                onCancel={() => setConfirmItem(null)}
            />
        </main>
    );
}
