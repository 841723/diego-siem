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
        <div className='flex items-center gap-3 text-sm text-muted w-full p-2 pt-0'>
            <p className='flex-1'>
                Mostrando{" "}
                <span className='font-semibold '>{shownCount}</span>{" "}
                de{" "}
                <span className='font-semibold '>{totalCount}</span>{" "}
                logs
            </p>

            <div className='flex items-center gap-4'>
                <label className='flex items-center gap-2'>
                    Filas
                    <select
                        className='rounded border border-border bg-surface px-2 py-1 '
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
                    <span className='min-w-24 text-center '>
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
