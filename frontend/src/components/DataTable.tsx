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
        <div className='flex-1 flex flex-col overflow-hidden'>
            <div
                className='grid bg-secondary text-white text-sm tracking-wider'
                style={{
                    gridTemplateColumns: `repeat(${headers.length}, minmax(0, 1fr))`,
                }}
            >
                {headers.map((col) => (
                    <div
                        key={col}
                        className='border-b border-border p-2 text-left font-semibold text-white'
                    >
                        {col}
                    </div>
                ))}
            </div>
            <div className='flex-1 overflow-auto'>
                {rows.map((cells, idx) => (
                    <div
                        key={idx}
                        className='grid odd:bg-primary/30 even:bg-primary/20 cursor-default'
                        style={{
                            gridTemplateColumns: `repeat(${headers.length}, minmax(0, 1fr))`,
                        }}
                    >
                        {cells.map((cell, colIdx) => (
                            <div
                                key={colIdx}
                                className='border-b border-border p-2 align-top text-sm'
                            >
                                <span className='line-clamp-2 font-mono'>
                                    {cell}
                                </span>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
