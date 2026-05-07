import ColumnsDisplay from "../components/ColumnsDisplay";
import Pagination from "../components/Pagination";
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
    const { sources } = useSources();
    const sourceIds = sources.map((s) => s.id);

    const filters = useLogFilters(sourceIds);

    const {
        sourceId,
        filterText,
        columns,
        page,
        pageSize,
        totalLogs,
        timeWindow,
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
        <main className='flex flex-col gap-2 overflow-hidden h-full'>
            {logsError && (
                <p className='rounded bg-error/40 px-3 py-2 text-sm text-error'>
                    {logsError}
                </p>
            )}

            <header className='flex flex-wrap gap-4 bg-background p-4  pt-2'>
                <Select
                    list={sources.sort((a, b) => a.name.localeCompare(b.name))}
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
                    selected={timeWindow}
                    getValue={(item) => item.value}
                    onSelect={(item) => item && setTimeWindow(item.value)}
                    renderOption={(item) => item.label}
                    label='Ventana'
                />
                {/* <Select
                    list={PAGE_SIZE_OPTIONS}
                    selected={pageSize.toString()}
                    getValue={(item) => item.toString()}
                    onSelect={(item) => item && setPageSize(Number(item))}
                    renderOption={(item) => item.toString()}
                    label='Cantidad'
                /> */}
                <button
                    className='self-end rounded bg-accent px-3 py-2 text-sm text-muted font-semibold uppercase tracking-wider hover:bg-accent/80 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-50 h-[37.6px] w-20'
                    onClick={refetchLogs}
                    disabled={logsLoading}
                >
                    {logsLoading ? "..." : "Buscar"}
                </button>
            </header>

            <section className='overflow-hidden grid grid-cols-[1fr_7fr]'>
                <ColumnsDisplay
                    columns={columns}
                    availableColumns={availableColumns}
                    toggleColumn={toggleColumn}
                />
                <div className='flex flex-col gap-2 overflow-hidden'>
                    <span className='block text-xs font-semibold uppercase tracking-wider text-muted'>
                        En total: {totalLogs} logs
                    </span>
                    <LogTable
                        loading={logsLoading}
                        logs={paginatedLogs}
                        columns={columns}
                    />
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
                </div>
            </section>
        </main>
    );
}
