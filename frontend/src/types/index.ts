export type LogEntry = {
    _row_key: string;
    timestamp: number;
    sourceid: number;
    data: Record<string, unknown>;
};

export type SourceConfig = {
    id: number;
    name: string;
    port: number;
    protocol: string;
    parser: string;
    pipelineid: number;
};

export type TimeWindow = {
    label: string;
    value: string;
    ms: number | null;
};

export type LogFilters = {
    sourceId: number | null;
    timeWindow: string;
    filterText: string;
    columns: string[];
    page: number;
    pageSize: number;
};

export type FieldType = "integer" | "decimal" | "string" | "boolean" | "date" | "ip";

export type MappingField = {
    name: string;
    type: FieldType;
};

export type Mapping = {
    id: number;
    name: string;
    fields: MappingField[];
};

export type ProcessorType = "set" | "drop" | "copy" | "call_pipeline" | "rename" | "lowercase" | "uppercase";

export type Processor = {
    type: ProcessorType;
    config: Record<string, unknown>;
};

export type Pipeline = {
    id: number;
    name: string;
    processors: Processor[];
};
