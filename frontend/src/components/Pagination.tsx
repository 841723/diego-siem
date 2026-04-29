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
        <div className='mt-3 flex flex-wrap items-center justify-between gap-3 text-sm'>
            <p className='text-text'>
                Mostrando{" "}
                <span className='font-semibold text-text'>{shownCount}</span>{" "}
                de{" "}
                <span className='font-semibold text-text'>{totalCount}</span>{" "}
                logs
            </p>

            <div className='flex items-center gap-4'>
                <label className='flex items-center gap-2 text-text'>
                    Filas
                    <select
                        className='rounded border border-border bg-surface px-2 py-1 text-text'
                        value={pageSize}
                        onChange={(e) =>
                            onPageSizeChange(Number(e.target.value))
                        }
                    >
                        {pageSizeOptions.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                </label>

                <div className='flex items-center gap-2'>
                    <button
                        className='rounded border border-border px-3 py-1 disabled:opacity-40 hover:border-border/80'
                        disabled={currentPage <= 1}
                        onClick={() => onPageChange(currentPage - 1)}
                    >
                        ‹
                    </button>
                    <span className='min-w-24 text-center text-text'>
                        Página {currentPage} / {totalPages}
                    </span>
                    <button
                        className='rounded border border-border px-3 py-1 disabled:opacity-40 hover:border-border/80'
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
