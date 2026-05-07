import type { DynamicSchema } from "../types";

type Props = {
    schema: DynamicSchema;
    value: Record<string, unknown>;
    onChange: (next: Record<string, unknown>) => void;
    disabled?: boolean;
    className?: string;
};

function updatePath(
    source: Record<string, unknown>,
    path: string[],
    nextValue: unknown,
): Record<string, unknown> {
    if (path.length === 0) return source;
    const [head, ...tail] = path;
    if (tail.length === 0) return { ...source, [head]: nextValue };
    const nested = source[head];
    const nestedObject =
        nested && typeof nested === "object" && !Array.isArray(nested)
            ? (nested as Record<string, unknown>)
            : {};
    return { ...source, [head]: updatePath(nestedObject, tail, nextValue) };
}

function readPath(source: Record<string, unknown>, path: string[]): unknown {
    let value: unknown = source;
    for (const key of path) {
        if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
        value = (value as Record<string, unknown>)[key];
    }
    return value;
}

function renderLabel(path: string[]): string {
    return path.join(".");
}

type FieldsProps = {
    schema: DynamicSchema;
    value: Record<string, unknown>;
    onChange: (next: Record<string, unknown>) => void;
    disabled: boolean;
    path: string[];
};

function Fields({ schema, value, onChange, disabled, path }: FieldsProps) {
    return (
        <>
            {Object.entries(schema).map(([key, descriptor]) => {
                const fieldPath = [...path, key];
                const fieldValue = readPath(value, fieldPath);
                if (typeof descriptor === "object") {
                    return (
                        <fieldset key={fieldPath.join(".")} className="space-y-2 rounded border border-border/70 p-2">
                            <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-muted">
                                {renderLabel(fieldPath)}
                            </legend>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                <Fields
                                    schema={descriptor}
                                    value={value}
                                    onChange={onChange}
                                    disabled={disabled}
                                    path={fieldPath}
                                />
                            </div>
                        </fieldset>
                    );
                }
                if (descriptor === "boolean") {
                    return (
                        <label key={fieldPath.join(".")} className="space-y-1 text-xs text-muted">
                            <span className="block">{renderLabel(fieldPath)}</span>
                            <input
                                type="checkbox"
                                className="h-4 w-4 accent-accent"
                                checked={Boolean(fieldValue)}
                                disabled={disabled}
                                onChange={(event) =>
                                    onChange(updatePath(value, fieldPath, event.target.checked))
                                }
                            />
                        </label>
                    );
                }
                if (descriptor === "json" || descriptor === "array") {
                    const rawValue =
                        fieldValue === undefined
                            ? descriptor === "array"
                                ? "[]"
                                : "{}"
                            : JSON.stringify(fieldValue, null, 2);
                    return (
                        <label key={fieldPath.join(".")} className="space-y-1">
                            <span className="block text-xs text-muted">{renderLabel(fieldPath)}</span>
                            <textarea
                                className="w-full rounded border border-border bg-surface px-2 py-1 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
                                rows={4}
                                value={rawValue}
                                disabled={disabled}
                                onChange={(event) => {
                                    try {
                                        const parsed = JSON.parse(event.target.value) as unknown;
                                        onChange(updatePath(value, fieldPath, parsed));
                                    } catch {
                                        onChange(updatePath(value, fieldPath, event.target.value));
                                    }
                                }}
                            />
                        </label>
                    );
                }
                return (
                    <label key={fieldPath.join(".")} className="space-y-1">
                        <span className="block text-xs text-muted">{renderLabel(fieldPath)}</span>
                        <input
                            type={descriptor === "number" ? "number" : "text"}
                            className="w-full rounded border border-border bg-surface px-2 py-1 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
                            value={String(fieldValue ?? "")}
                            disabled={disabled}
                            onChange={(event) => {
                                const nextValue =
                                    descriptor === "number"
                                        ? Number(event.target.value)
                                        : event.target.value;
                                onChange(updatePath(value, fieldPath, nextValue));
                            }}
                        />
                    </label>
                );
            })}
        </>
    );
}

export default function DynamicSchemaFields({
    schema,
    value,
    onChange,
    disabled = false,
    className,
}: Props) {
    if (Object.keys(schema).length === 0) {
        return <p className="text-xs text-muted">Sin configuración adicional para este tipo.</p>;
    }
    return (
        <div className={className ?? "grid grid-cols-1 gap-2 sm:grid-cols-2"}>
            <Fields
                schema={schema}
                value={value}
                onChange={onChange}
                disabled={disabled}
                path={[]}
            />
        </div>
    );
}
