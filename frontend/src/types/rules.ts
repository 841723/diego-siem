import type { RuleSeverity, RuleType } from "./index";

export const RULE_TYPES: Array<{ id: RuleType; label: string }> = [
    { id: "threshold", label: "Threshold" },
    { id: "match", label: "Match" },
    { id: "correlation", label: "Correlation" },
    { id: "aggregation", label: "Aggregation" },
    { id: "temporal", label: "Temporal" },
];

export const RULE_SEVERITIES: RuleSeverity[] = [
    "low",
    "medium",
    "high",
    "critical",
];

export type RuleConfigFieldType =
    | "text"
    | "number"
    | "boolean"
    | "json"
    | "text-list";

export type RuleConfigSchema = Record<
    RuleType,
    Array<{
        key: string;
        label: string;
        type: RuleConfigFieldType;
    }>
>;

export const RULE_CONFIG_SCHEMA: RuleConfigSchema = {
    threshold: [
        { key: "field", label: "Campo", type: "text" },
        { key: "operator", label: "Operador", type: "text" },
        { key: "value", label: "Valor umbral", type: "number" },
        { key: "window_minutes", label: "Ventana (minutos)", type: "number" },
    ],
    match: [
        { key: "field", label: "Campo", type: "text" },
        { key: "pattern", label: "Patrón", type: "text" },
        { key: "case_sensitive", label: "Case sensitive", type: "boolean" },
    ],
    correlation: [
        { key: "query_a", label: "Consulta A", type: "text" },
        { key: "query_b", label: "Consulta B", type: "text" },
        {
            key: "join_fields",
            label: "Campos de correlación",
            type: "text-list",
        },
        { key: "window_minutes", label: "Ventana (minutos)", type: "number" },
    ],
    aggregation: [
        { key: "group_by", label: "Group by (campos)", type: "text-list" },
        { key: "metric", label: "Métrica", type: "text" },
        { key: "operator", label: "Operador", type: "text" },
        { key: "threshold", label: "Threshold", type: "number" },
        { key: "window_minutes", label: "Ventana (minutos)", type: "number" },
    ],
    temporal: [
        { key: "sequence", label: "Secuencia esperada", type: "text-list" },
        { key: "max_gap_seconds", label: "Gap máximo (segundos)", type: "number" },
        { key: "strict_order", label: "Orden estricto", type: "boolean" },
        { key: "context_query", label: "Contexto (JSON)", type: "json" },
    ],
};

export function defaultConfigForRuleType(type: RuleType): Record<string, unknown> {
    return RULE_CONFIG_SCHEMA[type].reduce<Record<string, unknown>>((acc, field) => {
        if (field.type === "number") {
            acc[field.key] = 0;
        } else if (field.type === "boolean") {
            acc[field.key] = false;
        } else if (field.type === "text-list") {
            acc[field.key] = [];
        } else if (field.type === "json") {
            acc[field.key] = {};
        } else {
            acc[field.key] = "";
        }
        return acc;
    }, {});
}
