import { formatCellValue, formatTimestamp } from "../hooks/useLogFilters";
import type { LogEntry } from "../types";

type Props = {
    logsLoading: boolean;
    logs: LogEntry[];
    columns: string[];
};

const getCellValue = (
    logsLoading: boolean,
    log: LogEntry,
    col: string,
): string => {
    if (logsLoading) return " ";
    if (col === "timestamp") return formatTimestamp(log.timestamp);
    if (col === "sourceid") return String(log.sourceid);
    return formatCellValue(log.data?.[col]);
};

export default function LogTable({ logsLoading = true, logs, columns }: Props) {
    // if (logs.length === 0) {
    //     return <EmptyState message="No hay logs para los criterios seleccionados" />;
    // }

    return (
        <div className='flex-1 flex flex-col overflow-hidden bg-surface rounded-tl'>
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
                        className='grid odd:bg-primary/60 even:bg-primary/20 hover:bg-accent/10 cursor-default'
                        style={{
                            gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`,
                        }}
                    >
                        {columns.map((col) => (
                            <div
                                key={col}
                                className='group relative p-1 border-3 border-transparent text-xs wrap-break-word h-8 my-auto hover:border-accent hover:rounded-r hover:rounded-b'
                            >
                                <span className='line-clamp-2 font-mono'>
                                    {getCellValue(logsLoading, log, col)}
                                </span>
                                {!logsLoading && (
                                    <div className='absolute -left-11 -top-0.5 opacity-0  group-hover:opacity-100 transition-opacity flex gap-0.5 bg-accent rounded-l px-1 py-0.5'>
                                        <button
                                            className='bg-muted font-extrabold text-accent text-xs rounded-full h-4 w-4 flex items-center justify-center border hover:bg-accent/80 hover:text-white transition-colors'
                                            title='Filter in'
                                            onClick={() => {
                                                navigator.clipboard.writeText(
                                                    getCellValue(
                                                        logsLoading,
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
                                                stroke-width='3'
                                            >
                                                <path d='M12 5l0 14' />
                                                <path d='M5 12l14 0' />
                                            </svg>
                                        </button>
                                        <button
                                            className='bg-muted font-extrabold text-accent text-xs rounded-full h-4 w-4 flex items-center justify-center border hover:bg-accent/80 hover:text-white transition-colors'
                                            title='Filter out'
                                            onClick={() => {
                                                navigator.clipboard.writeText(
                                                    getCellValue(
                                                        logsLoading,
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
                                                stroke-width='3'
                                            >
                                                <path d='M5 12l14 0' />
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
