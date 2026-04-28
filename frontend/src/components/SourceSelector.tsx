import type { SourceConfig } from "../types";

type Props = {
    sources: SourceConfig[];
    selectedId: number | null;
    onSelect: (id: number | null) => void;
};

export default function SourceSelector({ sources, selectedId, onSelect }: Props) {
    return (
        <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Fuente
            </label>
            {sources.length === 0 ? (
                <p className="text-sm text-slate-500">Sin fuentes disponibles</p>
            ) : (
                <select
                    className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    value={selectedId ?? ""}
                    onChange={(e) => {
                        const val = e.target.value;
                        onSelect(val === "" ? null : parseInt(val, 10));
                    }}
                >
                    <option value="">— Selecciona una fuente —</option>
                    {sources.map((src) => (
                        <option key={src.id} value={src.id}>
                            {src.name} (ID: {src.id})
                        </option>
                    ))}
                </select>
            )}
        </div>
    );
}
