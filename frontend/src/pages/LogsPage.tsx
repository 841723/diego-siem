import ColumnsDisplay from "../components/ColumnsDisplay";
import Pagination from "../components/Pagination";
import LogTable from "../components/LogTable";
import Select from "../components/Select";
import {
    TIME_WINDOWS,
    useLogFilters,
} from "../hooks/useLogFilters";
import { useSources } from "../hooks/useSources";
import type { SourceConfig } from "../types";

export default function LogsPage() {
    const { sources } = useSources();
    const sortedSources = [...sources].sort((a, b) =>
        a.name.localeCompare(b.name),
    );
    const sourceIds = sources.map((s) => s.id);

    const filters = useLogFilters(sourceIds);

    const {
        sourceId,
        filterText,
        columns,
        page,
        totalLogs,
        timeWindow,
        setSource,
        setTimeWindow,
        setFilterText,
        toggleColumn,
        setPage,
        paginatedLogs,
        availableColumns,
        totalPages,
        logsLoading,
        logsError,
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
                    list={sortedSources}
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
                    <div className='flex gap-2'>
                        <input
                            type='text'
                            placeholder='Buscar logs...'
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                            className='w-full rounded border border-border bg-surface px-3 py-2 text-sm text-text focus:accent-accent'
                        />
                        <button
                            type='button'
                            onClick={() => setFilterText(filterText)}
                            className='rounded bg-accent px-4 py-2 text-sm font-semibold hover:bg-accent/80 active:bg-accent/90 text-white'
                        >
                            Buscar
                        </button>
                    </div>
                </div>
                <Select
                    list={TIME_WINDOWS}
                    selected={timeWindow}
                    getValue={(item) => item.value}
                    onSelect={(item) => item && setTimeWindow(item.value)}
                    renderOption={(item) => item.label}
                    label='Ventana'
                />
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
                        totalCount={totalLogs}
                    />
                </div>
            </section>
        </main>
    );
}
