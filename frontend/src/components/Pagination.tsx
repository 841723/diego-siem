type Props = {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    shownCount: number;
    totalCount: number;
};

export default function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    shownCount,
    totalCount,
}: Props) {
    const pages = [1, 2, 3, 4, 5];

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
                <div className='flex items-center gap-2'>
                    {pages.map((page) => (
                        <button
                            key={page}
                            className={`rounded border px-3 py-1 hover:border-border/80 ${
                                page === currentPage
                                    ? "border-accent bg-accent/20 text-text"
                                    : "border-border"
                            }`}
                            disabled={page > totalPages}
                            onClick={() => onPageChange(page)}
                        >
                            {page}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
