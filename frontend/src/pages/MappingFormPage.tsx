import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ConfirmModal from "../components/ConfirmModal";
import LoadingState from "../components/LoadingState";
import {
    FALLBACK_MAPPING_TYPES,
    useGlobalMapping,
} from "../hooks/useGlobalMapping";
import { setGlobalMapping } from "../services/api";
import type { MappingField } from "../types";

function createBlankField(typeId: string): MappingField {
    return { fieldname: "", fieldtypeid: typeId, defaultvalue: "" };
}

export default function MappingFormPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const {
        fields,
        mappingTypes,
        loading,
        error: loadError,
        refetch,
    } = useGlobalMapping();

    const [draft, setDraft] = useState<MappingField | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [confirmDelete, setConfirmDelete] = useState(false);

    const isCreate = id === undefined;
    const index = Number(id ?? "-1");

    const effectiveTypes = mappingTypes.length
        ? mappingTypes
        : FALLBACK_MAPPING_TYPES;
    const defaultTypeId = effectiveTypes[0]?.id ?? "";

    useEffect(() => {
        if (isCreate) {
            setDraft(createBlankField(defaultTypeId));
            return;
        }
        if (Number.isNaN(index) || index < 0 || index >= fields.length) {
            setDraft(null);
            return;
        }
        setDraft(fields[index]);
    }, [defaultTypeId, fields, index, isCreate]);

    const typeOptions = useMemo(
        () =>
            effectiveTypes.map((type) => ({
                id: type.id,
                label: type.typename || type.displayname || type.id,
            })),
        [effectiveTypes],
    );

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!draft) return;
        if (!draft.fieldname.trim()) {
            setError("El campo nombre es obligatorio.");
            return;
        }

        setSubmitting(true);
        setError("");
        try {
            const next = [...fields];
            if (isCreate) {
                next.push(draft);
            } else {
                next[index] = draft;
            }
            await setGlobalMapping(next);
            refetch();
            navigate("/mapping");
        } catch (err) {
            setError((err as Error).message || "Error guardando el mapping");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete() {
        if (isCreate || Number.isNaN(index) || index < 0 || index >= fields.length) {
            return;
        }
        setSubmitting(true);
        try {
            const next = fields.filter((_, fieldIndex) => fieldIndex !== index);
            await setGlobalMapping(next);
            refetch();
            navigate("/mapping");
        } catch (err) {
            setError((err as Error).message || "Error eliminando el campo");
            setSubmitting(false);
            setConfirmDelete(false);
        }
    }

    if (loading) return <LoadingState message='Cargando mapping…' />;

    if (!isCreate && !draft) {
        return (
            <main className='p-6'>
                <p className='rounded bg-error/20 px-3 py-2 text-sm text-error'>
                    Campo no encontrado.
                </p>
            </main>
        );
    }

    return (
        <main className='flex flex-col h-full overflow-hidden'>
            <div className='flex items-center justify-between gap-4 border-b border-border bg-background px-6 py-4 shrink-0'>
                <div className='flex items-center gap-4'>
                    <button
                        onClick={() => navigate("/mapping")}
                        className='rounded border border-border px-3 py-1.5 text-sm text-muted hover:bg-primary/30'
                    >
                        ← Volver
                    </button>
                    <h1 className='text-xl font-semibold text-text-logo'>
                        {isCreate ? "Nuevo campo" : "Editar campo"}
                    </h1>
                </div>
                {!isCreate && (
                    <button
                        onClick={() => setConfirmDelete(true)}
                        className='rounded border border-error/50 px-3 py-1.5 text-sm text-error hover:bg-error/10'
                    >
                        Eliminar
                    </button>
                )}
            </div>

            <div className='flex-1 overflow-y-auto p-6'>
                <div className='mx-auto max-w-lg'>
                    <form onSubmit={handleSubmit} className='space-y-4'>
                        <div className='space-y-1'>
                            <label className='block text-xs font-semibold uppercase tracking-wider text-muted'>
                                Campo
                            </label>
                            <input
                                className='w-full rounded border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent'
                                value={draft?.fieldname ?? ""}
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
                                value={draft?.fieldtypeid ?? defaultTypeId}
                                onChange={(event) =>
                                    setDraft((prev) =>
                                        prev
                                            ? { ...prev, fieldtypeid: event.target.value }
                                            : prev,
                                    )
                                }
                            >
                                {typeOptions.map((option) => (
                                    <option key={option.id} value={option.id}>
                                        {option.label}
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
                                value={draft?.defaultvalue ?? ""}
                                onChange={(event) =>
                                    setDraft((prev) =>
                                        prev
                                            ? { ...prev, defaultvalue: event.target.value }
                                            : prev,
                                    )
                                }
                            />
                        </div>

                        {(loadError || error) && (
                            <p className='rounded bg-error/20 px-3 py-2 text-sm text-error'>
                                {loadError || error}
                            </p>
                        )}

                        <div className='flex gap-3 pt-2'>
                            <button
                                type='submit'
                                disabled={submitting}
                                className='rounded bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent/80 disabled:opacity-50'
                            >
                                {submitting ? "Guardando…" : "Guardar cambios"}
                            </button>
                            <button
                                type='button'
                                onClick={() => navigate("/mapping")}
                                className='rounded border border-border px-5 py-2 text-sm text-muted hover:bg-primary/30'
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <ConfirmModal
                open={confirmDelete}
                title='Eliminar campo'
                message='¿Seguro que quieres eliminar este campo del mapping?'
                onConfirm={handleDelete}
                onCancel={() => setConfirmDelete(false)}
            />
        </main>
    );
}
