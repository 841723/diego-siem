import ColumnsDisplay from "../components/ColumnsDisplay";
import EmptyState from "../components/EmptyState";
import FilterBar from "../components/FilterBar";
import LoadingState from "../components/LoadingState";
import LogTable from "../components/LogTable";
import Select from "../components/Select";
import {
    PAGE_SIZE_OPTIONS,
    TIME_WINDOWS,
    useLogFilters,
} from "../hooks/useLogFilters";
import { useSources } from "../hooks/useSources";
import type { SourceConfig } from "../types";

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
        totalLogs,
        setSource,
        setTimeWindow,
        setFilterText,
        toggleColumn,
        setPage,
        setPageSize,
        // setTotalLogs,
        filteredLogs,
        paginatedLogs,
        availableColumns,
        totalPages,
        logsLoading,
        logsError,
        refetchLogs,
    } = filters;

    return (
        <main className='flex flex-col gap-4 overflow-hidden h-full'>
            {logsError && (
                <p className='rounded bg-error/40 px-3 py-2 text-sm text-error'>
                    {logsError}
                </p>
            )}

            {/* <FilterBar
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
            /> */}
            <header className='flex flex-wrap gap-4 bg-background p-4'>
                <Select
                    list={sources}
                    selected={String(sourceId)}
                    getValue={(item) => String(item.id)}
                    onSelect={(item: SourceConfig | null) =>
                        setSource(item ? item.id : null)
                    }
                    renderOption={(source) => source.name}
                    label='Fuente'
                />
                <div className='space-y-1 flex-1'>
                    <label className='block text-xs font-semibold uppercase tracking-wider text-muted'>
                        Búsqueda
                    </label>
                    <input
                        type='text'
                        placeholder='Buscar logs...'
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                        className='w-full rounded border border-border bg-surface px-3 py-2 text-sm text-text focus:accent-accent'
                    />
                </div>
                <Select
                    list={TIME_WINDOWS}
                    selected={null}
                    getValue={(item) => item.value}
                    onSelect={(item) => item && setTimeWindow(item.value)}
                    renderOption={(item) => item.label}
                    label='Ventana'
                />
                <Select
                    list={PAGE_SIZE_OPTIONS}
                    selected={pageSize.toString()}
                    getValue={(item) => item.toString()}
                    onSelect={(item) => item && setPageSize(Number(item))}
                    renderOption={(item) => item.toString()}
                    label='Cantidad'
                />
            </header>

            <section className='overflow-hidden grid grid-cols-[1fr_4fr]'>
                <ColumnsDisplay
                    columns={columns}
                    availableColumns={availableColumns}
                    toggleColumn={toggleColumn}
                />
                <div className='flex flex-col gap-4 overflow-hidden'>
                    <span className='block text-xs font-semibold uppercase tracking-wider text-muted'>
                        En total: {totalLogs} logs
                    </span>
                    <LogTable
                        logsLoading={logsLoading}
                        logs={paginatedLogs}
                        columns={columns}
                    />
                </div>
                {/* <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    shownCount={paginatedLogs.length}
                    totalCount={filteredLogs.length}
                    pageSize={pageSize}
                    pageSizeOptions={PAGE_SIZE_OPTIONS}
                    onPageSizeChange={setPageSize}
                /> */}
            </section>
        </main>
    );
}
