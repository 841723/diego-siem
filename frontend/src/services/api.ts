import type {
    LogEntry,
    MappingField,
    MappingType,
    Pipeline,
    ProcessorDefinition,
    SourceConfig,
} from "../types";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, init);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json() as Promise<T>;
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

// ── Processor definitions (GET /processors) ──────────────────────────────────
// NOTE: This endpoint is not yet implemented in the backend.
// The hook useProcessors falls back to hardcoded definitions when this returns 404.

export async function getProcessors(): Promise<ProcessorDefinition[]> {
    const payload = await request<ProcessorDefinition[]>("/processors");
    return Array.isArray(payload) ? payload : [];
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

// ── Mapping types (GET /mappings/types) ───────────────────────────────────────
// NOTE: This endpoint is not yet implemented in the backend.
// The hook useMappingTypes falls back to hardcoded types when this returns 404.

export async function getMappingTypes(): Promise<MappingType[]> {
    const payload = await request<MappingType[]>("/mappings/types");
    return Array.isArray(payload) ? payload : [];
}
