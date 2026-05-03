import { type FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { createMapping, getMapping, updateMapping } from "../services/api";
import type { FieldType, Mapping, MappingField } from "../types";
import LoadingState from "../components/LoadingState";

const FIELD_TYPES: FieldType[] = ["string", "integer", "decimal", "boolean", "date", "ip"];
const EMPTY_FIELD: MappingField = { name: "", type: "string" };

export default function MappingFormPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    const isEdit = Boolean(id);
    const prefill = location.state as Partial<Omit<Mapping, "id">> | null;

    const [name, setName] = useState(prefill?.name ?? "");
    const [fields, setFields] = useState<MappingField[]>(
        prefill?.fields ?? [{ ...EMPTY_FIELD }],
    );
    const [loadingItem, setLoadingItem] = useState(isEdit);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!isEdit || !id) return;
        let cancelled = false;
        setLoadingItem(true);
        getMapping(id)
            .then((m) => {
                if (!cancelled) {
                    setName(m.name);
                    setFields(m.fields.length > 0 ? m.fields : [{ ...EMPTY_FIELD }]);
                }
            })
            .catch((err: Error) => {
                if (!cancelled) setError(err.message || "Error cargando mapping");
            })
            .finally(() => {
                if (!cancelled) setLoadingItem(false);
            });
        return () => { cancelled = true; };
    }, [id, isEdit]);

    function addField() {
        setFields((prev) => [...prev, { ...EMPTY_FIELD }]);
    }

    function removeField(index: number) {
        setFields((prev) => prev.filter((_, i) => i !== index));
    }

    function updateField(index: number, patch: Partial<MappingField>) {
        setFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
    }

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const validFields = fields.filter((f) => f.name.trim() !== "");
        if (validFields.length === 0) {
            setError("Añade al menos un campo con nombre.");
            return;
        }
        setError("");
        setSubmitting(true);
        try {
            if (isEdit && id) {
                await updateMapping(id, { name, fields: validFields });
            } else {
                await createMapping({ name, fields: validFields });
            }
            navigate("/mappings");
        } catch (err) {
            setError((err as Error).message || "Error al guardar mapping");
        } finally {
            setSubmitting(false);
        }
    }

    if (loadingItem) return <LoadingState message="Cargando mapping…" />;

    return (
        <main className="flex flex-col h-full overflow-hidden">
            {/* Top bar */}
            <div className="flex items-center gap-4 border-b border-border bg-background px-6 py-4 shrink-0">
                <button
                    onClick={() => navigate("/mappings")}
                    className="rounded border border-border px-3 py-1.5 text-sm text-muted hover:bg-primary/30"
                >
                    ← Volver
                </button>
                <h1 className="text-xl font-semibold text-text-logo">
                    {isEdit ? "Editar mapping" : prefill ? "Duplicar mapping" : "Nuevo mapping"}
                </h1>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="mx-auto max-w-2xl">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                                Nombre
                            </label>
                            <input
                                className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="ej. syslog-default"
                                required
                            />
                        </div>

                        {/* Fields editor */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                                    Campos
                                </label>
                                <button
                                    type="button"
                                    onClick={addField}
                                    className="rounded border border-border px-2 py-0.5 text-xs text-muted hover:bg-primary/30"
                                >
                                    + Añadir campo
                                </button>
                            </div>

                            <div className="overflow-auto rounded border border-border">
                                <table className="min-w-full border-collapse text-sm">
                                    <thead className="bg-secondary">
                                        <tr>
                                            {["Nombre del campo", "Tipo", ""].map((h) => (
                                                <th
                                                    key={h}
                                                    className="border-b border-border p-2 text-left text-xs font-semibold text-text-logo"
                                                >
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {fields.map((field, idx) => (
                                            <tr key={idx} className="odd:bg-primary/30 even:bg-primary/20">
                                                <td className="border-b border-border p-2">
                                                    <input
                                                        className="w-full rounded border border-border bg-surface px-2 py-1 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
                                                        value={field.name}
                                                        onChange={(e) => updateField(idx, { name: e.target.value })}
                                                        placeholder="nombre_campo"
                                                    />
                                                </td>
                                                <td className="border-b border-border p-2">
                                                    <select
                                                        className="w-full rounded border border-border bg-surface px-2 py-1 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
                                                        value={field.type}
                                                        onChange={(e) =>
                                                            updateField(idx, { type: e.target.value as FieldType })
                                                        }
                                                    >
                                                        {FIELD_TYPES.map((t) => (
                                                            <option key={t} value={t}>{t}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="border-b border-border p-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeField(idx)}
                                                        disabled={fields.length === 1}
                                                        className="rounded px-2 py-0.5 text-xs text-error hover:bg-error/10 disabled:opacity-30"
                                                    >
                                                        ✕
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {error && (
                            <p className="rounded bg-error/20 px-3 py-2 text-sm text-error">
                                {error}
                            </p>
                        )}

                        <div className="flex gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="rounded bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent/80 disabled:opacity-50"
                            >
                                {submitting ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear mapping"}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate("/mappings")}
                                className="rounded border border-border px-5 py-2 text-sm text-muted hover:bg-primary/30"
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    );
}
