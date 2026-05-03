import { type FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { createSource, getSource, updateSource } from "../services/api";
import type { SourceConfig } from "../types";
import LoadingState from "../components/LoadingState";

type FormState = Omit<SourceConfig, "id">;

const DEFAULT_FORM: FormState = {
    name: "",
    port: 9001,
    protocol: "udp",
    parser: "syslog",
    pipelineid: "0",
};

export default function SourceFormPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    const isEdit = Boolean(id);
    const prefill = location.state as Partial<FormState> | null;

    const [form, setForm] = useState<FormState>({ ...DEFAULT_FORM, ...prefill });
    const [loadingItem, setLoadingItem] = useState(isEdit);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!isEdit || !id) return;
        let cancelled = false;
        setLoadingItem(true);
        getSource(id)
            .then((src) => {
                if (!cancelled) {
                    const { id: _id, ...rest } = src;
                    setForm(rest);
                }
            })
            .catch((err: Error) => {
                if (!cancelled) setError(err.message || "Error cargando fuente");
            })
            .finally(() => {
                if (!cancelled) setLoadingItem(false);
            });
        return () => { cancelled = true; };
    }, [id, isEdit]);

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");
        setSubmitting(true);
        try {
            if (isEdit && id) {
                await updateSource(id, form);
            } else {
                await createSource(form);
            }
            navigate("/sources");
        } catch (err) {
            setError((err as Error).message || "Error al guardar fuente");
        } finally {
            setSubmitting(false);
        }
    }

    if (loadingItem) return <LoadingState message="Cargando fuente…" />;

    return (
        <main className="flex flex-col h-full overflow-hidden">
            {/* Top bar */}
            <div className="flex items-center gap-4 border-b border-border bg-background px-6 py-4 shrink-0">
                <button
                    onClick={() => navigate("/sources")}
                    className="rounded border border-border px-3 py-1.5 text-sm text-muted hover:bg-primary/30"
                >
                    ← Volver
                </button>
                <h1 className="text-xl font-semibold text-text-logo">
                    {isEdit ? "Editar fuente" : prefill ? "Duplicar fuente" : "Nueva fuente"}
                </h1>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="mx-auto max-w-lg">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                                Nombre
                            </label>
                            <input
                                className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent"
                                value={form.name}
                                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                placeholder="ej. firewall-norte"
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                                Puerto UDP
                            </label>
                            <input
                                type="number"
                                min={1}
                                max={65535}
                                className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent"
                                value={form.port}
                                onChange={(e) => setForm((f) => ({ ...f, port: Number(e.target.value) }))}
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                                Protocolo
                            </label>
                            <input
                                className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent"
                                value={form.protocol}
                                onChange={(e) => setForm((f) => ({ ...f, protocol: e.target.value }))}
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                                Parser
                            </label>
                            <input
                                className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent"
                                value={form.parser}
                                onChange={(e) => setForm((f) => ({ ...f, parser: e.target.value }))}
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                                Pipeline ID
                            </label>
                            <input
                                type="number"
                                min={0}
                                className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent"
                                value={form.pipelineid}
                                onChange={(e) => setForm((f) => ({ ...f, pipelineid: String(e.target.value) }))}
                            />
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
                                {submitting ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear fuente"}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate("/sources")}
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
