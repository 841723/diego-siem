import DynamicSchemaFields from "./DynamicSchemaFields";
import type { PipelineProcessorDraft, ProcessorDefinition } from "../types";

type Props = {
    index: number;
    draft: PipelineProcessorDraft;
    definitions: ProcessorDefinition[];
    disabled?: boolean;
    onTypeChange: (type: string) => void;
    onConfigChange: (config: Record<string, unknown>) => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onRemove: () => void;
    canMoveUp: boolean;
    canMoveDown: boolean;
    canRemove: boolean;
};

export default function PipelineProcessorRow({
    index,
    draft,
    definitions,
    disabled = false,
    onTypeChange,
    onConfigChange,
    onMoveUp,
    onMoveDown,
    onRemove,
    canMoveUp,
    canMoveDown,
    canRemove,
}: Props) {
    const definition = definitions.find((item) => item.id === draft.type) ?? null;

    return (
        <div className="space-y-3 rounded border border-border bg-surface p-3">
            <div className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary font-mono text-xs text-muted">
                    {index + 1}
                </span>
                <div className="flex-1 space-y-1">
                    <label className="block text-xs text-muted">Tipo de procesador</label>
                    <select
                        className="w-full rounded border border-border bg-surface px-2 py-1 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
                        value={draft.type}
                        disabled={disabled}
                        onChange={(event) => onTypeChange(event.target.value)}
                    >
                        {definitions.map((item) => (
                            <option key={item.id} value={item.id}>
                                {item.name}
                            </option>
                        ))}
                    </select>
                    {definition?.description ? (
                        <p className="text-xs text-muted/80">{definition.description}</p>
                    ) : null}
                </div>
                <div className="mt-5 flex gap-1">
                    <button
                        type="button"
                        onClick={onMoveUp}
                        disabled={disabled || !canMoveUp}
                        className="rounded border border-border px-2 py-0.5 text-xs text-muted hover:bg-primary/30 disabled:opacity-30"
                        title="Mover arriba"
                    >
                        ↑
                    </button>
                    <button
                        type="button"
                        onClick={onMoveDown}
                        disabled={disabled || !canMoveDown}
                        className="rounded border border-border px-2 py-0.5 text-xs text-muted hover:bg-primary/30 disabled:opacity-30"
                        title="Mover abajo"
                    >
                        ↓
                    </button>
                    <button
                        type="button"
                        onClick={onRemove}
                        disabled={disabled || !canRemove}
                        className="rounded border border-error/50 px-2 py-0.5 text-xs text-error hover:bg-error/10 disabled:opacity-30"
                        title="Eliminar procesador"
                    >
                        ✕
                    </button>
                </div>
            </div>
            <DynamicSchemaFields
                schema={definition?.schema ?? {}}
                value={draft.config}
                onChange={onConfigChange}
                disabled={disabled}
                className="grid grid-cols-1 gap-2 pl-8 sm:grid-cols-2"
            />
        </div>
    );
}
