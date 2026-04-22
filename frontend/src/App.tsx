import { useEffect, useMemo, useState, type FormEvent } from "react";

type LogEntry = {
    _row_key: string;
    timestamp: number;
    source_id: string;
    data: Record<string, unknown>;
};

type SourceConfig = {
    id: string;
    name: string;
    port: number;
    protocol: "udp";
    parser: "syslog";
    pipeline_id: string;
    index_id: string;
};

type MappingDef = {
    id: string;
    fields: string[];
};

type PipelineDef = {
    id: string;
    processors: string[];
};

type RuleDef = {
    id: string;
    query: string;
    interval_seconds: number;
    action: string;
};

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8080";
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const DEFAULT_COLUMNS = ["timestamp", "source_id"];
const TIMESTAMP_MS_THRESHOLD = 1_000_000_000_000;
const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

const TIME_WINDOWS: Array<{ label: string; value: string; ms: number | null }> = [
    { label: "Últimos 15 minutos", value: "15m", ms: 15 * MINUTE_MS },
    { label: "Última hora", value: "1h", ms: HOUR_MS },
    { label: "Últimas 6 horas", value: "6h", ms: 6 * HOUR_MS },
    { label: "Últimas 24 horas", value: "24h", ms: DAY_MS },
    { label: "Últimos 7 días", value: "7d", ms: 7 * DAY_MS },
    { label: "Todo", value: "all", ms: null },
];

function toTimestampMs(value: number): number {
    if (value > TIMESTAMP_MS_THRESHOLD) return value;
    return value * 1000;
}

function formatTimestamp(value: number): string {
    return new Date(toTimestampMs(value)).toLocaleString();
}

function formatCellValue(value: unknown): string {
    if (value === null || value === undefined) return "-";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
}

