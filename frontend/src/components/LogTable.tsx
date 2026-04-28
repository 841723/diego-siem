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
        <div className="overflow-auto rounded border border-slate-800">
            <table className="min-w-full border-collapse text-sm">
                <thead className="bg-slate-800">
                    <tr>
                        {columns.map((col) => (
                            <th
                                key={col}
                                className="border-b border-slate-700 p-2 text-left font-semibold text-slate-200"
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
                            className="odd:bg-slate-900 even:bg-slate-950 hover:bg-slate-800/60"
                        >
                            {columns.map((col) => (
                                <td
                                    key={col}
                                    className="border-b border-slate-800 p-2 align-top font-mono text-xs"
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
