type Props = {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    shownCount: number;
    totalCount: number;
    pageSize: number;
    pageSizeOptions: readonly number[];
    onPageSizeChange: (size: number) => void;
};

export default function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    shownCount,
    totalCount,
    pageSize,
    pageSizeOptions,
    onPageSizeChange,
}: Props) {
    return (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
            <p className="text-slate-400">
                Mostrando{" "}
                <span className="font-semibold text-slate-200">{shownCount}</span>{" "}
                de{" "}
                <span className="font-semibold text-slate-200">{totalCount}</span>{" "}
                logs
            </p>

            <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-slate-400">
                    Filas
                    <select
                        className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-slate-200"
                        value={pageSize}
                        onChange={(e) => onPageSizeChange(Number(e.target.value))}
                    >
                        {pageSizeOptions.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                </label>

                <div className="flex items-center gap-2">
                    <button
                        className="rounded border border-slate-700 px-3 py-1 disabled:opacity-40 hover:border-slate-600"
                        disabled={currentPage <= 1}
                        onClick={() => onPageChange(currentPage - 1)}
                    >
                        ‹
                    </button>
                    <span className="min-w-[6rem] text-center text-slate-300">
                        Página {currentPage} / {totalPages}
                    </span>
                    <button
                        className="rounded border border-slate-700 px-3 py-1 disabled:opacity-40 hover:border-slate-600"
                        disabled={currentPage >= totalPages}
                        onClick={() => onPageChange(currentPage + 1)}
                    >
                        ›
                    </button>
                </div>
            </div>
        </div>
    );
}
