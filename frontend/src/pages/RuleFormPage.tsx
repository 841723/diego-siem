import { type FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import LoadingState from "../components/LoadingState";
import RuleConfigFields from "../components/RuleConfigFields";
import { createRule, getRule, updateRule } from "../services/api";
import type { Rule, RuleSeverity, RuleType } from "../types";
import {
    getDefaultConfigForRuleType,
    RULE_SEVERITIES,
    RULE_TYPES,
} from "../types/rules";

const DEFAULT_TYPE: RuleType = "threshold";
const DEFAULT_SEVERITY: RuleSeverity = "medium";

export default function RuleFormPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isEdit = Boolean(id);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [type, setType] = useState<RuleType>(DEFAULT_TYPE);
    const [enabled, setEnabled] = useState(true);
    const [severity, setSeverity] = useState<RuleSeverity>(DEFAULT_SEVERITY);
    const [config, setConfig] = useState<Record<string, unknown>>(
        getDefaultConfigForRuleType(DEFAULT_TYPE),
    );

    const [loadingItem, setLoadingItem] = useState(isEdit);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!isEdit || !id) return;
        let cancelled = false;
        setLoadingItem(true);
        setError("");

        getRule(id)
            .then((rule) => {
                if (cancelled) return;
                setName(rule.name);
                setDescription(rule.description ?? "");
                setType(rule.type);
                setEnabled(rule.enabled);
                setSeverity(rule.severity);
                setConfig(rule.config ?? getDefaultConfigForRuleType(rule.type));
            })
            .catch((err: Error) => {
                if (!cancelled) {
                    setError(err.message || "Error cargando regla");
                }
            })
            .finally(() => {
                if (!cancelled) setLoadingItem(false);
            });

        return () => {
            cancelled = true;
        };
    }, [id, isEdit]);

    function handleTypeChange(nextType: RuleType) {
        setType(nextType);
        setConfig(getDefaultConfigForRuleType(nextType));
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSubmitting(true);
        setError("");

        const payload: Omit<Rule, "id"> = {
            name,
            description,
            type,
            enabled,
            severity,
            config,
            last_execution_at: null,
        };

        try {
            if (isEdit && id) {
                await updateRule(id, payload);
            } else {
                await createRule(payload);
            }
            navigate("/rules");
        } catch (err) {
            setError((err as Error).message || "Error guardando regla");
        } finally {
            setSubmitting(false);
        }
    }

    if (loadingItem) return <LoadingState message="Cargando regla…" />;

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
                        {isEdit ? "Editar regla" : "Nueva regla"}
                    </h1>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                <div className="mx-auto max-w-4xl">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="space-y-1 sm:col-span-2">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                                    Nombre
                                </label>
                                <input
                                    className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent"
                                    value={name}
                                    onChange={(event) => setName(event.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-1 sm:col-span-2">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                                    Descripción
                                </label>
                                <textarea
                                    className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent"
                                    rows={2}
                                    value={description}
                                    onChange={(event) =>
                                        setDescription(event.target.value)
                                    }
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                                    Tipo
                                </label>
                                <select
                                    className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent"
                                    value={type}
                                    onChange={(event) =>
                                        handleTypeChange(event.target.value as RuleType)
                                    }
                                >
                                    {RULE_TYPES.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                                    Severidad
                                </label>
                                <select
                                    className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent"
                                    value={severity}
                                    onChange={(event) =>
                                        setSeverity(event.target.value as RuleSeverity)
                                    }
                                >
                                    {RULE_SEVERITIES.map((item) => (
                                        <option key={item} value={item}>
                                            {item}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <label className="flex items-center gap-2 rounded border border-border bg-surface/60 px-3 py-2 text-sm text-text">
                            <input
                                type="checkbox"
                                className="h-4 w-4 accent-accent"
                                checked={enabled}
                                onChange={(event) => setEnabled(event.target.checked)}
                            />
                            Regla habilitada
                        </label>

                        <RuleConfigFields
                            type={type}
                            config={config}
                            onChange={setConfig}
                        />

                        <div className="rounded-xl border border-border bg-surface/60 p-4">
                            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                                Preview de configuración
                            </h2>
                            <pre className="overflow-auto rounded bg-primary/20 p-2 text-xs text-text">
                                {JSON.stringify(
                                    { type, severity, enabled, config },
                                    null,
                                    2,
                                )}
                            </pre>
                        </div>

                        {error && (
                            <p className="rounded bg-error/20 px-3 py-2 text-sm text-error">
                                {error}
                            </p>
                        )}

                        <div className="flex gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="rounded bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent/80 disabled:opacity-50"
                            >
                                {submitting
                                    ? "Guardando…"
                                    : isEdit
                                      ? "Guardar cambios"
                                      : "Crear regla"}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate("/rules")}
                                className="rounded border border-border px-5 py-2 text-sm text-muted hover:bg-primary/30"
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    );
}
