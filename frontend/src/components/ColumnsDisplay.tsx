type Props = {
    columns: string[];
    availableColumns: string[];
    toggleColumn: (column: string) => void;
};

export default function ColumnsDisplay({
    columns,
    availableColumns,
    toggleColumn,
}: Props) {
    if (columns.length === 0) {
        return (
            <span className='text-sm text-muted'>
                No se han seleccionado columnas
            </span>
        );
    }

    const checkedColumns = availableColumns.filter((col) =>
        columns.includes(col),
    );
    const uncheckedColumns = availableColumns.filter(
        (col) => !columns.includes(col),
    );

    return (
        <aside className='pl-4 h-full'>
            <h2 className='block text-xs font-semibold uppercase tracking-wider text-muted mb-4'>
                Columnas
            </h2>
            <div className='space-y-1'>
                <div>
                    <span className='text-xs font-semibold uppercase tracking-wider text-muted'>
                        Mostrando ({columns.length})
                    </span>
                    {checkedColumns.map((col) => (
                        <label
                            key={col}
                            className='flex items-center gap-2 text-sm text-muted cursor-pointer'
                        >
                            <input
                                type='checkbox'
                                checked={columns.includes(col)}
                                onChange={() => toggleColumn(col)}
                                className='accent-accent'
                            />
                            {col}
                        </label>
                    ))}
                </div>
                <div>
                    <span className='text-xs font-semibold uppercase tracking-wider text-muted'>
                        Disponibles ({uncheckedColumns.length})
                    </span>
                    {uncheckedColumns.map((col) => (
                        <label
                            key={col}
                            className='flex items-center gap-2 text-sm text-muted cursor-pointer'
                        >
                            <input
                                type='checkbox'
                                checked={columns.includes(col)}
                                onChange={() => toggleColumn(col)}
                                className='accent-accent'
                            />
                            {col}
                        </label>
                    ))}
                </div>
            </div>
        </aside>
    );
}
