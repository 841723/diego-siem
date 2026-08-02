import { useEffect, useMemo, useRef, useState } from "react";
import { getLogs } from "../../services/api";
import type { LogEntry } from "../../types";
import { DEFAULT_COLUMNS, FIXED_PAGE_SIZE, MAX_LOG_PAGES } from "./constants";
import { formatCellValue, formatTimestamp } from "./formatters";
import type { LogSearchFilters } from "./useLogSearchParams";

function getNestedValue(data: Record<string, unknown> | undefined, path: string): unknown {
    if (!data) return undefined;
    return path
        .split(".")
        .reduce<unknown>(
            (value, key) =>
                value && typeof value === "object"
                    ? (value as Record<string, unknown>)[key]
                    : undefined,
            data,
        );
}

function getLogFieldValue(log: LogEntry, field: string): unknown {
    if (field === "timestamp") return log.timestamp;
    if (field === "sourceid") return log.sourceid;
    if (field === "raw") return log.raw;

    const topLevelValue = (log as Record<string, unknown>)[field];
    if (topLevelValue !== undefined) return topLevelValue;

    return getNestedValue(log.data, field);
}

function parseSort(sort: string): { field: string; direction: "asc" | "desc" } {
    const [field, direction] = sort.split(":");
    return {
        field: field || "timestamp",
        direction: direction === "asc" ? "asc" : "desc",
    };
}

function getSortValue(log: LogEntry, field: string): unknown {
    if (field === "timestamp") return Date.parse(log.timestamp);
    return getLogFieldValue(log, field);
}

function compareValues(a: unknown, b: unknown): number {
    if (typeof a === "number" && typeof b === "number") return a - b;
    const stringA = String(a ?? "");
    const stringB = String(b ?? "");
    return stringA.localeCompare(stringB);
}

function filterLogs(logs: LogEntry[], query: string, columns: string[]): LogEntry[] {
    const needle = query.trim().toLowerCase();
    if (!needle) return logs;

    return logs.filter((log) =>
        columns.some((column) => {
            if (column === "timestamp") {
                return formatTimestamp(log.timestamp).toLowerCase().includes(needle);
            }

            if (column === "sourceid") {
                return String(log.sourceid).toLowerCase().includes(needle);
            }

            return formatCellValue(getLogFieldValue(log, column))
                .toLowerCase()
                .includes(needle);
        }),
    );
}

function sortLogs(logs: LogEntry[], sort: string): LogEntry[] {
    const { field, direction } = parseSort(sort);
    const sorted = [...logs].sort((left, right) => {
        const a = getSortValue(left, field);
        const b = getSortValue(right, field);
        const comparison = compareValues(a, b);
        return direction === "asc" ? comparison : -comparison;
    });
    return sorted;
}

export function useLogSearch(filters: LogSearchFilters): {
    logs: LogEntry[];
    visibleLogs: LogEntry[];
    availableColumns: string[];
    totalLogs: number;
    totalPages: number;
    loading: boolean;
    error: string;
} {
    const requestSeq = useRef(0);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [totalLogs, setTotalLogs] = useState(0);

    useEffect(() => {
        if (!filters.dataset) {
            setLogs([]);
            setTotalLogs(0);
            setError("");
            return;
        }

        const requestId = requestSeq.current + 1;
        requestSeq.current = requestId;
        setLoading(true);

        const safePage = Math.max(1, Math.min(MAX_LOG_PAGES, filters.page));
        const from = (safePage - 1) * FIXED_PAGE_SIZE;

        getLogs(filters.dataset, filters.timeWindow, from, FIXED_PAGE_SIZE)
            .then((response) => {
                if (requestSeq.current !== requestId) return;
                setLogs(response.logs);
                setTotalLogs(response.total);
                setError("");
            })
            .catch((fetchError: Error) => {
                if (requestSeq.current !== requestId) return;
                setLogs([]);
                setTotalLogs(0);
                setError(fetchError.message || "Error cargando logs");
            })
            .finally(() => {
                if (requestSeq.current === requestId) {
                    setLoading(false);
                }
            });
    }, [filters.dataset, filters.timeWindow, filters.page, filters.pageSize]);

    const availableColumns = useMemo(() => {
        const columns = new Set<string>(DEFAULT_COLUMNS);
        columns.add("raw");

        filters.columns.forEach((column) => {
            columns.add(column);
        });

        const addNestedColumns = (obj: Record<string, unknown>, prefix = "") => {
            Object.entries(obj).forEach(([key, value]) => {
                const columnName = prefix ? `${prefix}.${key}` : key;
                columns.add(columnName);
                if (value && typeof value === "object") {
                    addNestedColumns(value as Record<string, unknown>, columnName);
                }
            });
        };

        logs.forEach((log) => {
            if (log.data) addNestedColumns(log.data);
        });

        return Array.from(columns);
    }, [logs, filters.columns]);

    const visibleLogs = useMemo(() => {
        return sortLogs(filterLogs(logs, filters.query, filters.columns), filters.sort);
    }, [logs, filters.query, filters.columns, filters.sort]);

    const totalPages = Math.max(
        1,
        Math.min(MAX_LOG_PAGES, Math.ceil(totalLogs / FIXED_PAGE_SIZE)),
    );

    return {
        logs,
        visibleLogs,
        availableColumns,
        totalLogs,
        totalPages,
        loading,
        error,
    };
}
