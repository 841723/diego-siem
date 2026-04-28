import { type FormEvent, useState } from "react";
import { useSources } from "../hooks/useSources";
import { createSource, deleteSources } from "../services/api";
import type { SourceConfig } from "../types";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";

function nameToSlug(name: string): string {
    return name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export default function SourcesPage() {
    const { sources, loading, error, refetch } = useSources();

    const [name, setName] = useState("");
    const [port, setPort] = useState(9001);
    const [pipelineId, setPipelineId] = useState(0);
    const [submitError, setSubmitError] = useState("");
    const [submitSuccess, setSubmitSuccess] = useState("");
    const [submitting, setSubmitting] = useState(false);

    async function handleCreate(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSubmitError("");
        setSubmitSuccess("");
        setSubmitting(true);

        const source: Omit<SourceConfig, "id"> = {
            name,
            port,
            protocol: "udp",
            parser: "syslog",
            pipelineid: pipelineId,
        };

        try {
            await createSource(source);
            setSubmitSuccess("Fuente creada correctamente");
            setName("");
            setPort(9001);
            setPipelineId(0);
            refetch();
        } catch (err) {
            setSubmitError((err as Error).message || "Error al crear fuente");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleClearAll() {
        if (!confirm("¿Eliminar todas las fuentes?")) return;
        try {
            await deleteSources();
            refetch();
        } catch (err) {
            setSubmitError((err as Error).message || "Error al eliminar fuentes");
        }
    }

    const slugPreview = nameToSlug(name);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Fuentes</h1>
                <p className="mt-1 text-sm text-slate-400">
                    Gestiona las fuentes de logs del sistema.
                </p>
            </div>

            {/* Create form */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <h2 className="mb-4 text-lg font-semibold">Nueva fuente (syslog UDP)</h2>
                <form onSubmit={handleCreate} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-1">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Nombre
                            </label>
                            <input
                                className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="ej. firewall-norte"
                                required
                            />
                            {slugPreview && (
                                <p className="text-xs text-slate-500">
                                    Slug: <span className="text-slate-400">{slugPreview}</span>
                                </p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Puerto UDP
                            </label>
                            <input
                                type="number"
                                min={1}
                                max={65535}
                                className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                value={port}
                                onChange={(e) => setPort(Number(e.target.value))}
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Pipeline ID
                            </label>
                            <input
                                type="number"
                                min={0}
                                className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                value={pipelineId}
                                onChange={(e) => setPipelineId(Number(e.target.value))}
                            />
                        </div>
                    </div>

                    {submitError && (
                        <p className="rounded bg-rose-900/40 px-3 py-2 text-sm text-rose-200">
                            {submitError}
                        </p>
                    )}
                    {submitSuccess && (
                        <p className="rounded bg-emerald-900/40 px-3 py-2 text-sm text-emerald-200">
                            {submitSuccess}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="rounded bg-cyan-600 px-4 py-2 text-sm font-semibold hover:bg-cyan-500 disabled:opacity-50"
                    >
                        {submitting ? "Creando…" : "Crear fuente"}
                    </button>
                </form>
            </section>

            {/* Sources list */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">
                        Fuentes activas{" "}
                        <span className="ml-1 rounded bg-slate-800 px-2 py-0.5 text-sm font-normal text-slate-400">
                            {sources.length}
                        </span>
                    </h2>
                    {sources.length > 0 && (
                        <button
                            onClick={handleClearAll}
                            className="rounded border border-rose-700 px-3 py-1 text-sm text-rose-400 hover:bg-rose-900/30"
                        >
                            Eliminar todas
                        </button>
                    )}
                </div>

                {error && (
                    <p className="mb-4 rounded bg-rose-900/40 px-3 py-2 text-sm text-rose-200">
                        {error}
                    </p>
                )}

                {loading ? (
                    <LoadingState message="Cargando fuentes…" />
                ) : sources.length === 0 ? (
                    <EmptyState message="No hay fuentes configuradas" />
                ) : (
                    <div className="overflow-auto rounded border border-slate-800">
                        <table className="min-w-full border-collapse text-sm">
                            <thead className="bg-slate-800">
                                <tr>
                                    {["ID", "Nombre", "Puerto", "Protocolo", "Parser", "Pipeline ID"].map((h) => (
                                        <th
                                            key={h}
                                            className="border-b border-slate-700 p-2 text-left font-semibold text-slate-200"
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {sources.map((src) => (
                                    <tr
                                        key={src.id}
                                        className="odd:bg-slate-900 even:bg-slate-950 hover:bg-slate-800/60"
                                    >
                                        <td className="border-b border-slate-800 p-2 font-mono text-xs">{src.id}</td>
                                        <td className="border-b border-slate-800 p-2">{src.name}</td>
                                        <td className="border-b border-slate-800 p-2 font-mono text-xs">{src.port}</td>
                                        <td className="border-b border-slate-800 p-2 text-xs text-slate-400">{src.protocol}</td>
                                        <td className="border-b border-slate-800 p-2 text-xs text-slate-400">{src.parser}</td>
                                        <td className="border-b border-slate-800 p-2 font-mono text-xs">{src.pipelineid}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}
