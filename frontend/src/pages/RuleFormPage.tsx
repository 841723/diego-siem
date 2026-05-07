import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import DynamicSchemaFields from "../components/DynamicSchemaFields";
import LoadingState from "../components/LoadingState";
import { useRuleDefinitions } from "../hooks/useRules";
import { createRule, getRule, updateRule } from "../services/api";
import type { DynamicSchema, RuleSeverity, RuleType } from "../types";

type PrefillState = {
    name?: string;
    description?: string;
    enabled?: boolean;
    type?: RuleType;
    severity?: RuleSeverity;
    config?: Record<string, unknown>;
};

const SEVERITIES: RuleSeverity[] = ["low", "medium", "high", "critical"];

function defaultsFromSchema(schema: DynamicSchema): Record<string, unknown> {
    const output: Record<string, unknown> = {};
    for (const [key, descriptor] of Object.entries(schema)) {
        if (typeof descriptor === "object") {
            output[key] = defaultsFromSchema(descriptor);
            continue;
        }
        output[key] =
            descriptor === "number"
                ? 0
                : descriptor === "boolean"
                  ? false
                  : descriptor === "array"
                    ? []
                    : descriptor === "json"
                      ? {}
                      : "";
    }
    return output;
}

export default function RuleFormPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const isEdit = Boolean(id);
    const prefill = (location.state as PrefillState | null) ?? null;

    const { definitions, loading: definitionsLoading, error: definitionsError } =
        useRuleDefinitions();

    const [name, setName] = useState(prefill?.name ?? "");
    const [description, setDescription] = useState(prefill?.description ?? "");
    const [enabled, setEnabled] = useState(prefill?.enabled ?? true);
    const [type, setType] = useState<RuleType>(prefill?.type ?? "");
    const [severity, setSeverity] = useState<RuleSeverity>(prefill?.severity ?? "medium");
    const [config, setConfig] = useState<Record<string, unknown>>(prefill?.config ?? {});
    const [loadingRule, setLoadingRule] = useState(isEdit);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (definitions.length > 0 && !type) {
            const first = definitions[0];
            setType(first.type);
            setConfig(defaultsFromSchema(first.schema));
        }
    }, [definitions, type]);

    useEffect(() => {
        if (!isEdit || !id) return;
        let cancelled = false;
        setLoadingRule(true);
        getRule(id)
            .then((rule) => {
                if (!cancelled) {
                    setName(rule.name);
                    setDescription(rule.description ?? "");
                    setEnabled(rule.enabled);
                    setType(rule.type);
                    setSeverity(rule.severity);
                    setConfig(rule.config ?? {});
                }
            })
            .catch((err: Error) => {
                if (!cancelled) setError(err.message || "Error cargando regla");
            })
            .finally(() => {
                if (!cancelled) setLoadingRule(false);
            });
        return () => {
            cancelled = true;
        };
    }, [id, isEdit]);

    const selectedDefinition = useMemo(
        () => definitions.find((item) => item.type === type) ?? null,
        [definitions, type],
    );

    function handleTypeChange(nextType: string) {
        setType(nextType);
        const definition = definitions.find((item) => item.type === nextType);
        setConfig(definition ? defaultsFromSchema(definition.schema) : {});
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSubmitting(true);
        setError("");
        try {
            const payload = { name, description, enabled, type, severity, config };
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

    if (loadingRule) return <LoadingState message="Cargando regla…" />;

    return (
        <main className="flex h-full flex-col overflow-hidden">
            <div className="flex shrink-0 items-center gap-4 border-b border-border bg-background px-6 py-4">
                <button
                    onClick={() => navigate("/rules")}
                    className="rounded border border-border px-3 py-1.5 text-sm text-muted hover:bg-primary/30"
                >
                    ← Volver
                </button>
                <h1 className="text-xl font-semibold text-text-logo">
                    {isEdit ? "Editar regla" : prefill ? "Duplicar regla" : "Nueva regla"}
                </h1>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                <div className="mx-auto max-w-3xl">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1">
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

                        <div className="space-y-1">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                                Descripción
                            </label>
                            <textarea
                                className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent"
                                rows={2}
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <label className="space-y-1">
                                <span className="block text-xs font-semibold uppercase tracking-wider text-muted">
                                    Tipo
                                </span>
                                <select
                                    className="w-full rounded border border-border bg-surface px-2 py-1 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
                                    value={type}
                                    onChange={(event) => handleTypeChange(event.target.value)}
                                    disabled={definitionsLoading}
                                    required
                                >
                                    {definitions.map((definition) => (
                                        <option key={definition.type} value={definition.type}>
                                            {definition.label}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="space-y-1">
                                <span className="block text-xs font-semibold uppercase tracking-wider text-muted">
                                    Severidad
                                </span>
                                <select
                                    className="w-full rounded border border-border bg-surface px-2 py-1 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
                                    value={severity}
                                    onChange={(event) =>
                                        setSeverity(event.target.value as RuleSeverity)
                                    }
                                >
                                    {SEVERITIES.map((level) => (
                                        <option key={level} value={level}>
                                            {level}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="space-y-1">
                                <span className="block text-xs font-semibold uppercase tracking-wider text-muted">
                                    Estado
                                </span>
                                <select
                                    className="w-full rounded border border-border bg-surface px-2 py-1 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
                                    value={enabled ? "enabled" : "disabled"}
                                    onChange={(event) =>
                                        setEnabled(event.target.value === "enabled")
                                    }
                                >
                                    <option value="enabled">Enabled</option>
                                    <option value="disabled">Disabled</option>
                                </select>
                            </label>
                        </div>

                        <div className="space-y-2 rounded border border-border p-3">
                            <div>
                                <h2 className="text-sm font-semibold text-text">Configuración dinámica</h2>
                                <p className="text-xs text-muted">
                                    {selectedDefinition?.description || "Configura parámetros según el tipo de regla."}
                                </p>
                            </div>
                            {definitionsError ? (
                                <p className="rounded bg-error/20 px-3 py-2 text-sm text-error">
                                    {definitionsError}
                                </p>
                            ) : null}
                            <DynamicSchemaFields
                                schema={selectedDefinition?.schema ?? {}}
                                value={config}
                                onChange={setConfig}
                            />
                        </div>

                        {error ? (
                            <p className="rounded bg-error/20 px-3 py-2 text-sm text-error">{error}</p>
                        ) : null}

                        <div className="flex gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={submitting || definitionsLoading || definitions.length === 0}
                                className="rounded bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent/80 disabled:opacity-50"
                            >
                                {submitting ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear regla"}
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
