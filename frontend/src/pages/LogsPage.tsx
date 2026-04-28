import { useSources } from "../hooks/useSources";
import { useLogFilters } from "../hooks/useLogFilters";
import FilterBar from "../components/FilterBar";
import LogTable from "../components/LogTable";
import Pagination from "../components/Pagination";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import { PAGE_SIZE_OPTIONS } from "../hooks/useLogFilters";

export default function LogsPage() {
    const { sources, loading: sourcesLoading } = useSources();
    const sourceIds = sources.map((s) => s.id);

    const filters = useLogFilters(sourceIds);

    const {
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
        setPage,
        setPageSize,
        filteredLogs,
        paginatedLogs,
        availableColumns,
        totalPages,
        logsLoading,
        logsError,
        refetchLogs,
    } = filters;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Logs</h1>
                    <p className="mt-1 text-sm text-slate-400">
                        Consulta y filtra los eventos recibidos por fuente.
                    </p>
                </div>
                {logsError && (
                    <p className="rounded bg-rose-900/40 px-3 py-2 text-sm text-rose-200">
                        {logsError}
                    </p>
                )}
            </div>

            <FilterBar
                sources={sources}
                selectedId={sourceId}
                onSelectSource={setSource}
                timeWindow={timeWindow}
                onTimeWindowChange={setTimeWindow}
                filterText={filterText}
                onFilterTextChange={setFilterText}
                availableColumns={availableColumns}
                selectedColumns={columns}
                onToggleColumn={toggleColumn}
                pageSize={pageSize}
                onPageSizeChange={setPageSize}
                onSearch={refetchLogs}
            />

            {sourcesLoading || logsLoading ? (
                <LoadingState />
            ) : sourceId === null ? (
                <EmptyState message="Selecciona una fuente para ver los logs" />
            ) : (
                <>
                    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
                        <LogTable logs={paginatedLogs} columns={columns} />
                        <Pagination
                            currentPage={page}
                            totalPages={totalPages}
                            onPageChange={setPage}
                            shownCount={paginatedLogs.length}
                            totalCount={filteredLogs.length}
                            pageSize={pageSize}
                            pageSizeOptions={PAGE_SIZE_OPTIONS}
                            onPageSizeChange={setPageSize}
                        />
                    </section>
                </>
            )}
        </div>
    );
}
