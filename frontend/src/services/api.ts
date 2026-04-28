import type { LogEntry, SourceConfig } from "../types";

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

export async function getLogs(sourceId: number): Promise<LogEntry[]> {
    const payload = await request<unknown>(`/logs/${sourceId}`);
    return normalizeLogs(payload);
}
