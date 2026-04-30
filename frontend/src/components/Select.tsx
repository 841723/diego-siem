type Props<T> = {
    list: T[];
    selected: string | null;
    getValue: (item: T) => string;
    onSelect: (item: T | null) => void;
    renderOption: (item: T) => React.ReactNode;
    label: string
};

export default function Select<T>({
    list,
    selected,
    getValue,
    onSelect,
    renderOption,
    label
}: Props<T>) {
    return (
        <div className='space-y-1'>
            <label className='block text-xs font-semibold uppercase tracking-wider text-muted'>
                {label}
            </label>
            {list.length === 0 ? (
                <p className='w-full rounded border border-border bg-surface px-3 py-2 text-sm text-text'>
                    Sin opciones disponibles
                </p>
            ) : (
                <select
                    className='w-full rounded border border-border bg-surface px-3 py-2 text-sm text-text focus:accent-accent'
                    value={selected ?? ""}
                    onChange={(e) => {
                        const val = e.target.value;
                        const item =
                            list.find((i) => getValue(i) === val) || null;
                        onSelect(item ?? null);
                    }}
                >
                    {list.map((item, index) => (
                        <option
                            key={index}
                            value={getValue(item)}
                            className='h-auto text-text whitespace-normal leading-snug hover:bg-primary/50'
                        >
                            {renderOption(item)}
                        </option>
                    ))}
                </select>
            )}
        </div>
    );
}
