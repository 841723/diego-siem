import type {
    FullPipeline,
    LogEntry,
    MappingField,
    MappingType,
    Pipeline,
    PipelineProcessor,
    ProcessorDefinition,
    Rule,
    RuleAlert,
    SourceConfig,
} from "../types";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, init);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    if (response.status === 204) return null as T;

    const text = await response.text();
    if (!text) return null as T;
    return JSON.parse(text) as T;
}

function asRecord(value: unknown): Record<string, unknown> {
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        return value as Record<string, unknown>;
    }
    return {};
}

function normalizeProcessorDefinition(raw: unknown): ProcessorDefinition {
    const item = asRecord(raw);
    const humanDescription =
        item.humanDescription ??
        item.humandescription ??
        item.description ??
        "";
    return {
        id: String(item.id ?? ""),
        name: String(item.name ?? ""),
        description: String(item.description ?? ""),
        humanDescription: String(humanDescription),
        schema: asRecord(item.schema ?? item.config),
    };
}

function normalizePipelineProcessor(raw: unknown): PipelineProcessor {
    const item = asRecord(raw);
    const config = item.config;
    let parsedConfig: Record<string, unknown> = {};

    if (typeof config === "string") {
        try {
            parsedConfig = asRecord(JSON.parse(config));
        } catch {
            parsedConfig = {};
        }
    } else {
        parsedConfig = asRecord(config);
    }

    const processorRaw = item.processor;
    const pipelineRaw = item.pipeline;

    return {
        id: String(item.id ?? ""),
        pipelineid: String(item.pipelineid ?? ""),
        processorid: String(item.processorid ?? ""),
        config: parsedConfig,
        processor:
            typeof processorRaw === "object" && processorRaw !== null
                ? normalizeProcessorDefinition(processorRaw)
                : undefined,
        pipeline:
            typeof pipelineRaw === "object" && pipelineRaw !== null
                ? {
                      id: String(asRecord(pipelineRaw).id ?? ""),
                      name: String(asRecord(pipelineRaw).name ?? ""),
                      description: String(
                          asRecord(pipelineRaw).description ?? "",
                      ),
                  }
                : undefined,
        order: typeof item.order === "number" ? item.order : 0,
    };
}

// ── Sources ──────────────────────────────────────────────────────────────────

export async function getSources(): Promise<SourceConfig[]> {
    const payload = await request<SourceConfig[]>("/sources");
    return Array.isArray(payload) ? payload : [];
}

export async function getSource(id: string): Promise<SourceConfig> {
    return request<SourceConfig>(`/sources/${id}`);
}

export async function createSource(
    source: Omit<SourceConfig, "id"> & { id?: string },
): Promise<void> {
    await request<void>("/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(source),
    });
}

export async function updateSource(
    id: string,
    source: Omit<SourceConfig, "id">,
): Promise<void> {
    await request<void>(`/sources/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(source),
    });
}

export async function deleteSource(id: string): Promise<void> {
    await request<void>(`/sources/${id}`, { method: "DELETE" });
}

export async function deleteSources(): Promise<void> {
    await request<void>("/sources", { method: "DELETE" });
}

// ── Logs ─────────────────────────────────────────────────────────────────────

function normalizeLogs(payload: unknown): LogEntry[] {
    const raw: Array<Omit<LogEntry, "_row_key">> = Array.isArray(payload)
        ? (payload as Array<Omit<LogEntry, "_row_key">>)
        : Array.isArray((payload as { logs?: unknown[] })?.logs)
          ? ((payload as { logs: Array<Omit<LogEntry, "_row_key">> }).logs ?? [])
          : [];

    const seen = new Map<string, number>();
    return raw.map((log) => {
        const sig = `${log.sourceid}-${log.timestamp}-${JSON.stringify(log.data ?? {})}`;
        const count = (seen.get(sig) ?? 0) + 1;
        seen.set(sig, count);
        return { ...log, _row_key: `${sig}-${count}` };
    });
}

export async function getLogs(
    sourceId: string,
    timeWindow: string,
    from: number,
    size: number,
): Promise<{ logs: LogEntry[]; total: number }> {
    const payload = await request<unknown>(`/logs/${sourceId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            timeWindow,
            from,
            size,
            query: {},
            aggs: [
                // {
                //     name: "total",
                //     type: "count",
                //     field: "timestamp",
                // },
                // {
                //     name: "mean_numseq",
                //     type: "avg",
                //     field: "numseq",
                // },
                // {
                //     name: "stats_timestamp",
                //     type: "stats",
                //     field: "timestamp",
                // },
            ],
        }),
    });
    const { logs, total } = payload as { logs: unknown[]; total: number };
    return { logs: normalizeLogs(logs), total };
}

