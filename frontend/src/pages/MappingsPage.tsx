import { type FormEvent, useState } from "react";
import { useMappings } from "../hooks/useMappings";
import { createMapping, deleteMapping, duplicateMapping } from "../services/api";
import type { FieldType, MappingField } from "../types";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import DataTable from "../components/DataTable";
import LoadingState from "../components/LoadingState";

const FIELD_TYPES: FieldType[] = ["string", "integer", "decimal", "boolean", "date", "ip"];

const EMPTY_FIELD: MappingField = { name: "", type: "string" };

export default function MappingsPage() {
    const { mappings, loading, error, refetch } = useMappings();

    const [name, setName] = useState("");
    const [fields, setFields] = useState<MappingField[]>([{ ...EMPTY_FIELD }]);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [submitSuccess, setSubmitSuccess] = useState("");

    function addField() {
        setFields((prev) => [...prev, { ...EMPTY_FIELD }]);
    }

    function removeField(index: number) {
        setFields((prev) => prev.filter((_, i) => i !== index));
    }

    function updateField(index: number, patch: Partial<MappingField>) {
        setFields((prev) =>
            prev.map((f, i) => (i === index ? { ...f, ...patch } : f)),
        );
    }

    async function handleCreate(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const validFields = fields.filter((f) => f.name.trim() !== "");
        if (validFields.length === 0) {
            setSubmitError("Añade al menos un campo con nombre.");
            return;
        }
        setSubmitError("");
        setSubmitSuccess("");
        setSubmitting(true);
        try {
            await createMapping({ name, fields: validFields });
            setSubmitSuccess("Mapping creado correctamente");
            setName("");
            setFields([{ ...EMPTY_FIELD }]);
            refetch();
        } catch (err) {
            setSubmitError((err as Error).message || "Error al crear mapping");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete(id: number, mappingName: string) {
        if (!confirm(`¿Eliminar mapping "${mappingName}"?`)) return;
        try {
            await deleteMapping(id);
            refetch();
        } catch (err) {
            setSubmitError((err as Error).message || "Error al eliminar mapping");
        }
    }

    async function handleDuplicate(id: number) {
        try {
            await duplicateMapping(id);
            refetch();
        } catch (err) {
            setSubmitError((err as Error).message || "Error al duplicar mapping");
        }
    }

    const tableRows = mappings.map((m) => [
        <span className="font-mono text-xs">{m.id}</span>,
        <span>{m.name}</span>,
        <div className="flex flex-wrap gap-1">
            {m.fields.map((f) => (
                <span
                    key={f.name}
                    className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs text-muted"
                >
                    {f.name}:{f.type}
                </span>
            ))}
        </div>,
        <span className="font-mono text-xs text-muted">{m.fields.length}</span>,
        <div className="flex gap-2">
            <button
                onClick={() => handleDuplicate(m.id)}
                className="rounded border border-border px-2 py-0.5 text-xs text-muted hover:bg-primary/50"
            >
                Duplicar
            </button>
            <button
                onClick={() => handleDelete(m.id, m.name)}
                className="rounded border border-rose-700 px-2 py-0.5 text-xs text-rose-400 hover:bg-rose-900/30"
            >
                Eliminar
            </button>
        </div>,
    ]);

    return (
        <div className="mx-auto max-w-7xl space-y-6 p-6">
            <PageHeader
                title="Mappings"
                subtitle="Define la estructura de campos de tus fuentes de logs."
                error={submitError}
                success={submitSuccess}
            />

            {/* Create form */}
            <SectionCard>
                <h2 className="mb-4 text-lg font-semibold text-text">Nuevo mapping</h2>
                <form onSubmit={handleCreate} className="space-y-4">
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
                                className="rounded border border-border px-2 py-0.5 text-xs text-muted hover:bg-primary/50"
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
                                                className="border-b border-border p-2 text-left text-xs font-semibold text-white"
                                            >
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {fields.map((field, idx) => (
                                        <tr
                                            key={idx}
                                            className="odd:bg-primary/30 even:bg-primary/20"
                                        >
                                            <td className="border-b border-border p-2">
                                                <input
                                                    className="w-full rounded border border-border bg-surface px-2 py-1 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
                                                    value={field.name}
                                                    onChange={(e) =>
                                                        updateField(idx, { name: e.target.value })
                                                    }
                                                    placeholder="nombre_campo"
                                                />
                                            </td>
                                            <td className="border-b border-border p-2">
                                                <select
                                                    className="w-full rounded border border-border bg-surface px-2 py-1 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
                                                    value={field.type}
                                                    onChange={(e) =>
                                                        updateField(idx, {
                                                            type: e.target.value as FieldType,
                                                        })
                                                    }
                                                >
                                                    {FIELD_TYPES.map((t) => (
                                                        <option key={t} value={t}>
                                                            {t}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="border-b border-border p-2">
                                                <button
                                                    type="button"
                                                    onClick={() => removeField(idx)}
                                                    disabled={fields.length === 1}
                                                    className="rounded px-2 py-0.5 text-xs text-rose-400 hover:bg-rose-900/30 disabled:opacity-30"
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

                    <button
                        type="submit"
                        disabled={submitting}
                        className="rounded bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/80 disabled:opacity-50"
                    >
                        {submitting ? "Creando…" : "Crear mapping"}
                    </button>
                </form>
            </SectionCard>

            {/* Mappings list */}
            <SectionCard>
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-text">
                        Mappings{" "}
                        <span className="ml-1 rounded bg-secondary px-2 py-0.5 text-sm font-normal text-muted">
                            {mappings.length}
                        </span>
                    </h2>
                </div>

                {loading ? (
                    <LoadingState message="Cargando mappings…" />
                ) : (
                    <DataTable
                        headers={["ID", "Nombre", "Campos", "Nº campos", "Acciones"]}
                        rows={tableRows}
                        emptyMessage="No hay mappings configurados"
                    />
                )}

                {error && (
                    <p className="mt-4 rounded bg-rose-900/40 px-3 py-2 text-sm text-rose-200">
                        {error}
                    </p>
                )}
            </SectionCard>
        </div>
    );
}
