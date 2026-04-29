import type { SourceConfig } from "../types";
import { TIME_WINDOWS, PAGE_SIZE_OPTIONS } from "../hooks/useLogFilters";
import SourceSelector from "./SourceSelector";

type Props = {
    sources: SourceConfig[];
    selectedId: number | null;
    onSelectSource: (id: number | null) => void;

    timeWindow: string;
    onTimeWindowChange: (v: string) => void;

    filterText: string;
    onFilterTextChange: (v: string) => void;

    availableColumns: string[];
    selectedColumns: string[];
    onToggleColumn: (col: string) => void;

    pageSize: number;
    onPageSizeChange: (s: number) => void;

    onSearch: () => void;
};

export default function FilterBar({
    sources,
    selectedId,
    onSelectSource,
    timeWindow,
    onTimeWindowChange,
    filterText,
    onFilterTextChange,
    availableColumns,
    selectedColumns,
    onToggleColumn,
    pageSize,
    onPageSizeChange,
    onSearch,
}: Props) {
    return (
        <section className="p-4">
            <div className="grid gap-4 md:grid-cols-4">
                {/* Source selector */}
                <SourceSelector
                    sources={sources}
                    selectedId={selectedId}
                    onSelect={onSelectSource}
                />

                {/* Time window */}
                <div className="space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-text">
                        Ventana temporal
                    </label>
                    <select
                        className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:accent-accent"
                        value={timeWindow}
                        onChange={(e) => onTimeWindowChange(e.target.value)}
                    >
                        {TIME_WINDOWS.map((w) => (
                            <option key={w.value} value={w.value}>
                                {w.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Text filter */}
                <div className="space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-text">
                        Buscar
                    </label>
                    <input
                        className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text focus:outline-none focus:ring-1 focus:accent-accent"
                        value={filterText}
                        onChange={(e) => onFilterTextChange(e.target.value)}
                        placeholder="IP, user, error, auth…"
                    />
                </div>

                {/* Page size + search button */}
                <div className="flex flex-col justify-between gap-2">
                    <div className="space-y-1">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-text">
                            Filas por página
                        </label>
                        <select
                            className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:accent-accent"
                            value={pageSize}
                            onChange={(e) => onPageSizeChange(Number(e.target.value))}
                        >
                            {PAGE_SIZE_OPTIONS.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button
                        className="rounded bg-accent px-4 py-2 text-sm font-semibold hover:bg-accent/80 active:bg-accent/90 text-white"
                        onClick={onSearch}
                    >
                        Buscar
                    </button>
                </div>
            </div>

            {/* Column selector */}
            {availableColumns.length > 0 && (
                <div className="mt-4 border-t border-border pt-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text">
                        Columnas visibles
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {availableColumns.map((col) => (
                            <label
                                key={col}
                                className="flex cursor-pointer items-center gap-1.5 rounded bg-surface px-2 py-1 text-xs"
                            >
                                <input
                                    type="checkbox"
                                    className="accent-accent"
                                    checked={selectedColumns.includes(col)}
                                    onChange={() => onToggleColumn(col)}
                                />
                                {col}
                            </label>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}