// ── Pipelines ─────────────────────────────────────────────────────────────────

export async function getPipelines(): Promise<Pipeline[]> {
    const payload = await request<Pipeline[]>("/pipelines");
    return Array.isArray(payload) ? payload : [];
}

export async function getPipeline(id: string): Promise<Pipeline> {
    return request<Pipeline>(`/pipelines/${id}`);
}

export async function getPipelineFull(id: string): Promise<FullPipeline> {
    const payload = await request<unknown>(`/pipelines/${id}/full`);
    const data = asRecord(payload);
    return {
        pipeline: {
            id: String(asRecord(data.pipeline).id ?? ""),
            name: String(asRecord(data.pipeline).name ?? ""),
            description: String(asRecord(data.pipeline).description ?? ""),
        },
        processors: Array.isArray(data.processors)
            ? data.processors.map(normalizePipelineProcessor)
            : [],
    };
}

export async function createPipeline(
    pipeline: Pick<Pipeline, "id" | "name" | "description">,
): Promise<Pipeline> {
    return request<Pipeline>("/pipelines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pipeline),
    });
}

export async function updatePipeline(
    id: string,
    pipeline: Pick<Pipeline, "name" | "description">,
): Promise<void> {
    await request<void>(`/pipelines/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pipeline),
    });
}

export async function deletePipeline(id: string): Promise<void> {
    await request<void>(`/pipelines/${id}`, { method: "DELETE" });
}

export async function getPipelineProcessors(
    pipelineId: string,
): Promise<PipelineProcessor[]> {
    const payload = await request<unknown>(`/pipelines/${pipelineId}/processors`);
    return Array.isArray(payload) ? payload.map(normalizePipelineProcessor) : [];
}

// export async function createPipelineProcessor(
//     pipelineId: string,
//     processor: Pick<PipelineProcessor, "id" | "processorid" | "config">,
// ): Promise<PipelineProcessor> {
//     const payload = await request<unknown>(`/pipelines/${pipelineId}/processors`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(processor),
//     });
//     return normalizePipelineProcessor(payload);
// }

export async function updatePipelineProcessor(
    pipelineId: string,
    processors: Array<Pick<PipelineProcessor, "id" | "processorid" | "config">>,
): Promise<void> {
    await request<unknown>(
        `/pipelines/${pipelineId}/processors`,
        {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(processors),
        },
    );
}

export async function deletePipelineProcessor(
    pipelineId: string,
    processorId: string,
): Promise<void> {
    await request<void>(`/pipelines/${pipelineId}/processors/${processorId}`, {
        method: "DELETE",
    });
}

// ── Processor definitions ─────────────────────────────────────────────────────

export async function getProcessors(): Promise<ProcessorDefinition[]> {
    const payload = await request<unknown>("/processors");
    return Array.isArray(payload) ? payload.map(normalizeProcessorDefinition) : [];
}

// ── Global Mapping (GET /mappings, POST /mappings) ───────────────────────────

export async function getGlobalMapping(): Promise<MappingField[]> {
    const payload = await request<MappingField[]>("/mappings");
    return Array.isArray(payload) ? payload : [];
}

export async function setGlobalMapping(fields: MappingField[]): Promise<void> {
    await request<void>("/mappings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
    });
}

export async function getMappingTypes(): Promise<MappingType[]> {
    const payload = await request<MappingType[]>("/mappings/types");
    return Array.isArray(payload) ? payload : [];
}

// ── Rules & alerts ────────────────────────────────────────────────────────────

export async function getRules(): Promise<Rule[]> {
    const payload = await request<Rule[]>("/rules");
    return Array.isArray(payload) ? payload : [];
}

export async function getRule(id: string): Promise<Rule> {
    return request<Rule>(`/rules/${id}`);
}

export async function createRule(
    rule: Omit<Rule, "id"> & { id?: string },
): Promise<Rule> {
    return request<Rule>("/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rule),
    });
}

export async function updateRule(
    id: string,
    rule: Omit<Rule, "id">,
): Promise<Rule> {
    return request<Rule>(`/rules/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rule),
    });
}

export async function deleteRule(id: string): Promise<void> {
    await request<void>(`/rules/${id}`, { method: "DELETE" });
}

export async function getRuleAlerts(ruleId?: string): Promise<RuleAlert[]> {
    const query = ruleId ? `?rule_id=${encodeURIComponent(ruleId)}` : "";
    const payload = await request<RuleAlert[]>(`/rules/alerts${query}`);
    return Array.isArray(payload) ? payload : [];
}
