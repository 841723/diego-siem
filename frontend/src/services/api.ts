import type { LogEntry, Mapping, Pipeline, SourceConfig } from "../types";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, init);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json() as Promise<T>;
}

export async function getSources(): Promise<SourceConfig[]> {
    const payload = await request<SourceConfig[]>("/sources");
    return Array.isArray(payload) ? payload : [];
}

export async function createSource(source: Omit<SourceConfig, "id"> & { id?: number }): Promise<void> {
    await request<void>("/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(source),
    });
}

export async function deleteSources(): Promise<void> {
    await request<void>("/sources", { method: "DELETE" });
}

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

export async function getLogs(sourceId: number, timeWindow: string, from: number, size: number): Promise<{ logs: LogEntry[]; total: number }> {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const payload = await request<unknown>(`/logs/${sourceId}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                timeWindow: timeWindow,
                from: from,
                size: size,
            }),
        }
    );
    const { logs, total } = payload as { logs: unknown[]; total: number };
    return { logs: normalizeLogs(logs), total };
}

// ── Mappings ─────────────────────────────────────────────────────────────────

export async function getMappings(): Promise<Mapping[]> {
    const payload = await request<Mapping[]>("/mappings");
    return Array.isArray(payload) ? payload : [];
}

export async function createMapping(mapping: Omit<Mapping, "id">): Promise<void> {
    await request<void>("/mappings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mapping),
    });
}

export async function deleteMapping(id: number): Promise<void> {
    await request<void>(`/mappings/${id}`, { method: "DELETE" });
}

export async function duplicateMapping(id: number): Promise<void> {
    await request<void>(`/mappings/${id}/duplicate`, { method: "POST" });
}

// ── Pipelines ─────────────────────────────────────────────────────────────────

export async function getPipelines(): Promise<Pipeline[]> {
    const payload = await request<Pipeline[]>("/pipelines");
    return Array.isArray(payload) ? payload : [];
}

export async function createPipeline(pipeline: Omit<Pipeline, "id">): Promise<void> {
    await request<void>("/pipelines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pipeline),
    });
}

export async function deletePipeline(id: number): Promise<void> {
    await request<void>(`/pipelines/${id}`, { method: "DELETE" });
}

export async function duplicatePipeline(id: number): Promise<void> {
    await request<void>(`/pipelines/${id}/duplicate`, { method: "POST" });
}
