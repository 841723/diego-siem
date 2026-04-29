import type { LogEntry } from "../types";
import { formatTimestamp, formatCellValue } from "../hooks/useLogFilters";
import EmptyState from "./EmptyState";

type Props = {
    logs: LogEntry[];
    columns: string[];
};

export default function LogTable({ logs, columns }: Props) {
    if (logs.length === 0) {
        return <EmptyState message="No hay logs para los criterios seleccionados" />;
    }

    return (
        <div className='overflow-auto rounded border border-border'>
            <table className='min-w-full border-collapse text-sm'>
                <thead className='bg-secondary'>
                    <tr>
                        {columns.map((col) => (
                            <th
                                key={col}
                                className='border-b border-border p-2 text-left font-semibold text-white'
                            >
                                {col}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {logs.map((log) => (
                        <tr
                            key={log._row_key}
                            className='odd:bg-primary/30 even:bg-primary/20 hover:bg-accent/50 '
                        >
                            {columns.map((col) => (
                                <td
                                    key={col}
                                    className='border-b border-border p-2 align-top font-mono text-xs'
                                >
                                    {col === "timestamp"
                                        ? formatTimestamp(log.timestamp)
                                        : col === "sourceid"
                                          ? String(log.sourceid)
                                          : formatCellValue(log.data?.[col])}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
