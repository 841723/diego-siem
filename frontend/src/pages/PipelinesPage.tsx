import { type FormEvent, useState } from "react";
import { usePipelines } from "../hooks/usePipelines";
import { createPipeline, deletePipeline, duplicatePipeline } from "../services/api";
import type { Processor, ProcessorType } from "../types";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import DataTable from "../components/DataTable";
import LoadingState from "../components/LoadingState";

const PROCESSOR_TYPES: ProcessorType[] = [
    "set",
    "drop",
    "copy",
    "call_pipeline",
    "rename",
    "lowercase",
    "uppercase",
];

const EMPTY_PROCESSOR: Processor = { type: "set", config: {} };

export default function PipelinesPage() {
    const { pipelines, loading, error, refetch } = usePipelines();

    const [name, setName] = useState("");
    const [processors, setProcessors] = useState<Processor[]>([{ ...EMPTY_PROCESSOR }]);
    const [configTexts, setConfigTexts] = useState<string[]>(["{}"]);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [submitSuccess, setSubmitSuccess] = useState("");

    function addProcessor() {
        setProcessors((prev) => [...prev, { ...EMPTY_PROCESSOR }]);
        setConfigTexts((prev) => [...prev, "{}"]);
    }

    function removeProcessor(index: number) {
        setProcessors((prev) => prev.filter((_, i) => i !== index));
        setConfigTexts((prev) => prev.filter((_, i) => i !== index));
    }

    function updateProcessorType(index: number, type: ProcessorType) {
        setProcessors((prev) =>
            prev.map((p, i) => (i === index ? { ...p, type } : p)),
        );
    }

    function updateConfigText(index: number, text: string) {
        setConfigTexts((prev) => prev.map((t, i) => (i === index ? text : t)));
    }

    async function handleCreate(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSubmitError("");
        setSubmitSuccess("");

        // Parse config JSON for each processor
        const parsedProcessors: Processor[] = [];
        for (let i = 0; i < processors.length; i++) {
            try {
                const config = JSON.parse(configTexts[i] || "{}") as Record<string, unknown>;
                parsedProcessors.push({ type: processors[i].type, config });
            } catch {
                setSubmitError(`El config del procesador ${i + 1} no es JSON válido.`);
                return;
            }
        }

        setSubmitting(true);
        try {
            await createPipeline({ name, processors: parsedProcessors });
            setSubmitSuccess("Pipeline creado correctamente");
            setName("");
            setProcessors([{ ...EMPTY_PROCESSOR }]);
            setConfigTexts(["{}"]);
            refetch();
        } catch (err) {
            setSubmitError((err as Error).message || "Error al crear pipeline");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete(id: number, pipelineName: string) {
        if (!confirm(`¿Eliminar pipeline "${pipelineName}"?`)) return;
        try {
            await deletePipeline(id);
            refetch();
        } catch (err) {
            setSubmitError((err as Error).message || "Error al eliminar pipeline");
        }
    }

    async function handleDuplicate(id: number) {
        try {
            await duplicatePipeline(id);
            refetch();
        } catch (err) {
            setSubmitError((err as Error).message || "Error al duplicar pipeline");
        }
    }

    const tableRows = pipelines.map((pl) => [
        <span className="font-mono text-xs">{pl.id}</span>,
        <span>{pl.name}</span>,
        <div className="flex flex-col gap-1">
            {pl.processors.map((proc, idx) => (
                <div key={idx} className="flex items-center gap-1">
                    <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs text-muted">
                        {idx + 1}. {proc.type}
                    </span>
                    {Object.keys(proc.config).length > 0 && (
                        <span className="font-mono text-xs text-muted">
                            {JSON.stringify(proc.config)}
                        </span>
                    )}
                </div>
            ))}
        </div>,
        <span className="font-mono text-xs text-muted">{pl.processors.length}</span>,
        <div className="flex gap-2">
            <button
                onClick={() => handleDuplicate(pl.id)}
                className="rounded border border-border px-2 py-0.5 text-xs text-muted hover:bg-primary/50"
            >
                Duplicar
            </button>
            <button
                onClick={() => handleDelete(pl.id, pl.name)}
                className="rounded border border-rose-700 px-2 py-0.5 text-xs text-rose-400 hover:bg-rose-900/30"
            >
                Eliminar
            </button>
        </div>,
    ]);

    return (
        <div className="mx-auto max-w-7xl space-y-6 p-6">
            <PageHeader
                title="Pipelines"
                subtitle="Define cadenas de procesadores para transformar logs entrantes."
                error={submitError}
                success={submitSuccess}
            />

            {/* Create form */}
            <SectionCard>
                <h2 className="mb-4 text-lg font-semibold text-text">Nuevo pipeline</h2>
                <form onSubmit={handleCreate} className="space-y-4">
                    <div className="space-y-1">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                            Nombre
                        </label>
                        <input
                            className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="ej. syslog-normalize"
                            required
                        />
                    </div>

                    {/* Processors editor */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                                Procesadores (en orden)
                            </label>
                            <button
                                type="button"
                                onClick={addProcessor}
                                className="rounded border border-border px-2 py-0.5 text-xs text-muted hover:bg-primary/50"
                            >
                                + Añadir procesador
                            </button>
                        </div>

                        <div className="space-y-2">
                            {processors.map((proc, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-start gap-3 rounded border border-border bg-surface p-3"
                                >
                                    <span className="mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary font-mono text-xs text-muted">
                                        {idx + 1}
                                    </span>

                                    <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                                        <div className="space-y-1 sm:w-40">
                                            <label className="block text-xs text-muted">
                                                Tipo
                                            </label>
                                            <select
                                                className="w-full rounded border border-border bg-surface px-2 py-1 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
                                                value={proc.type}
                                                onChange={(e) =>
                                                    updateProcessorType(
                                                        idx,
                                                        e.target.value as ProcessorType,
                                                    )
                                                }
                                            >
                                                {PROCESSOR_TYPES.map((t) => (
                                                    <option key={t} value={t}>
                                                        {t}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="flex-1 space-y-1">
                                            <label className="block text-xs text-muted">
                                                Config (JSON)
                                            </label>
                                            <textarea
                                                className="h-16 w-full rounded border border-border bg-surface px-2 py-1 font-mono text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
                                                value={configTexts[idx]}
                                                onChange={(e) =>
                                                    updateConfigText(idx, e.target.value)
                                                }
                                                placeholder='{"field": "host", "value": "unknown"}'
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => removeProcessor(idx)}
                                        disabled={processors.length === 1}
                                        className="mt-1 rounded px-2 py-0.5 text-xs text-rose-400 hover:bg-rose-900/30 disabled:opacity-30"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="rounded bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/80 disabled:opacity-50"
                    >
                        {submitting ? "Creando…" : "Crear pipeline"}
                    </button>
                </form>
            </SectionCard>

            {/* Pipelines list */}
            <SectionCard>
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-text">
                        Pipelines{" "}
                        <span className="ml-1 rounded bg-secondary px-2 py-0.5 text-sm font-normal text-muted">
                            {pipelines.length}
                        </span>
                    </h2>
                </div>

                {loading ? (
                    <LoadingState message="Cargando pipelines…" />
                ) : (
                    <DataTable
                        headers={["ID", "Nombre", "Procesadores", "Nº proc.", "Acciones"]}
                        rows={tableRows}
                        emptyMessage="No hay pipelines configurados"
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
