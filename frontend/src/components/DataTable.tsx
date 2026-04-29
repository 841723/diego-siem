import type { ReactNode } from "react";
import EmptyState from "./EmptyState";

type Props = {
    headers: string[];
    rows: ReactNode[][];
    emptyMessage?: string;
};

export default function DataTable({ headers, rows, emptyMessage }: Props) {
    if (rows.length === 0) {
        return <EmptyState message={emptyMessage} />;
    }

    return (
        <div className="overflow-auto rounded border border-border">
            <table className="min-w-full border-collapse text-sm">
                <thead className="bg-secondary">
                    <tr>
                        {headers.map((h) => (
                            <th
                                key={h}
                                className="border-b border-border p-2 text-left font-semibold text-white"
                            >
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((cells, rowIdx) => (
                        <tr
                            key={rowIdx}
                            className="odd:bg-primary/30 even:bg-primary/20 hover:bg-accent/50"
                        >
                            {cells.map((cell, colIdx) => (
                                <td
                                    key={colIdx}
                                    className="border-b border-border p-2 align-top text-sm"
                                >
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
