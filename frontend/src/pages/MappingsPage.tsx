import { type FormEvent, useState } from "react";
import { useGlobalMapping, FALLBACK_MAPPING_TYPES } from "../hooks/useGlobalMapping";
import { setGlobalMapping } from "../services/api";
import type { MappingField, MappingType } from "../types";
import ConfirmModal from "../components/ConfirmModal";
import LoadingState from "../components/LoadingState";

// ── Blank field helper ────────────────────────────────────────────────────────
function blankField(mappingTypes: MappingType[]): MappingField {
    const firstType = mappingTypes[0] ?? FALLBACK_MAPPING_TYPES[0];
    return { field_name: "", field_type_id: firstType.id, default_value: "" };
}

// ── Inline field row ──────────────────────────────────────────────────────────
type FieldRowProps = {
    field: MappingField;
    mappingTypes: MappingType[];
    onChange: (updated: MappingField) => void;
    onDelete: () => void;
};

function FieldRow({ field, mappingTypes, onChange, onDelete }: FieldRowProps) {
    return (
        <tr className="border-b border-border last:border-0 hover:bg-primary/10">
            <td className="px-3 py-2">
                <input
                    className="w-full rounded border border-border bg-surface px-2 py-1 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
                    value={field.field_name}
                    onChange={(e) => onChange({ ...field, field_name: e.target.value })}
                    placeholder="nombre_del_campo"
                    required
                />
            </td>
            <td className="px-3 py-2">
                <select
                    className="w-full rounded border border-border bg-surface px-2 py-1 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
                    value={field.field_type_id}
                    onChange={(e) => onChange({ ...field, field_type_id: e.target.value })}
                >
                    {mappingTypes.map((t) => (
                        <option key={t.id} value={t.id}>
                            {t.type_name}
                        </option>
                    ))}
                </select>
            </td>
            <td className="px-3 py-2">
                <input
                    className="w-full rounded border border-border bg-surface px-2 py-1 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
                    value={field.default_value}
                    onChange={(e) => onChange({ ...field, default_value: e.target.value })}
                    placeholder="(opcional)"
                />
            </td>
            <td className="px-3 py-2 text-right">
                <button
                    type="button"
                    onClick={onDelete}
                    className="rounded border border-error/50 px-2 py-0.5 text-xs text-error hover:bg-error/10"
                >
                    Eliminar
                </button>
            </td>
        </tr>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function MappingsPage() {
    const { fields: remoteFields, mappingTypes, loading, typesUsingFallback, error: loadError, refetch } =
        useGlobalMapping();

    // Local editable copy
    const [localFields, setLocalFields] = useState<MappingField[] | null>(null);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState("");
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

    // Sync remote → local on first load (and on refetch)
    const fields = localFields ?? remoteFields;

    function handleChange(index: number, updated: MappingField) {
        const next = fields.map((f, i) => (i === index ? updated : f));
        setLocalFields(next);
        setSaveSuccess(false);
    }

    function handleAddField() {
        setLocalFields([...fields, blankField(mappingTypes)]);
        setSaveSuccess(false);
    }

    function handleConfirmDelete() {
        if (deleteIndex === null) return;
        setLocalFields(fields.filter((_, i) => i !== deleteIndex));
        setDeleteIndex(null);
        setSaveSuccess(false);
    }

    async function handleSave(e: FormEvent) {
        e.preventDefault();

        // Validate all field_name filled
        const invalid = fields.some((f) => !f.field_name.trim());
        if (invalid) {
            setSaveError("Todos los campos deben tener un nombre.");
            return;
        }

        setSaving(true);
        setSaveError("");
        setSaveSuccess(false);

        try {
            await setGlobalMapping(fields);
            setLocalFields(null); // reset to remote
            refetch();
            setSaveSuccess(true);
        } catch (err) {
            setSaveError((err as Error).message || "Error al guardar mapping");
        } finally {
            setSaving(false);
        }
    }

    const hasChanges =
        localFields !== null &&
        JSON.stringify(localFields) !== JSON.stringify(remoteFields);

    return (
        <main className="flex flex-col h-full overflow-hidden">
            {/* Top bar */}
            <div className="flex items-center justify-between border-b border-border bg-background px-6 py-4 shrink-0">
                <div>
                    <h1 className="text-xl font-semibold text-text-logo">Mapping global</h1>
                    <p className="text-xs text-muted">
                        Define la estructura de campos normalizada para todos los logs
                        {typesUsingFallback && (
                            <span className="ml-2 text-muted/60">
                                — tipos por defecto (<code className="font-mono">GET /mapping-types</code> no disponible)
                            </span>
                        )}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={handleAddField}
                        disabled={loading}
                        className="rounded border border-border px-3 py-1.5 text-sm text-muted hover:bg-primary/30 disabled:opacity-40"
                    >
                        + Añadir campo
                    </button>
                    <button
                        form="mapping-form"
                        type="submit"
                        disabled={saving || !hasChanges}
                        className="rounded bg-accent px-4 py-1.5 text-sm font-semibold text-white hover:bg-accent/80 disabled:opacity-40"
                    >
                        {saving ? "Guardando…" : "Guardar cambios"}
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
                {(loadError || saveError) && (
                    <p className="mb-4 rounded bg-error/20 px-3 py-2 text-sm text-error">
                        {loadError || saveError}
                    </p>
                )}
                {saveSuccess && (
                    <p className="mb-4 rounded bg-accent/20 px-3 py-2 text-sm text-accent">
                        Mapping guardado correctamente.
                    </p>
                )}

                {loading ? (
                    <LoadingState message="Cargando mapping…" />
                ) : (
                    <form id="mapping-form" onSubmit={handleSave}>
                        <div className="rounded-xl border border-border overflow-hidden">
                            {fields.length === 0 ? (
                                <p className="px-4 py-8 text-center text-sm text-muted">
                                    Sin campos definidos. Añade el primero con "+ Añadir campo".
                                </p>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead className="bg-secondary/50">
                                        <tr className="text-left">
                                            <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted">
                                                Campo
                                            </th>
                                            <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted">
                                                Tipo
                                            </th>
                                            <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted">
                                                Valor por defecto
                                            </th>
                                            <th className="px-3 py-2" />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {fields.map((field, idx) => (
                                            <FieldRow
                                                key={idx}
                                                field={field}
                                                mappingTypes={mappingTypes}
                                                onChange={(updated) => handleChange(idx, updated)}
                                                onDelete={() => setDeleteIndex(idx)}
                                            />
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </form>
                )}
            </div>

            <ConfirmModal
                open={deleteIndex !== null}
                title="Eliminar campo"
                message={
                    deleteIndex !== null
                        ? `¿Seguro que quieres eliminar el campo "${fields[deleteIndex]?.field_name || "(sin nombre)"}"?`
                        : ""
                }
                onConfirm={handleConfirmDelete}
                onCancel={() => setDeleteIndex(null)}
            />
        </main>
    );
}
