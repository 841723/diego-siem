import { useMemo, useState } from "react";
import ConfirmModal from "../components/ConfirmModal";
import DataTable from "../components/DataTable";
import Drawer from "../components/Drawer";
import LoadingState from "../components/LoadingState";
import {
    FALLBACK_MAPPING_TYPES,
    useGlobalMapping,
} from "../hooks/useGlobalMapping";
import { setGlobalMapping } from "../services/api";
import type { MappingField } from "../types";

function blankField(typeId: string): MappingField {
    return { fieldname: "", fieldtypeid: typeId, defaultvalue: "" };
}

export default function MappingsPage() {
    const {
        fields: remoteFields,
        mappingTypes,
        loading,
        typesUsingFallback,
        error: loadError,
        refetch,
    } = useGlobalMapping();

    const [localFields, setLocalFields] = useState<MappingField[] | null>(null);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState("");
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerIndex, setDrawerIndex] = useState<number | null>(null);
    const [draft, setDraft] = useState<MappingField | null>(null);
    const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

    const effectiveTypes = mappingTypes.length
        ? mappingTypes
        : FALLBACK_MAPPING_TYPES;
    const defaultTypeId = effectiveTypes[0]?.id ?? "";
    const fields = localFields ?? remoteFields;

    const hasChanges =
        localFields !== null &&
        JSON.stringify(localFields) !== JSON.stringify(remoteFields);

    const tableRows = useMemo(
        () =>
            fields.map((field, index) => [
                <button
                    onClick={() => {
                        setDrawerIndex(index);
                        setDraft({ ...field });
                        setDrawerOpen(true);
                    }}
                    className='text-left text-sm text-text hover:underline'
                >
                    {field.fieldname || "(sin nombre)"}
                </button>,
                <span className='text-xs text-muted'>{field.fieldtypeid}</span>,
                <span className='text-xs text-muted'>{field.defaultvalue || "—"}</span>,
                <div className='flex gap-1.5'>
                    <button
                        onClick={() => {
                            setDrawerIndex(index);
                            setDraft({ ...field });
                            setDrawerOpen(true);
                        }}
                        className='rounded border border-border px-2 py-0.5 text-xs text-muted hover:bg-primary/30'
                    >
                        Editar
                    </button>
                    <button
                        onClick={() => setDeleteIndex(index)}
                        className='rounded border border-error/50 px-2 py-0.5 text-xs text-error hover:bg-error/10'
                    >
                        Eliminar
                    </button>
                </div>,
            ]),
        [fields],
    );

    function openCreateDrawer() {
        setDrawerIndex(null);
        setDraft(blankField(defaultTypeId));
        setSaveError("");
        setDrawerOpen(true);
    }

    function upsertLocalFields(nextFields: MappingField[]) {
        setLocalFields(nextFields);
        setSaveSuccess(false);
    }

    function saveDraft() {
        if (!draft) return;
        if (!draft.fieldname.trim()) {
            setSaveError("Todos los campos deben tener un nombre.");
            return;
        }

        if (drawerIndex === null) {
            upsertLocalFields([...fields, draft]);
        } else {
            upsertLocalFields(
                fields.map((field, index) => (index === drawerIndex ? draft : field)),
            );
        }
        setDrawerOpen(false);
    }

    function confirmDelete() {
        if (deleteIndex === null) return;
        upsertLocalFields(fields.filter((_, index) => index !== deleteIndex));
        setDeleteIndex(null);
    }

    async function saveMapping() {
        const invalid = fields.some((field) => !field.fieldname.trim());
        if (invalid) {
            setSaveError("Todos los campos deben tener un nombre.");
            return;
        }

        setSaving(true);
        setSaveError("");
        setSaveSuccess(false);
        try {
            await setGlobalMapping(fields);
            setLocalFields(null);
            refetch();
            setSaveSuccess(true);
        } catch (err) {
            setSaveError((err as Error).message || "Error al guardar mapping");
        } finally {
            setSaving(false);
        }
    }

    return (
        <main className='flex flex-col h-full overflow-hidden'>
            <div className='flex items-center justify-between border-b border-border bg-background px-6 py-4 shrink-0'>
                <div>
                    <h1 className='text-xl font-semibold text-text-logo'>
                        Mapping global
                    </h1>
                    <p className='text-xs text-muted'>
                        Gestiona campos y tipos del mapping
                        {typesUsingFallback && (
                            <span className='ml-2 text-muted/60'>
                                — tipos por defecto (GET /mappings/types no
                                disponible)
                            </span>
                        )}
                    </p>
                </div>
                <div className='flex gap-2'>
                    <button
                        type='button'
                        onClick={openCreateDrawer}
                        disabled={loading}
                        className='rounded border border-border px-3 py-1.5 text-sm text-muted hover:bg-primary/30 disabled:opacity-40'
                    >
                        + Crear nuevo
                    </button>
                    <button
                        type='button'
                        onClick={saveMapping}
                        disabled={saving || !hasChanges}
                        className='rounded bg-accent px-4 py-1.5 text-sm font-semibold text-white hover:bg-accent/80 disabled:opacity-40'
                    >
                        {saving ? "Guardando…" : "Guardar cambios"}
                    </button>
                </div>
            </div>

            <div className='flex-1 overflow-y-auto p-6'>
                {(loadError || saveError) && (
                    <p className='mb-4 rounded bg-error/20 px-3 py-2 text-sm text-error'>
                        {loadError || saveError}
                    </p>
                )}
                {saveSuccess && (
                    <p className='mb-4 rounded bg-accent/20 px-3 py-2 text-sm text-accent'>
                        Mapping guardado correctamente.
                    </p>
                )}

                {loading ? (
                    <LoadingState message='Cargando mapping…' />
                ) : (
                    <DataTable
                        headers={["Campo", "Tipo", "Valor por defecto", "Acciones"]}
                        rows={tableRows}
                        emptyMessage='Sin campos definidos'
                    />
                )}
            </div>

            <Drawer
                open={drawerOpen}
                title={drawerIndex === null ? "Crear campo" : "Editar campo"}
                onClose={() => setDrawerOpen(false)}
                footer={
                    <div className='flex justify-end gap-3'>
                        <button
                            className='rounded border border-border px-4 py-2 text-sm text-muted hover:bg-primary/30'
                            onClick={() => setDrawerOpen(false)}
                        >
                            Cancelar
                        </button>
                        <button
                            className='rounded bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/80'
                            onClick={saveDraft}
                        >
                            Guardar
                        </button>
                    </div>
                }
            >
                {draft && (
                    <div className='space-y-4'>
                        <div className='space-y-1'>
                            <label className='block text-xs font-semibold uppercase tracking-wider text-muted'>
                                Campo
                            </label>
                            <input
                                className='w-full rounded border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent'
                                value={draft.fieldname}
                                onChange={(event) =>
                                    setDraft((prev) =>
                                        prev
                                            ? { ...prev, fieldname: event.target.value }
                                            : prev,
                                    )
                                }
                                required
                            />
                        </div>

                        <div className='space-y-1'>
                            <label className='block text-xs font-semibold uppercase tracking-wider text-muted'>
                                Tipo
                            </label>
                            <select
                                className='w-full rounded border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent'
                                value={draft.fieldtypeid}
                                onChange={(event) =>
                                    setDraft((prev) =>
                                        prev
                                            ? { ...prev, fieldtypeid: event.target.value }
                                            : prev,
                                    )
                                }
                            >
                                {effectiveTypes.map((type) => (
                                    <option key={type.id} value={type.id}>
                                        {type.displayname || type.typename || type.id}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className='space-y-1'>
                            <label className='block text-xs font-semibold uppercase tracking-wider text-muted'>
                                Valor por defecto
                            </label>
                            <input
                                className='w-full rounded border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent'
                                value={draft.defaultvalue}
                                onChange={(event) =>
                                    setDraft((prev) =>
                                        prev
                                            ? { ...prev, defaultvalue: event.target.value }
                                            : prev,
                                    )
                                }
                            />
                        </div>
                    </div>
                )}
            </Drawer>

            <ConfirmModal
                open={deleteIndex !== null}
                title='Eliminar campo'
                message={
                    deleteIndex !== null
                        ? `¿Seguro que quieres eliminar el campo "${fields[deleteIndex]?.fieldname || "(sin nombre)"}"?`
                        : ""
                }
                onConfirm={confirmDelete}
                onCancel={() => setDeleteIndex(null)}
            />
        </main>
    );
}
