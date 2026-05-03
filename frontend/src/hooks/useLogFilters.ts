import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getLogs } from "../services/api";
import type { LogEntry, TimeWindow } from "../types";

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
export const DEFAULT_PAGE_SIZE = 25;
export const DEFAULT_COLUMNS = ["timestamp", "sourceid"];

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export const TIME_WINDOWS: TimeWindow[] = [
    { label: "Último minuto", value: "now:::now-1m", ms: MINUTE_MS },
    { label: "Últimos 15 minutos", value: "now:::now-15m", ms: 15 * MINUTE_MS },
    { label: "Última hora", value: "now:::now-1h", ms: HOUR_MS },
    { label: "Últimas 6 horas", value: "now:::now-6h", ms: 6 * HOUR_MS },
    { label: "Últimas 24 horas", value: "now:::now-24h", ms: DAY_MS },
    { label: "Últimos 7 días", value: "now:::now-7d", ms: 7 * DAY_MS },
    { label: "Todo", value: "all", ms: null },
];

const DEFAULT_TIMEWINDOW = TIME_WINDOWS[2].value;

const TIMESTAMP_MS_THRESHOLD = 1_000_000_000_000;

export function toTimestampMs(value: number): number {
    return value > TIMESTAMP_MS_THRESHOLD ? value : value * 1000;
}

export function formatTimestamp(value: string): string {
    // dd/MM/yyyy HH:mm:ss

    return new Date(value).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
}

export function formatCellValue(value: unknown): string {
    if (value === null || value === undefined) return "-";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
}

export type LogFiltersState = {
    sourceId: string | null;
    timeWindow: string;
    filterText: string;
    columns: string[];
    page: number;
    pageSize: number;
    totalLogs: number;
    setSource: (id: string | null) => void;
    setTimeWindow: (v: string) => void;
    setFilterText: (v: string) => void;
    toggleColumn: (col: string) => void;
    setPage: (p: number) => void;
    setPageSize: (s: number) => void;
    setTotalLogs: (n: number) => void;
    filteredLogs: LogEntry[];
    paginatedLogs: LogEntry[];
    availableColumns: string[];
    totalPages: number;
    logsLoading: boolean;
    logsError: string;
    refetchLogs: () => void;
};

export function useLogFilters(availableSourceIds: string[]): LogFiltersState {
    const [searchParams, setSearchParams] = useSearchParams();

    const parseSourceId = (): string | null => {
        const raw = searchParams.get("source");
        if (!raw) return null;
        return raw;
    };

    const parseColumns = (): string[] => {
        const raw = searchParams.get("cols");
        if (!raw) return DEFAULT_COLUMNS;
        const cols = raw.split(",").filter(Boolean);
        return cols.length > 0 ? cols : DEFAULT_COLUMNS;
    };

    const sourceId = parseSourceId();
    const timeWindow = searchParams.get("time") ?? DEFAULT_TIMEWINDOW;
    const filterText = searchParams.get("q") ?? "";
    const page = Math.max(
        1,
        parseInt(searchParams.get("page") ?? "1", 10) || 1,
    );
    const pageSize = (() => {
        const n = parseInt(
            searchParams.get("pageSize") ?? String(DEFAULT_PAGE_SIZE),
            10,
        );
        return PAGE_SIZE_OPTIONS.includes(
            n as (typeof PAGE_SIZE_OPTIONS)[number],
        )
            ? n
            : DEFAULT_PAGE_SIZE;
    })();
    const columns = parseColumns();

    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const [logsError, setLogsError] = useState("");
    const [fetchTick, setFetchTick] = useState(0);
    const [totalLogs, setTotalLogs] = useState(0);

    function updateParams(updates: Record<string, string | null>) {
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            for (const [key, value] of Object.entries(updates)) {
                if (value === null) next.delete(key);
                else next.set(key, value);
            }
            return next;
        });
    }

    // Auto-select first source when list arrives
    useEffect(() => {
        if (sourceId === null && availableSourceIds.length > 0) {
            updateParams({ source: String(availableSourceIds[0]), page: "1" });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [availableSourceIds.join(",")]);

    // Fetch logs when sourceId or tick changes
    useEffect(() => {
        if (sourceId === null) {
            setLogs([]);
            return;
        }
        let cancelled = false;
        setLogsLoading(true);
        getLogs(sourceId, timeWindow, (page - 1) * pageSize, pageSize)
            .then(({ logs, total }) => {
                if (!cancelled) {
                    setLogs(logs);
                    setTotalLogs(total);
                    setLogsError("");
                }
            })
            .catch((err: Error) => {
                if (!cancelled) {
                    setLogsError(err.message || "Error cargando logs");
                }
            })
            .finally(() => {
                if (!cancelled) setLogsLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [sourceId, fetchTick]);

    const availableColumns = useMemo(() => {
        const set = new Set<string>(DEFAULT_COLUMNS);
        logs.forEach((log) =>
            Object.keys(log.data ?? {}).forEach((f) => set.add(f)),
        );
        return Array.from(set);
    }, [logs]);

    const filteredLogs = useMemo(() => {
        const now = Date.now();
        const window =
            TIME_WINDOWS.find((w) => w.value === timeWindow) ?? TIME_WINDOWS[2];

        return logs.filter((log) => {
            if (sourceId !== null && log.sourceid !== sourceId) return false;

            // if (window.ms !== null) {
            //     if (toTimestampMs(log.timestamp) < now - window.ms)
            //         return false;
            // }

            if (!filterText.trim()) return true;
            const needle = filterText.trim().toLowerCase();
            return columns.some((col) => {
                if (col === "timestamp")
                    return formatTimestamp(log.timestamp)
                        .toLowerCase()
                        .includes(needle);
                if (col === "sourceid")
                    return String(log.sourceid).toLowerCase().includes(needle);
                return formatCellValue(log.data?.[col])
                    .toLowerCase()
                    .includes(needle);
            });
        });
    }, [logs, sourceId, timeWindow, filterText, columns]);

    const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));

    const paginatedLogs = useMemo(() => {
        const safePage = Math.min(page, totalPages);
        const start = (safePage - 1) * pageSize;
        return filteredLogs.slice(start, start + pageSize);
    }, [filteredLogs, page, pageSize, totalPages]);

    const setSource = useCallback((id: string | null) => {
        updateParams({ source: id !== null ? String(id) : null, page: "1" });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const setTimeWindow = useCallback((v: string) => {
        updateParams({ time: v, page: "1" });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const setFilterText = useCallback((v: string) => {
        updateParams({ q: v || null, page: "1" });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const toggleColumn = useCallback(
        (col: string) => {
            const next = columns.includes(col)
                ? columns.filter((c) => c !== col)
                : [...columns, col];
            updateParams({ cols: next.join(","), page: "1" });
            // eslint-disable-next-line react-hooks/exhaustive-deps
        },
        [columns],
    );

    const setPage = useCallback((p: number) => {
        updateParams({ page: String(p) });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const setPageSize = useCallback((s: number) => {
        updateParams({ pageSize: String(s), page: "1" });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const refetchLogs = useCallback(() => setFetchTick((n) => n + 1), []);

    return {
        sourceId,
        timeWindow,
        filterText,
        columns,
        page,
        pageSize,
        setSource,
        setTimeWindow,
        setFilterText,
        toggleColumn,
        totalLogs,
        setPage,
        setPageSize,
        setTotalLogs,
        filteredLogs,
        paginatedLogs,
        availableColumns,
        totalPages,
        logsLoading,
        logsError,
        refetchLogs,
    };
}
