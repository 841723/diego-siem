export type LogEntry = {
    _row_key: string;
    timestamp: string;
    sourceid: string;
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

/**
 * A processor type definition returned by GET /processors.
 * `config` maps each config field name to its value type ("string", "number", "boolean").
 */
export type ProcessorDefinition = {
    id: string;
    name: string;
    description: string;
    config: Record<string, string>;
};

/** Client-side draft of a single processor inside a pipeline form */
export type PipelineProcessorDraft = {
    type: string;
    config: Record<string, unknown>;
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