function sourceIdFromName(name: string): string {
    return name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function generateUniqueId(prefix: string): string {
    const suffix =
        typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    return `${prefix}-${suffix}`;
}

function upsertById<T extends { id: string }>(items: T[], newItem: T): T[] {
    return [newItem, ...items.filter((item) => item.id !== newItem.id)];
}

function normalizeLogs(payload: unknown): LogEntry[] {
    const rawLogs: Array<Omit<LogEntry, "_row_key">> = Array.isArray(payload)
        ? payload
        : Array.isArray((payload as { logs?: unknown[] })?.logs)
          ? ((payload as { logs: Array<Omit<LogEntry, "_row_key">> }).logs ?? [])
          : [];

    const duplicatedKeys = new Map<string, number>();
    return rawLogs.map((log) => {
        const signature = `${log.source_id}-${log.timestamp}-${JSON.stringify(log.data ?? {})}`;
        const count = (duplicatedKeys.get(signature) ?? 0) + 1;
        duplicatedKeys.set(signature, count);

        return {
            ...log,
            _row_key: `${signature}-${count}`,
        };
    });
}

async function postJson(path: string, body: object): Promise<{ ok: boolean; message: string }> {
    try {
        const response = await fetch(`${API_BASE}${path}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            return { ok: false, message: `HTTP ${response.status}` };
        }

        return { ok: true, message: "OK" };
    } catch {
        return { ok: false, message: "Endpoint no disponible" };
    }
}

function App() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [sources, setSources] = useState<SourceConfig[]>([]);
    const [mappings, setMappings] = useState<MappingDef[]>([]);
    const [pipelines, setPipelines] = useState<PipelineDef[]>([]);
    const [rules, setRules] = useState<RuleDef[]>([]);

    const [logsError, setLogsError] = useState("");
    const [selectedSources, setSelectedSources] = useState<string[]>([]);
    const [sourceSelectionTouched, setSourceSelectionTouched] = useState(false);
    const [selectedColumns, setSelectedColumns] = useState<string[]>(DEFAULT_COLUMNS);
    const [selectedTimeWindow, setSelectedTimeWindow] = useState("1h");
    const [filterText, setFilterText] = useState("");
    const [pageSize, setPageSize] = useState(25);
    const [currentPage, setCurrentPage] = useState(1);

    const [sourceName, setSourceName] = useState("");
    const [sourcePort, setSourcePort] = useState(9001);
    const [sourceMappingId, setSourceMappingId] = useState("");
    const [sourcePipelineId, setSourcePipelineId] = useState("");

    const [mappingId, setMappingId] = useState("");
    const [mappingFields, setMappingFields] = useState("");

    const [pipelineId, setPipelineId] = useState("");
    const [pipelineProcessors, setPipelineProcessors] = useState("");

    const [ruleId, setRuleId] = useState("");
    const [ruleQuery, setRuleQuery] = useState("");
    const [ruleInterval, setRuleInterval] = useState(60);
    const [ruleAction, setRuleAction] = useState("");

    const [message, setMessage] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function fetchLogs() {
            try {
                const response = await fetch(`${API_BASE}/logs`);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);

                const payload = await response.json();
                const nextLogs = normalizeLogs(payload);

                if (!cancelled) {
                    setLogs(nextLogs);
                    setLogsError("");
                }
            } catch (err) {
                if (!cancelled) {
                    setLogsError((err as Error).message || "Error cargando logs");
                }
            }
        }

        fetchLogs();
        const intervalId = setInterval(fetchLogs, 2000);

        return () => {
            cancelled = true;
            clearInterval(intervalId);
        };
    }, []);

    useEffect(() => {
        let cancelled = false;

        async function fetchSources() {
            try {
                const response = await fetch(`${API_BASE}/sources`);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);

                const payload = await response.json();
                const nextSources: SourceConfig[] = Array.isArray(payload) ? payload : [];

                if (!cancelled) {
                    setSources(nextSources);
                }
            } catch {
                if (!cancelled) {
                    setSources([]);
                }
            }
        }

        fetchSources();

        return () => {
            cancelled = true;
        };
    }, []);

    const sourceIds = useMemo(() => {
        const ids = new Set<string>();
        sources.forEach((source) => ids.add(source.id));
        logs.forEach((log) => ids.add(log.source_id));
        return Array.from(ids).sort();
    }, [logs, sources]);

    useEffect(() => {
            if (sourceIds.length === 0) {
                setSelectedSources([]);
                return;
            }

            setSelectedSources((prev) => {
                const valid = prev.filter((sourceId) => sourceIds.includes(sourceId));

                if (!sourceSelectionTouched && (prev.length === 0 || valid.length === 0)) {
                    return sourceIds;
                }

                return valid;
            });
    }, [sourceIds, sourceSelectionTouched]);

    const availableColumns = useMemo(() => {
        const set = new Set<string>(["timestamp", "source_id"]);

        mappings.forEach((mapping) => {
            mapping.fields.forEach((field) => set.add(field));
        });

        logs.forEach((log) => {
            Object.keys(log.data ?? {}).forEach((field) => set.add(field));
        });

        return Array.from(set);
    }, [logs, mappings]);

    useEffect(() => {
        setSelectedColumns((prev) => {
            const normalized = prev.filter((column) => availableColumns.includes(column));
            if (normalized.length > 0) return normalized;
            return DEFAULT_COLUMNS;
        });
    }, [availableColumns]);

    const filteredLogs = useMemo(() => {
        const now = Date.now();
        const selectedWindow = TIME_WINDOWS.find((window) => window.value === selectedTimeWindow) ?? TIME_WINDOWS[1];

        return logs.filter((log) => {
            if (sourceIds.length > 0) {
                if (selectedSources.length === 0) return false;
                if (!selectedSources.includes(log.source_id)) return false;
            }

            if (selectedWindow.ms !== null) {
                const logTs = toTimestampMs(log.timestamp);
                if (logTs < now - selectedWindow.ms) return false;
            }

            if (!filterText.trim()) return true;

            const needle = filterText.trim().toLowerCase();
            return selectedColumns.some((column) => {
                if (column === "timestamp") return formatTimestamp(log.timestamp).toLowerCase().includes(needle);
                if (column === "source_id") return log.source_id.toLowerCase().includes(needle);
                return formatCellValue(log.data?.[column]).toLowerCase().includes(needle);
            });
        });
    }, [filterText, logs, selectedColumns, selectedSources, selectedTimeWindow]);

    const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));

    useEffect(() => {
        setCurrentPage((prev) => Math.min(prev, totalPages));
    }, [totalPages]);

    const paginatedLogs = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredLogs.slice(start, start + pageSize);
    }, [currentPage, filteredLogs, pageSize]);

    function toggleSource(sourceId: string) {
        setCurrentPage(1);
        setSourceSelectionTouched(true);
        setSelectedSources((prev) =>
            prev.includes(sourceId) ? prev.filter((item) => item !== sourceId) : [...prev, sourceId],
        );
    }

    function toggleColumn(column: string) {
        setCurrentPage(1);
        setSelectedColumns((prev) =>
            prev.includes(column) ? prev.filter((item) => item !== column) : [...prev, column],
        );
    }

    async function handleCreateSource(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const baseId = sourceIdFromName(sourceName);
        const generatedId = baseId || generateUniqueId("source");
        const source: SourceConfig = {
            id: generatedId,
            name: sourceName,
            port: sourcePort,
            protocol: "udp",
            parser: "syslog",
            pipeline_id: sourcePipelineId,
            index_id: sourceMappingId,
        };

        const apiResult = await postJson("/sources", source);

        setSources((prev) => upsertById(prev, source));
        setSourceName("");
        setSourcePort(9001);
        setSourcePipelineId("");
        setSourceMappingId("");

        setMessage(
            apiResult.ok
                ? "Fuente creada y enviada al backend"
                : "Fuente creada localmente. Falta endpoint backend para persistencia completa",
        );
    }

    async function handleCreateMapping(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const fields = mappingFields
            .split(",")
            .map((field) => field.trim())
            .filter(Boolean);

        const mapping: MappingDef = {
            id: mappingId.trim(),
            fields,
        };

        const apiResult = await postJson("/mappings", mapping);
        setMappings((prev) => upsertById(prev, mapping));
        setMappingId("");
        setMappingFields("");

        setMessage(
            apiResult.ok
                ? "Mapping creado y enviado al backend"
                : "Mapping creado localmente. Endpoint backend pendiente",
        );
    }

    async function handleCreatePipeline(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const processors = pipelineProcessors
            .split("\n")
            .map((processor) => processor.trim())
            .filter(Boolean);

        const pipeline: PipelineDef = {
            id: pipelineId.trim(),
            processors,
        };

        const apiResult = await postJson("/pipelines", pipeline);
        setPipelines((prev) => upsertById(prev, pipeline));
        setPipelineId("");
        setPipelineProcessors("");

        setMessage(
            apiResult.ok
                ? "Pipeline creada y enviada al backend"
                : "Pipeline creada localmente. Endpoint backend pendiente",
        );
    }

    async function handleCreateRule(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const rule: RuleDef = {
            id: ruleId.trim(),
            query: ruleQuery.trim(),
            interval_seconds: ruleInterval,
            action: ruleAction.trim(),
        };

        const apiResult = await postJson("/rules", rule);
        setRules((prev) => upsertById(prev, rule));
        setRuleId("");
        setRuleQuery("");
        setRuleInterval(60);
        setRuleAction("");

        setMessage(
            apiResult.ok
                ? "Regla creada y enviada al backend"
                : "Regla creada localmente. Endpoint backend pendiente",
        );
    }

    return (
        <main className='min-h-screen bg-slate-950 text-slate-100'>
            <div className='mx-auto max-w-7xl space-y-6 p-6'>
                <header className='rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg'>
                    <h1 className='text-2xl font-bold md:text-3xl'>dieGo SIEM · Frontend</h1>
                    <p className='mt-2 text-sm text-slate-300'>
                        Consulta de logs con filtros avanzados y administración de fuentes, mappings, pipelines y reglas.
                    </p>
                    {message && <p className='mt-3 rounded bg-emerald-900/40 p-2 text-sm text-emerald-200'>{message}</p>}
                    {logsError && <p className='mt-3 rounded bg-rose-900/40 p-2 text-sm text-rose-200'>{logsError}</p>}
                </header>

                <section className='grid gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-4 md:grid-cols-3'>
                    <article className='space-y-3'>
                        <h2 className='text-lg font-semibold'>Fuentes ({selectedSources.length})</h2>
                        <div className='max-h-44 space-y-2 overflow-auto rounded border border-slate-800 p-2'>
                            {sourceIds.length === 0 && <p className='text-sm text-slate-400'>Sin fuentes detectadas</p>}
                            {sourceIds.map((sourceId) => (
                                <label key={sourceId} className='flex items-center gap-2 text-sm'>
                                    <input
                                        type='checkbox'
                                        className='accent-cyan-400'
                                        checked={selectedSources.includes(sourceId)}
                                        onChange={() => toggleSource(sourceId)}
                                    />
                                    {sourceId}
                                </label>
                            ))}
                        </div>
                    </article>

                    <article className='space-y-3'>
                        <h2 className='text-lg font-semibold'>Columnas visibles</h2>
                        <div className='max-h-44 space-y-2 overflow-auto rounded border border-slate-800 p-2'>
                            {availableColumns.map((column) => (
                                <label key={column} className='flex items-center gap-2 text-sm'>
                                    <input
                                        type='checkbox'
                                        className='accent-cyan-400'
                                        checked={selectedColumns.includes(column)}
                                        onChange={() => toggleColumn(column)}
                                    />
                                    {column}
                                </label>
                            ))}
                        </div>
                    </article>

                    <article className='space-y-3'>
                        <h2 className='text-lg font-semibold'>Ventana temporal y filtro</h2>
                        <label className='block text-sm text-slate-300'>
                            Ventana temporal
                            <select
                                className='mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2'
                                value={selectedTimeWindow}
                                onChange={(event) => {
                                    setSelectedTimeWindow(event.target.value);
                                    setCurrentPage(1);
                                }}
                            >
                                {TIME_WINDOWS.map((window) => (
                                    <option key={window.value} value={window.value}>
                                        {window.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className='block text-sm text-slate-300'>
                            Buscar en logs
                            <input
                                className='mt-1 w-full rounded border border-slate-700 bg-slate-950 p-2'
                                value={filterText}
                                onChange={(event) => {
                                    setFilterText(event.target.value);
                                    setCurrentPage(1);
                                }}
                                placeholder='IP, user, error, auth...'
                            />
                        </label>
                    </article>
                </section>

                <section className='rounded-2xl border border-slate-800 bg-slate-900 p-4'>
                    <div className='mb-3 flex flex-wrap items-center justify-between gap-3 text-sm'>
                        <p>
                            Mostrando <span className='font-semibold'>{paginatedLogs.length}</span> de{" "}
                            <span className='font-semibold'>{filteredLogs.length}</span> logs filtrados
                        </p>
                        <label className='flex items-center gap-2'>
                            Tamaño de página
                            <select
                                className='rounded border border-slate-700 bg-slate-950 p-2'
                                value={pageSize}
                                onChange={(event) => {
                                    setPageSize(Number(event.target.value));
                                    setCurrentPage(1);
                                }}
                            >
                                {PAGE_SIZE_OPTIONS.map((size) => (
                                    <option key={size} value={size}>
                                        {size}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <div className='overflow-auto rounded border border-slate-800'>
                        <table className='min-w-full border-collapse text-sm'>
                            <thead className='bg-slate-800'>
                                <tr>
                                    {selectedColumns.map((column) => (
                                        <th key={column} className='border-b border-slate-700 p-2 text-left font-semibold'>
                                            {column}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedLogs.map((log) => (
                                    <tr key={log._row_key} className='odd:bg-slate-900 even:bg-slate-950'>
                                        {selectedColumns.map((column) => (
                                            <td key={column} className='border-b border-slate-800 p-2 align-top'>
                                                {column === "timestamp"
                                                    ? formatTimestamp(log.timestamp)
                                                    : column === "source_id"
                                                      ? log.source_id
                                                      : formatCellValue(log.data?.[column])}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                                {paginatedLogs.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={Math.max(1, selectedColumns.length)}
                                            className='p-4 text-center text-slate-400'
                                        >
                                            No hay logs para los criterios seleccionados
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className='mt-3 flex items-center justify-end gap-2'>
                        <button
                            className='rounded border border-slate-700 px-3 py-1 disabled:opacity-40'
                            disabled={currentPage <= 1}
                            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                        >
                            Anterior
                        </button>
                        <span className='text-sm text-slate-300'>
                            Página {currentPage} / {totalPages}
                        </span>
                        <button
                            className='rounded border border-slate-700 px-3 py-1 disabled:opacity-40'
                            disabled={currentPage >= totalPages}
                            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                        >
                            Siguiente
                        </button>
                    </div>
                </section>

                <section className='grid gap-4 md:grid-cols-2'>
                    <form
                        className='space-y-3 rounded-2xl border border-slate-800 bg-slate-900 p-4'
                        onSubmit={handleCreateSource}
                    >
                        <h2 className='text-lg font-semibold'>Nueva fuente (syslog UDP)</h2>
                        <input
                            className='w-full rounded border border-slate-700 bg-slate-950 p-2'
                            placeholder='Nombre de fuente'
                            value={sourceName}
                            onChange={(event) => setSourceName(event.target.value)}
                            required
                        />
                        <input
                            className='w-full rounded border border-slate-700 bg-slate-950 p-2'
                            type='number'
                            min={1}
                            max={65535}
                            value={sourcePort}
                            onChange={(event) => setSourcePort(Number(event.target.value))}
                            required
                        />
                        <input
                            className='w-full rounded border border-slate-700 bg-slate-950 p-2'
                            placeholder='Mapping ID (index_id)'
                            value={sourceMappingId}
                            onChange={(event) => setSourceMappingId(event.target.value)}
                            required
                        />
                        <input
                            className='w-full rounded border border-slate-700 bg-slate-950 p-2'
                            placeholder='Pipeline ID'
                            value={sourcePipelineId}
                            onChange={(event) => setSourcePipelineId(event.target.value)}
                            required
                        />
                        <button className='rounded bg-cyan-600 px-4 py-2 font-semibold hover:bg-cyan-500' type='submit'>
                            Crear fuente
                        </button>
                    </form>

                    <form
                        className='space-y-3 rounded-2xl border border-slate-800 bg-slate-900 p-4'
                        onSubmit={handleCreateMapping}
                    >
                        <h2 className='text-lg font-semibold'>Nuevo mapping</h2>
                        <input
                            className='w-full rounded border border-slate-700 bg-slate-950 p-2'
                            placeholder='Mapping ID'
                            value={mappingId}
                            onChange={(event) => setMappingId(event.target.value)}
                            required
                        />
                        <textarea
                            className='h-24 w-full rounded border border-slate-700 bg-slate-950 p-2'
                            placeholder='Campos separados por coma. Ej: host,severity,program,message'
                            value={mappingFields}
                            onChange={(event) => setMappingFields(event.target.value)}
                            required
                        />
                        <button
                            className='rounded bg-cyan-600 px-4 py-2 font-semibold hover:bg-cyan-500'
                            type='submit'
                        >
                            Crear mapping
                        </button>
                    </form>

                    <form
                        className='space-y-3 rounded-2xl border border-slate-800 bg-slate-900 p-4'
                        onSubmit={handleCreatePipeline}
                    >
                        <h2 className='text-lg font-semibold'>Nueva pipeline</h2>
                        <input
                            className='w-full rounded border border-slate-700 bg-slate-950 p-2'
                            placeholder='Pipeline ID'
                            value={pipelineId}
                            onChange={(event) => setPipelineId(event.target.value)}
                            required
                        />
                        <textarea
                            className='h-24 w-full rounded border border-slate-700 bg-slate-950 p-2'
                            placeholder='Un procesador por línea. Ej: parse_syslog\ngeoip\nnormalize'
                            value={pipelineProcessors}
                            onChange={(event) => setPipelineProcessors(event.target.value)}
                            required
                        />
                        <button
                            className='rounded bg-cyan-600 px-4 py-2 font-semibold hover:bg-cyan-500'
                            type='submit'
                        >
                            Crear pipeline
                        </button>
                    </form>

                    <form
                        className='space-y-3 rounded-2xl border border-slate-800 bg-slate-900 p-4'
                        onSubmit={handleCreateRule}
                    >
                        <h2 className='text-lg font-semibold'>Nueva regla</h2>
                        <input
                            className='w-full rounded border border-slate-700 bg-slate-950 p-2'
                            placeholder='Rule ID'
                            value={ruleId}
                            onChange={(event) => setRuleId(event.target.value)}
                            required
                        />
                        <textarea
                            className='h-24 w-full rounded border border-slate-700 bg-slate-950 p-2'
                            placeholder='Consulta. Ej: severity:error AND source_id:web-syslog'
                            value={ruleQuery}
                            onChange={(event) => setRuleQuery(event.target.value)}
                            required
                        />
                        <input
                            className='w-full rounded border border-slate-700 bg-slate-950 p-2'
                            type='number'
                            min={5}
                            value={ruleInterval}
                            onChange={(event) => setRuleInterval(Number(event.target.value))}
                            required
                        />
                        <p className='text-xs text-slate-400'>Intervalo (segundos)</p>
                        <input
                            className='w-full rounded border border-slate-700 bg-slate-950 p-2'
                            placeholder='Acción. Ej: webhook:https://...'
                            value={ruleAction}
                            onChange={(event) => setRuleAction(event.target.value)}
                            required
                        />
                        <button
                            className='rounded bg-cyan-600 px-4 py-2 font-semibold hover:bg-cyan-500'
                            type='submit'
                        >
                            Crear regla
                        </button>
                    </form>
                </section>

                <section className='rounded-2xl border border-slate-800 bg-slate-900 p-4'>
                    <h2 className='mb-2 text-lg font-semibold'>Resumen de configuración local</h2>
                    <p className='text-sm text-slate-300'>
                        Fuentes: {sources.length} · Mappings: {mappings.length} · Pipelines: {pipelines.length} · Reglas: {rules.length}
                    </p>
                </section>
            </div>
        </main>
    );
}

export default App;
