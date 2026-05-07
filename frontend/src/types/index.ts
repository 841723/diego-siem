export type LogEntry = {
    _row_key: string;
    timestamp: string;
    sourceid: string | number;
    data: Record<string, unknown>;
};

export type SourceConfig = {
    id: string;
    name: string;
    port: number;
    protocol: string;
    parser: string;
    pipelineid: string;
};

export type TimeWindow = {
    label: string;
    value: string;
    ms: number | null;
};

export type LogFilters = {
    sourceId: string | null;
    timeWindow: string;
    filterText: string;
    columns: string[];
    page: number;
    pageSize: number;
};

// ── Pipelines ────────────────────────────────────────────────────────────────

/** Pipeline as returned by GET /pipelines and GET /pipelines/:id */
export type Pipeline = {
    id: string;
    name: string;
    description: string;
};

export type DynamicFieldType =
    | "string"
    | "number"
    | "boolean"
    | "uuid"
    | "json"
    | "array";

export interface DynamicSchema {
    [key: string]: DynamicFieldType | DynamicSchema;
}

export type ProcessorDefinition = {
    id: string;
    name: string;
    description: string;
    schema: DynamicSchema;
};

/** Client-side draft of a single processor inside a pipeline form */
export type PipelineProcessorDraft = {
    id?: string;
    type: string;
    config: Record<string, unknown>;
};

export type PipelineProcessor = {
    id: string;
    pipelineid: string;
    type: string;
    config: Record<string, unknown>;
};

// ── Rules ────────────────────────────────────────────────────────────────────

export type RuleSeverity = "low" | "medium" | "high" | "critical";

export type RuleType =
    | "threshold"
    | "match"
    | "correlation"
    | "aggregation"
    | "temporal"
    | string;

export type RuleDefinition = {
    type: RuleType;
    label: string;
    description: string;
    schema: DynamicSchema;
};

export type Rule = {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    type: RuleType;
    severity: RuleSeverity;
    config: Record<string, unknown>;
    last_execution_at: string | null;
    created_at: string;
    updated_at: string;
};

export type RuleAlert = {
    id: string;
    timestamp: string;
    rule_id: string;
    rule_name: string;
    severity: RuleSeverity;
    message: string;
    status: "open" | "acknowledged" | "resolved" | string;
    details: Record<string, unknown>;
};

// ── Mapping (global) ─────────────────────────────────────────────────────────

/**
 * A single field in the global mapping schema.
 * Matches the backend Mapping model: { fieldname, fieldtypeid, default_value }
 */
export type MappingField = {
    fieldname: string;
    fieldtypeid: string;
    defaultvalue: string;
};

/** A field type returned by GET /mappings/types */
export type MappingType = {
    id: string;
    typename: string;
    displayname: string;
};
