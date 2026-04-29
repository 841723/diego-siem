import type { SourceConfig } from "../types";

type Props = {
    sources: SourceConfig[];
    selectedId: number | null;
    onSelect: (id: number | null) => void;
};

export default function SourceSelector({
    sources,
    selectedId,
    onSelect,
}: Props) {
    return (
        <div className='space-y-1'>
            <label className='block text-xs font-semibold uppercase tracking-wider text-text'>
                Fuente
            </label>
            {sources.length === 0 ? (
                <p className='text-sm text-text'>Sin fuentes disponibles</p>
            ) : (
                <select
                    className='w-full rounded border border-border bg-surface px-3 py-2 text-sm text-text focus:accent-accent'
                    value={selectedId ?? ""}
                    onChange={(e) => {
                        const val = e.target.value;
                        onSelect(val === "" ? null : parseInt(val, 10));
                    }}
                >
                    {sources.map((src) => (
                        <option
                            key={src.id}
                            value={src.id}
                            className='h-auto whitespace-normal leading-snug hover:bg-primary/50'
                        >
                            {src.name} (ID: {src.id})
                        </option>
                    ))}
                </select>
            )}
        </div>
    );
}
