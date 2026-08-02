import { useCallback, useMemo } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
    DEFAULT_COLUMNS,
    DEFAULT_FROM,
    DEFAULT_SORT,
    DEFAULT_TO,
    FIXED_PAGE_SIZE,
    MAX_LOG_PAGES,
    TIME_WINDOWS,
} from "./constants";

type SearchParamValue = string | null | undefined;

export type LogSearchFilters = {
    dataset: string | null;
    from: string;
    to: string;
    query: string;
    columns: string[];
    sort: string;
    page: number;
    pageSize: number;
    timeWindow: string;
};

type ParamsUpdate = Record<string, SearchParamValue>;

function parseLegacyTimeWindow(raw: string | null): { from: string; to: string } {
    if (!raw) return { from: DEFAULT_FROM, to: DEFAULT_TO };
    if (raw === "all") return { from: "all", to: "all" };
    const [to, from] = raw.split(":::");
    if (!to || !from) return { from: DEFAULT_FROM, to: DEFAULT_TO };
    return { from, to };
}

function parseColumns(raw: string | null): string[] {
    if (!raw) return DEFAULT_COLUMNS;
    const parsed = raw
        .split(",")
        .map((column) => column.trim())
        .filter(Boolean);
    return parsed.length > 0 ? parsed : DEFAULT_COLUMNS;
}

function parsePage(raw: string | null): number {
    const page = Number.parseInt(raw ?? "1", 10);
    if (Number.isNaN(page)) return 1;
    return Math.max(1, Math.min(MAX_LOG_PAGES, page));
}

function toTimeWindow(from: string, to: string): string {
    if (from === "all" && to === "all") return "all";
    return `${to}:::${from}`;
}

export function useLogSearchParams(availableDatasetIds: string[]): {
    filters: LogSearchFilters;
    setDataset: (dataset: string | null) => void;
    setQuery: (query: string) => void;
    setPage: (page: number) => void;
    setPageSize: (pageSize: number) => void;
    setSort: (sort: string) => void;
    toggleColumn: (column: string) => void;
    setTimeRange: (from: string, to: string) => void;
    setTimeWindow: (timeWindow: string) => void;
} {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();

    const updateParams = useCallback(
        (updates: ParamsUpdate) => {
            const next = new URLSearchParams(searchParams);
            for (const [key, value] of Object.entries(updates)) {
                if (!value) {
                    next.delete(key);
                    continue;
                }
                next.set(key, value);
            }

            const nextSearch = next.toString();
            const currentSearch = searchParams.toString();
            if (nextSearch === currentSearch) return;

            navigate(
                {
                    pathname: location.pathname,
                    search: nextSearch ? `?${nextSearch}` : "",
                },
                { replace: true },
            );
        },
        [location.pathname, navigate, searchParams],
    );

    const filters = useMemo<LogSearchFilters>(() => {
        const dataset = searchParams.get("dataset") ?? searchParams.get("source");
        const { from: legacyFrom, to: legacyTo } = parseLegacyTimeWindow(
            searchParams.get("time"),
        );
        const from = searchParams.get("from") ?? legacyFrom;
        const to = searchParams.get("to") ?? legacyTo;

        const firstDataset = availableDatasetIds[0] ?? null;
        const validDataset =
            dataset && availableDatasetIds.includes(dataset) ? dataset : firstDataset;

        return {
            dataset: validDataset,
            from,
            to,
            query: searchParams.get("query") ?? searchParams.get("q") ?? "",
            columns: parseColumns(searchParams.get("columns") ?? searchParams.get("cols")),
            sort: searchParams.get("sort") ?? DEFAULT_SORT,
            page: parsePage(searchParams.get("page")),
            pageSize: FIXED_PAGE_SIZE,
            timeWindow: toTimeWindow(from, to),
        };
    }, [searchParams, availableDatasetIds]);

    const setDataset = useCallback(
        (dataset: string | null) => {
            updateParams({
                dataset,
                source: null,
                page: "1",
            });
        },
        [updateParams],
    );

    const setQuery = useCallback(
        (query: string) => {
            updateParams({
                query: query.trim() ? query : null,
                q: null,
                page: "1",
            });
        },
        [updateParams],
    );

    const setPage = useCallback(
        (page: number) => {
            const safePage = Math.max(1, Math.min(MAX_LOG_PAGES, page));
            updateParams({ page: String(safePage) });
        },
        [updateParams],
    );

    const setPageSize = useCallback(
        (_pageSize: number) => {
            updateParams({
                pageSize: String(FIXED_PAGE_SIZE),
                page: "1",
            });
        },
        [updateParams],
    );

    const setSort = useCallback(
        (sort: string) => {
            updateParams({
                sort: sort || DEFAULT_SORT,
                page: "1",
            });
        },
        [updateParams],
    );

    const toggleColumn = useCallback(
        (column: string) => {
            const nextColumns = filters.columns.includes(column)
                ? filters.columns.filter((item) => item !== column)
                : [...filters.columns, column];

            updateParams({
                columns: nextColumns.length > 0 ? nextColumns.join(",") : null,
                cols: null,
                page: "1",
            });
        },
        [filters.columns, updateParams],
    );

    const setTimeRange = useCallback(
        (from: string, to: string) => {
            updateParams({
                from,
                to,
                time: null,
                page: "1",
            });
        },
        [updateParams],
    );

    const setTimeWindow = useCallback(
        (timeWindow: string) => {
            const selected = TIME_WINDOWS.find((item) => item.value === timeWindow);
            if (!selected) return;

            if (selected.value === "all") {
                setTimeRange("all", "all");
                return;
            }

            const [to, from] = selected.value.split(":::");
            if (!from || !to) return;
            setTimeRange(from, to);
        },
        [setTimeRange],
    );

    return {
        filters,
        setDataset,
        setQuery,
        setPage,
        setPageSize,
        setSort,
        toggleColumn,
        setTimeRange,
        setTimeWindow,
    };
}
