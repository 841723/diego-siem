import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getLogs } from "../services/api";
import type { LogEntry, TimeWindow } from "../types";

export const FIXED_PAGE_SIZE = 100;
export const MAX_LOG_PAGES = 5;
export const PAGE_SIZE_OPTIONS = [FIXED_PAGE_SIZE] as const;
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
const NO_COLUMNS_MARKER = "__NO_COLUMNS_SELECTED__";

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
    const requestSeq = useRef(0);

    const parseSourceId = (): string | null => {
        const raw = searchParams.get("source");
        if (!raw) return null;
        return raw;
    };

    const parseColumns = (): string[] => {
        const raw = searchParams.get("cols");
        if (!raw) return DEFAULT_COLUMNS;
        if (raw === NO_COLUMNS_MARKER) return [];
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
    const pageSize = FIXED_PAGE_SIZE;
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

    // Auto-select first source when list arrives or when selected source disappears
    useEffect(() => {
        if (availableSourceIds.length === 0) return;
        if (sourceId === null || !availableSourceIds.includes(sourceId)) {
            updateParams({ source: String(availableSourceIds[0]), page: "1" });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [availableSourceIds.join(",")]);

    // Fetch logs when source / time / page changes
    useEffect(() => {
        if (sourceId === null) {
            setLogs([]);
            setTotalLogs(0);
            setLogsError("");
            return;
        }
        const requestId = requestSeq.current + 1;
        requestSeq.current = requestId;

        setLogsLoading(true);
        const offset = (page - 1) * FIXED_PAGE_SIZE;
        getLogs(sourceId, timeWindow, offset, FIXED_PAGE_SIZE)
            .then(({ logs, total }) => {
                if (requestSeq.current === requestId) {
                    setLogs(logs);
                    setTotalLogs(total);
                    setLogsError("");
                }
            })
            .catch((err: Error) => {
                if (requestSeq.current === requestId) {
                    setLogs([]);
                    setTotalLogs(0);
                    setLogsError(err.message || "Error cargando logs");
                }
            })
            .finally(() => {
                if (requestSeq.current === requestId) setLogsLoading(false);
            });
    }, [sourceId, timeWindow, page, fetchTick]);

    const availableColumns = useMemo(() => {
        const set = new Set<string>(DEFAULT_COLUMNS);
        columns.forEach((column) => set.add(column));
        logs.forEach((log) =>
            Object.keys(log.data ?? {}).forEach((f) => set.add(f)),
        );
        return Array.from(set);
    }, [logs, columns]);

    const filteredLogs = useMemo(() => {
        const now = Date.now();
        const selectedWindow =
            TIME_WINDOWS.find((item) => item.value === timeWindow) ??
            TIME_WINDOWS[2];

        return logs.filter((log) => {
            if (sourceId !== null && log.sourceid !== sourceId) return false;
            if (selectedWindow.ms !== null) {
                const timestamp = Date.parse(log.timestamp);
                if (!Number.isNaN(timestamp) && timestamp < now - selectedWindow.ms) {
                    return false;
                }
            }

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

    const totalPages = Math.max(
        1,
        Math.min(MAX_LOG_PAGES, Math.ceil(totalLogs / FIXED_PAGE_SIZE)),
    );

    const paginatedLogs = useMemo(() => {
        return filteredLogs;
    }, [filteredLogs]);

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
            updateParams({
                cols: next.length > 0 ? next.join(",") : NO_COLUMNS_MARKER,
                page: "1",
            });
            // eslint-disable-next-line react-hooks/exhaustive-deps
        },
        [columns],
    );

    const setPage = useCallback((p: number) => {
        const safePage = Math.min(MAX_LOG_PAGES, Math.max(1, p));
        updateParams({ page: String(safePage) });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const setPageSize = useCallback((_s: number) => {}, []);

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
