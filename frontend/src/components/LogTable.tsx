import { formatCellValue, formatTimestamp } from "../hooks/useLogFilters";
import type { LogEntry } from "../types";

type Props = {
    loading: boolean;
    logs: LogEntry[];
    columns: string[];
};

const getCellValue = (
    loading: boolean,
    log: LogEntry,
    col: string,
): string => {
    if (loading) return " ";
    if (col === "timestamp") return formatTimestamp(log.timestamp);
    if (col === "sourceid") return String(log.sourceid);
    return formatCellValue(log.data?.[col]);
};

export default function LogTable({ loading = true, logs, columns }: Props) {
    if (columns.length === 0) {
        return (
            <div className='rounded border border-border bg-surface/60 px-4 py-6 text-center text-sm text-muted'>
                No hay columnas seleccionadas.
            </div>
        );
    }

    // if (logs.length === 0) {
    //     return <EmptyState message="No hay logs para los criterios seleccionados" />;
    // }

    return (
        <div className='flex-1 flex flex-col overflow-hidden'>
            <div
                className='grid bg-secondary text-white text-sm tracking-wider'
                style={{
                    gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`,
                }}
            >
                {columns.map((col) => (
                    <div key={col} className='p-2'>
                        {col}
                    </div>
                ))}
            </div>
            <div className='flex-1 overflow-auto'>
                {logs.map((log) => (
                    <div
                        key={log._row_key}
                        className='grid odd:bg-primary/60 even:bg-primary/20 odd:text-text even:text-muted hover:bg-accent cursor-default'
                        style={{
                            gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`,
                        }}
                    >
                        {columns.map((col, idx) => (
                            <div
                                key={col}
                                className='group relative p-1 border-3 border-transparent text-xs wrap-break-word h-8 my-auto hover:border-primary hover:rounded-r hover:rounded-b'
                            >
                                <span className='line-clamp-2 font-mono'>
                                    {getCellValue(loading, log, col)}
                                </span>
                                {!loading && (
                                    <div
                                        // haz que tarde 500ms en aparecer para evitar que aparezca al hacer hover rápido entre celdas
                                        className='absolute -top-0.5 opacity-0 group-hover:opacity-100 flex gap-0.5 bg-primary px-1 py-0.5 z-10'
                                        style={{
                                            right: idx === 0 ? "-60px" : "",
                                            left: idx === 0 ? "" : "-60px",
                                            borderRadius:
                                                idx === 0
                                                    ? "0 0.25rem 0.25rem 0"
                                                    : "0.25rem 0 0 0.25rem",
                                            transition:
                                                "opacity 0.5s step-end 0s",
                                        }}
                                    >
                                        <button
                                            className='bg-muted font-extrabold text-accent text-xs rounded-full h-4 w-4 flex items-center justify-center border hover:bg-accent/80 hover:text-primary transition-colors'
                                            title='Filter in'
                                            onClick={() => {
                                                navigator.clipboard.writeText(
                                                    getCellValue(
                                                        loading,
                                                        log,
                                                        col,
                                                    ),
                                                );
                                            }}
                                        >
                                            <svg
                                                width='24'
                                                height='24'
                                                viewBox='0 0 24 24'
                                                fill='none'
                                                stroke='currentColor'
                                                strokeWidth='3'
                                            >
                                                <path d='M12 5l0 14' />
                                                <path d='M5 12l14 0' />
                                            </svg>
                                        </button>
                                        <button
                                            className='bg-muted font-extrabold text-accent text-xs rounded-full h-4 w-4 flex items-center justify-center border hover:bg-accent/80 hover:text-primary transition-colors'
                                            title='Filter out'
                                            onClick={() => {
                                                navigator.clipboard.writeText(
                                                    getCellValue(
                                                        loading,
                                                        log,
                                                        col,
                                                    ),
                                                );
                                            }}
                                        >
                                            <svg
                                                width='24'
                                                height='24'
                                                viewBox='0 0 24 24'
                                                fill='none'
                                                stroke='currentColor'
                                                strokeWidth='3'
                                            >
                                                <path d='M5 12l14 0' />
                                            </svg>
                                        </button>
                                        <button
                                            className='bg-muted font-extrabold text-accent text-xs rounded-full h-4 w-4 flex items-center justify-center border hover:bg-accent/80 hover:text-primary transition-colors'
                                            title='Copy value'
                                            onClick={() => {
                                                navigator.clipboard.writeText(
                                                    getCellValue(
                                                        loading,
                                                        log,
                                                        col,
                                                    ),
                                                );
                                            }}
                                        >
                                            <svg
                                                width='14'
                                                height='14'
                                                viewBox='0 0 24 24'
                                                fill='none'
                                                stroke='currentColor'
                                                strokeWidth='1.5'
                                            >
                                                <path d='M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2' />
                                                <path d='M9 3m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z' />
                                                <path d='M9 12h6' />
                                                <path d='M9 16h6' />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

