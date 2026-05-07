import type {
    DynamicSchema,
    LogEntry,
    MappingField,
    MappingType,
    Pipeline,
    PipelineProcessor,
    ProcessorDefinition,
    Rule,
    RuleAlert,
    RuleDefinition,
    SourceConfig,
} from "../types";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, init);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json() as Promise<T>;
}

function normalizeSchema(input: unknown): DynamicSchema {
    if (!input || typeof input !== "object" || Array.isArray(input)) return {};
    const schema: DynamicSchema = {};
    for (const [key, value] of Object.entries(input)) {
        if (
            value === "string" ||
            value === "number" ||
            value === "boolean" ||
            value === "uuid" ||
            value === "json" ||
            value === "array"
        ) {
            schema[key] = value;
            continue;
        }
        if (typeof value === "string") {
            const lowered = value.toLowerCase();
            schema[key] =
                lowered === "integer" || lowered === "float" || lowered === "int"
                    ? "number"
                    : lowered === "bool"
                      ? "boolean"
                      : lowered === "object"
                        ? "json"
                        : lowered === "[]string" || lowered === "list"
                          ? "array"
                          : lowered === "uuid"
                            ? "uuid"
                            : "string";
            continue;
        }
        schema[key] = normalizeSchema(value);
    }
    return schema;
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
          ? ((payload as { logs: Array<Omit<LogEntry, "_row_key">> }).logs ??
            [])
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
            timeWindow: timeWindow,
            from: from,
            size: size,
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

export async function createPipeline(
    pipeline: Pick<Pipeline, "name" | "description">,
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

export async function getProcessors(): Promise<ProcessorDefinition[]> {
    const payload = await request<
        Array<{
            id: string;
            name: string;
            description?: string;
            schema?: unknown;
            config?: unknown;
        }>
    >("/processors");
    if (!Array.isArray(payload)) return [];
    return payload.map((processor) => ({
        id: processor.id,
        name: processor.name,
        description: processor.description ?? "",
        schema: normalizeSchema(processor.schema ?? processor.config ?? {}),
    }));
}

function parseProcessorConfig(config: unknown): Record<string, unknown> {
    if (typeof config === "string") {
        try {
            const parsed = JSON.parse(config) as unknown;
            return parsed && typeof parsed === "object" && !Array.isArray(parsed)
                ? (parsed as Record<string, unknown>)
                : {};
        } catch {
            return {};
        }
    }
    if (config && typeof config === "object" && !Array.isArray(config)) {
        return config as Record<string, unknown>;
    }
    return {};
}

export async function getPipelineProcessors(
    pipelineId: string,
): Promise<PipelineProcessor[]> {
    const payload = await request<
        Array<{
            id: string;
            pipelineid: string;
            type?: string;
            processorid?: string;
            config: unknown;
        }>
    >(`/pipelines/${pipelineId}/processors`);
    if (!Array.isArray(payload)) return [];
    return payload.map((processor) => ({
        id: processor.id,
        pipelineid: processor.pipelineid,
        type: processor.type ?? processor.processorid ?? "",
        config: parseProcessorConfig(processor.config),
    }));
}

type PipelineProcessorPayload = {
    type: string;
    processorid?: string;
    config: Record<string, unknown>;
    position?: number;
};

export async function createPipelineProcessor(
    pipelineId: string,
    processor: PipelineProcessorPayload,
): Promise<PipelineProcessor> {
    const payload = await request<{
        id: string;
        pipelineid: string;
        type?: string;
        processorid?: string;
        config: unknown;
    }>(`/pipelines/${pipelineId}/processors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(processor),
    });
    return {
        id: payload.id,
        pipelineid: payload.pipelineid,
        type: payload.type ?? payload.processorid ?? processor.type,
        config: parseProcessorConfig(payload.config),
    };
}

export async function updatePipelineProcessor(
    pipelineId: string,
    processorId: string,
    processor: PipelineProcessorPayload,
): Promise<PipelineProcessor> {
    const payload = await request<{
        id: string;
        pipelineid: string;
        type?: string;
        processorid?: string;
        config: unknown;
    }>(`/pipelines/${pipelineId}/processors/${processorId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(processor),
    });
    return {
        id: payload.id,
        pipelineid: payload.pipelineid,
        type: payload.type ?? payload.processorid ?? processor.type,
        config: parseProcessorConfig(payload.config),
    };
}

export async function deletePipelineProcessor(
    pipelineId: string,
    processorId: string,
): Promise<void> {
    await request<void>(`/pipelines/${pipelineId}/processors/${processorId}`, {
        method: "DELETE",
    });
}

// ── Global Mapping (GET /mappings, POST /mappings) ────────────────────────────

export async function getGlobalMapping(): Promise<MappingField[]> {
    const payload = await request<MappingField[]>("/mappings");
    return Array.isArray(payload) ? payload : [];
}

/**
 * Replaces the entire global mapping.
 * Backend endpoint: POST /mappings  body: { Mapping: MappingField[] }
 */
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

// ── Rules ─────────────────────────────────────────────────────────────────────

export async function getRuleDefinitions(): Promise<RuleDefinition[]> {
    const payload = await request<
        Array<{
            type: string;
            label?: string;
            description?: string;
            schema?: unknown;
        }>
    >("/rules/types");
    if (!Array.isArray(payload)) return [];
    return payload.map((rule) => ({
        type: rule.type,
        label: rule.label ?? rule.type,
        description: rule.description ?? "",
        schema: normalizeSchema(rule.schema ?? {}),
    }));
}

export async function getRules(): Promise<Rule[]> {
    const payload = await request<Rule[]>("/rules");
    return Array.isArray(payload) ? payload : [];
}

export async function getRule(id: string): Promise<Rule> {
    return request<Rule>(`/rules/${id}`);
}

export async function createRule(
    rule: Omit<Rule, "id" | "created_at" | "updated_at" | "last_execution_at">,
): Promise<Rule> {
    return request<Rule>("/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rule),
    });
}

export async function updateRule(
    id: string,
    rule: Pick<Rule, "name" | "description" | "enabled" | "severity" | "type" | "config">,
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

export async function getRuleAlerts(): Promise<RuleAlert[]> {
    const payload = await request<RuleAlert[]>("/rules/alerts");
    return Array.isArray(payload) ? payload : [];
}
