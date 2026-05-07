import { RULE_CONFIG_SCHEMA } from "../types/rules";
import type { RuleType } from "../types";

type Props = {
    type: RuleType;
    config: Record<string, unknown>;
    onChange: (next: Record<string, unknown>) => void;
};

export default function RuleConfigFields({ type, config, onChange }: Props) {
    const schema = RULE_CONFIG_SCHEMA[type];

    function setField(key: string, value: unknown) {
        onChange({ ...config, [key]: value });
    }

    return (
        <div className="rounded-xl border border-border bg-surface/60 p-4">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
                Configuración ({type})
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {schema.map((field) => {
                    const value = config[field.key];

                    if (field.type === "boolean") {
                        return (
                            <label
                                key={field.key}
                                className="flex items-center gap-2 rounded border border-border px-3 py-2 text-sm text-text"
                            >
                                <input
                                    type="checkbox"
                                    className="h-4 w-4 accent-accent"
                                    checked={Boolean(value ?? false)}
                                    onChange={(event) =>
                                        setField(field.key, event.target.checked)
                                    }
                                />
                                {field.label}
                            </label>
                        );
                    }

                    if (field.type === "json") {
                        return (
                            <div key={field.key} className="space-y-1 sm:col-span-2">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                                    {field.label}
                                </label>
                                <textarea
                                    className="w-full rounded border border-border bg-surface px-3 py-2 font-mono text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
                                    rows={5}
                                    value={JSON.stringify(value ?? {}, null, 2)}
                                    onChange={(event) => {
                                        try {
                                            const parsed = JSON.parse(
                                                event.target.value || "{}",
                                            ) as Record<string, unknown>;
                                            setField(field.key, parsed);
                                        } catch {
                                            setField(field.key, event.target.value);
                                        }
                                    }}
                                />
                            </div>
                        );
                    }

                    if (field.type === "text-list") {
                        return (
                            <div key={field.key} className="space-y-1">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                                    {field.label}
                                </label>
                                <input
                                    className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent"
                                    value={
                                        Array.isArray(value) ? value.join(", ") : ""
                                    }
                                    onChange={(event) =>
                                        setField(
                                            field.key,
                                            event.target.value
                                                .split(",")
                                                .map((item) => item.trim())
                                                .filter(Boolean),
                                        )
                                    }
                                    placeholder="a, b, c"
                                />
                            </div>
                        );
                    }

                    return (
                        <div key={field.key} className="space-y-1">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                                {field.label}
                            </label>
                            <input
                                type={field.type === "number" ? "number" : "text"}
                                className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent"
                                value={
                                    field.type === "number"
                                        ? String(value ?? 0)
                                        : String(value ?? "")
                                }
                                onChange={(event) =>
                                    setField(
                                        field.key,
                                        field.type === "number"
                                            ? Number(event.target.value)
                                            : event.target.value,
                                    )
                                }
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
