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
