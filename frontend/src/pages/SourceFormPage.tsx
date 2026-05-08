import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import LoadingState from "../components/LoadingState";
import { usePipelines } from "../hooks/usePipelines";
import { createSource, getSource, updateSource } from "../services/api";
import type { SourceConfig } from "../types";

type FormState = Omit<SourceConfig, "id">;

const DEFAULT_FORM: FormState = {
    name: "",
    port: 9001,
    protocol: "udp",
    parser: "syslog",
    pipelineid: "",
};

export default function SourceFormPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { pipelines } = usePipelines();
    const isEdit = Boolean(id);

    const prefill = (location.state as Partial<FormState> | null) ?? null;
    const [form, setForm] = useState<FormState>({ ...DEFAULT_FORM, ...prefill });
    const [loadingItem, setLoadingItem] = useState(isEdit);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const pipelineOptions = useMemo(
        () => [...pipelines].sort((a, b) => a.name.localeCompare(b.name)),
        [pipelines],
    );

    useEffect(() => {
        if (!isEdit || !id) return;
        let cancelled = false;
        setLoadingItem(true);
        getSource(id)
            .then((source) => {
                if (cancelled) return;
                const { id: _id, ...rest } = source;
                setForm(rest);
            })
            .catch((err: Error) => {
                if (!cancelled) {
                    setError(err.message || "Error cargando fuente");
                }
            })
            .finally(() => {
                if (!cancelled) setLoadingItem(false);
            });
        return () => {
            cancelled = true;
        };
    }, [id, isEdit]);

    useEffect(() => {
        if (pipelineOptions.length === 0) return;
        setForm((prev) =>
            prev.pipelineid
                ? prev
                : {
                      ...prev,
                      pipelineid: pipelineOptions[0].id,
                  },
        );
    }, [pipelineOptions]);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSubmitting(true);
        setError("");
        try {
            if (isEdit && id) {
                await updateSource(id, form);
                navigate(`/sources/${id}`);
            } else {
                await createSource(form);
                navigate("/sources");
            }
        } catch (err) {
            setError((err as Error).message || "Error guardando fuente");
        } finally {
            setSubmitting(false);
        }
    }

    if (loadingItem) return <LoadingState message='Cargando fuente…' />;

    return (
        <main className='flex flex-col h-full overflow-hidden'>
            <div className='flex items-center gap-4 border-b border-border bg-background px-6 py-4 shrink-0'>
                <button
                    onClick={() => navigate(isEdit && id ? `/sources/${id}` : "/sources")}
                    className='rounded border border-border px-3 py-1.5 text-sm text-muted hover:bg-primary/30'
                >
                    ← Volver
                </button>
                <h1 className='text-xl font-semibold text-text-logo'>
                    {isEdit ? "Editar fuente" : "Nueva fuente"}
                </h1>
            </div>

            <div className='flex-1 overflow-y-auto p-6'>
                <div className='mx-auto max-w-lg'>
                    <form onSubmit={handleSubmit} className='space-y-4'>
                        <div className='space-y-1'>
                            <label className='block text-xs font-semibold uppercase tracking-wider text-muted'>
                                Nombre
                            </label>
                            <input
                                className='w-full rounded border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent'
                                value={form.name}
                                onChange={(event) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        name: event.target.value,
                                    }))
                                }
                                required
                            />
                        </div>

                        <div className='space-y-1'>
                            <label className='block text-xs font-semibold uppercase tracking-wider text-muted'>
                                Puerto
                            </label>
                            <input
                                type='number'
                                min={1}
                                max={65535}
                                className='w-full rounded border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent'
                                value={form.port}
                                onChange={(event) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        port: Number(event.target.value),
                                    }))
                                }
                                required
                            />
                        </div>

                        <div className='space-y-1'>
                            <label className='block text-xs font-semibold uppercase tracking-wider text-muted'>
                                Protocolo
                            </label>
                            <input
                                className='w-full rounded border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent'
                                value={form.protocol}
                                onChange={(event) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        protocol: event.target.value,
                                    }))
                                }
                                required
                            />
                        </div>

                        <div className='space-y-1'>
                            <label className='block text-xs font-semibold uppercase tracking-wider text-muted'>
                                Parser
                            </label>
                            <input
                                className='w-full rounded border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent'
                                value={form.parser}
                                onChange={(event) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        parser: event.target.value,
                                    }))
                                }
                                required
                            />
                        </div>

                        <div className='space-y-1'>
                            <label className='block text-xs font-semibold uppercase tracking-wider text-muted'>
                                Pipeline
                            </label>
                            <select
                                className='w-full rounded border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent'
                                value={form.pipelineid}
                                onChange={(event) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        pipelineid: event.target.value,
                                    }))
                                }
                                required
                            >
                                {pipelineOptions.map((pipeline) => (
                                    <option key={pipeline.id} value={pipeline.id}>
                                        {pipeline.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {error && (
                            <p className='rounded bg-error/20 px-3 py-2 text-sm text-error'>
                                {error}
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
                                onClick={() =>
                                    navigate(isEdit && id ? `/sources/${id}` : "/sources")
                                }
                                className='rounded border border-border px-5 py-2 text-sm text-muted hover:bg-primary/30'
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
