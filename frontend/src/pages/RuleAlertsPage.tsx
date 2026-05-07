import { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingState from "../components/LoadingState";
import { useRuleAlerts } from "../hooks/useRuleAlerts";

function formatDateTime(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
}

export default function RuleAlertsPage() {
    const navigate = useNavigate();
    const { alerts, loading, error } = useRuleAlerts();
    const [expandedId, setExpandedId] = useState<string | null>(null);

    return (
        <main className="flex h-full flex-col overflow-hidden">
            <div className="shrink-0 border-b border-border bg-background px-6 py-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate("/rules")}
                        className="rounded border border-border px-3 py-1.5 text-sm text-muted hover:bg-primary/30"
                    >
                        ← Volver
                    </button>
                    <h1 className="text-xl font-semibold text-text-logo">
                        Alertas de reglas
                    </h1>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                {error && (
                    <p className="mb-4 rounded bg-error/20 px-3 py-2 text-sm text-error">
                        {error}
                    </p>
                )}

                {loading ? (
                    <LoadingState message="Cargando alertas…" />
                ) : alerts.length === 0 ? (
                    <p className="rounded border border-border bg-surface/60 px-4 py-6 text-center text-sm text-muted">
                        No hay alertas disponibles.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {alerts.map((alert) => {
                            const expanded = expandedId === alert.id;
                            return (
                                <div
                                    key={alert.id}
                                    className="overflow-hidden rounded-xl border border-border"
                                >
                                    <button
                                        onClick={() =>
                                            setExpandedId(expanded ? null : alert.id)
                                        }
                                        className="grid w-full grid-cols-[1.4fr_1.5fr_0.8fr_2fr_0.8fr] gap-2 bg-primary/20 px-3 py-2 text-left hover:bg-primary/30"
                                    >
                                        <span className="text-xs text-muted">
                                            {formatDateTime(alert.timestamp)}
                                        </span>
                                        <span className="text-xs text-text">
                                            {alert.rule_name}
                                        </span>
                                        <span className="text-xs text-muted">
                                            {alert.severity}
                                        </span>
                                        <span className="truncate text-xs text-text">
                                            {alert.message}
                                        </span>
                                        <span className="text-xs text-muted">
                                            {alert.status}
                                        </span>
                                    </button>
                                    {expanded && (
                                        <div className="bg-surface/60 px-3 py-2">
                                            <pre className="overflow-auto rounded bg-primary/20 p-2 text-xs text-text">
                                                {JSON.stringify(
                                                    alert.details ?? {},
                                                    null,
                                                    2,
                                                )}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
}
