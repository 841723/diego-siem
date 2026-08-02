import { useEffect } from "react";
import {
    DEFAULT_COLUMNS,
    FIXED_PAGE_SIZE,
    MAX_LOG_PAGES,
    PAGE_SIZE_OPTIONS,
    TIME_WINDOWS,
} from "./logSearch/constants";
import { formatCellValue, formatTimestamp, toTimestampMs } from "./logSearch/formatters";
import { useLogSearch } from "./logSearch/useLogSearch";
import { useLogSearchParams } from "./logSearch/useLogSearchParams";

export {
    DEFAULT_COLUMNS,
    FIXED_PAGE_SIZE,
    MAX_LOG_PAGES,
    PAGE_SIZE_OPTIONS,
    TIME_WINDOWS,
    formatCellValue,
    formatTimestamp,
    toTimestampMs,
};

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
    setSort: (sort: string) => void;
    filteredLogs: ReturnType<typeof useLogSearch>["visibleLogs"];
    paginatedLogs: ReturnType<typeof useLogSearch>["visibleLogs"];
    availableColumns: string[];
    totalPages: number;
    logsLoading: boolean;
    logsError: string;
    sort: string;
};

export function useLogFilters(availableSourceIds: string[]): LogFiltersState {
    const {
        filters,
        setDataset,
        setPage,
        setPageSize,
        setQuery,
        setSort,
        setTimeWindow,
        toggleColumn,
    } = useLogSearchParams(availableSourceIds);
    const { visibleLogs, availableColumns, totalLogs, totalPages, loading, error } =
        useLogSearch(filters);

    useEffect(() => {
        if (!filters.dataset && availableSourceIds.length > 0) {
            setDataset(availableSourceIds[0]);
        }
    }, [availableSourceIds, filters.dataset, setDataset]);

    return {
        sourceId: filters.dataset,
        timeWindow: filters.timeWindow,
        filterText: filters.query,
        columns: filters.columns,
        page: filters.page,
        pageSize: filters.pageSize,
        totalLogs,
        setSource: setDataset,
        setTimeWindow,
        setFilterText: setQuery,
        toggleColumn,
        setPage,
        setPageSize,
        setSort,
        filteredLogs: visibleLogs,
        paginatedLogs: visibleLogs,
        availableColumns,
        totalPages,
        logsLoading: loading,
        logsError: error,
        sort: filters.sort,
    };
}
