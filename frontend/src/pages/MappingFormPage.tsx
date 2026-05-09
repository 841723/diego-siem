import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

    const isCreate = id === undefined;
    const decodedId = decodeURIComponent(id ?? "");
    const index = useMemo(() => {
        if (isCreate) return -1;
        if (decodedId.startsWith("field-")) {
            const parsed = Number(decodedId.slice("field-".length));
            return Number.isNaN(parsed) ? -1 : parsed;
        }
        return fields.findIndex((field) => field.fieldname === decodedId);
    }, [decodedId, fields, isCreate]);

    const effectiveTypes = mappingTypes.length
        ? mappingTypes
        : FALLBACK_MAPPING_TYPES;
    const defaultTypeId = effectiveTypes[0]?.id ?? "";

    useEffect(() => {
        if (isCreate) {
            setDraft(createBlankField(defaultTypeId));
            return;
        }
        if (index < 0 || index >= fields.length) {
            setDraft(null);
            return;
        }
        setDraft({ ...fields[index] });
    }, [defaultTypeId, fields, index, isCreate]);

    const typeOptions = useMemo(
        () =>
            effectiveTypes.map((type) => ({
                id: type.id,
                label: type.typename || type.displayname || type.id,
            })),
        [effectiveTypes],
    );

    function closeDrawer() {
        navigate("/mapping");
    }

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
            if (isCreate) next.push(draft);
            else next[index] = draft;
            await setGlobalMapping(next);
            refetch();
            closeDrawer();
        } catch (err) {
            setError((err as Error).message || "Error guardando el mapping");
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) return <LoadingState message='Cargando mapping…' />;

    return (
        <div className='fixed inset-0 z-50'>
            <div
                className='absolute inset-0 bg-black/40'
                onClick={closeDrawer}
                aria-hidden='true'
            />
            <aside
                className='absolute right-0 top-0 h-full w-full max-w-xl border-l border-border bg-background shadow-2xl'
                role='dialog'
                aria-modal='true'
                aria-label='Editar mapping'
            >
                <div className='flex h-full flex-col'>
                    <div className='flex items-center justify-between border-b border-border px-6 py-4'>
                        <h1 className='text-xl font-semibold text-text-logo'>
                            {isCreate ? "Nuevo campo" : "Editar campo"}
                        </h1>
                        <button
                            type='button'
                            onClick={closeDrawer}
                            className='rounded border border-border px-3 py-1.5 text-sm text-muted hover:bg-primary/30'
                        >
                            Cerrar
                        </button>
                    </div>

                    <div className='flex-1 overflow-y-auto p-6'>
                        {!isCreate && !draft ? (
                            <p className='rounded bg-error/20 px-3 py-2 text-sm text-error'>
                                Campo no encontrado.
                            </p>
                        ) : (
                            <form
                                id='mapping-form'
                                onSubmit={handleSubmit}
                                className='space-y-4'
                            >
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
                                                    ? {
                                                          ...prev,
                                                          fieldname:
                                                              event.target.value,
                                                      }
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
                                                    ? {
                                                          ...prev,
                                                          fieldtypeid:
                                                              event.target.value,
                                                      }
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
                                                    ? {
                                                          ...prev,
                                                          defaultvalue:
                                                              event.target.value,
                                                      }
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
                            </form>
                        )}
                    </div>

                    <div className='flex items-center justify-end gap-3 border-t border-border px-6 py-4'>
                        <button
                            type='button'
                            onClick={closeDrawer}
                            className='rounded border border-border px-5 py-2 text-sm text-muted hover:bg-primary/30'
                        >
                            Cancelar
                        </button>
                        <button
                            type='submit'
                            form='mapping-form'
                            disabled={submitting || (!isCreate && !draft)}
                            className='rounded bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent/80 disabled:opacity-50'
                        >
                            {submitting ? "Guardando…" : "Guardar cambios"}
                        </button>
                    </div>
                </div>
            </aside>
        </div>
    );
}
