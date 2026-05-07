import { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingState from "../components/LoadingState";
import { useRuleAlerts } from "../hooks/useRules";

function formatDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
}

export default function RuleAlertsPage() {
    const navigate = useNavigate();
    const { alerts, loading, error } = useRuleAlerts();
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    return (
        <main className="flex h-full flex-col overflow-hidden">
            <div className="flex shrink-0 items-center justify-between border-b border-border bg-background px-6 py-4">
                <div>
                    <h1 className="text-xl font-semibold text-text-logo">Alertas de reglas</h1>
                    <p className="text-xs text-muted">Eventos disparados por el motor de reglas</p>
                </div>
                <button
                    onClick={() => navigate("/rules")}
                    className="rounded border border-border px-3 py-1.5 text-sm text-muted hover:bg-primary/30"
                >
                    ← Volver a reglas
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                {error ? (
                    <p className="mb-4 rounded bg-error/20 px-3 py-2 text-sm text-error">{error}</p>
                ) : null}

                {loading ? (
                    <LoadingState message="Cargando alertas…" />
                ) : alerts.length === 0 ? (
                    <p className="rounded border border-border/70 p-4 text-sm text-muted">
                        No hay alertas generadas.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {alerts.map((alert) => {
                            const isExpanded = Boolean(expanded[alert.id]);
                            return (
                                <article
                                    key={alert.id}
                                    className="rounded border border-border bg-surface"
                                >
                                    <button
                                        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                                        onClick={() =>
                                            setExpanded((current) => ({
                                                ...current,
                                                [alert.id]: !isExpanded,
                                            }))
                                        }
                                    >
                                        <div className="space-y-1">
                                            <p className="text-sm font-semibold text-text">{alert.message}</p>
                                            <p className="text-xs text-muted">
                                                {formatDate(alert.timestamp)} · {alert.rule_name} · {alert.severity}
                                            </p>
                                        </div>
                                        <span className="text-xs text-muted">
                                            {alert.status} {isExpanded ? "▲" : "▼"}
                                        </span>
                                    </button>
                                    {isExpanded ? (
                                        <div className="border-t border-border px-4 py-3">
                                            <pre className="overflow-x-auto rounded bg-primary/20 p-2 text-xs text-text">
                                                {JSON.stringify(alert.details, null, 2)}
                                            </pre>
                                        </div>
                                    ) : null}
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>
        </main>
    );
}
