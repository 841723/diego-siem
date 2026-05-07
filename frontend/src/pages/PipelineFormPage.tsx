import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import LoadingState from "../components/LoadingState";
import PipelineProcessorRow from "../components/PipelineProcessorRow";
import { usePipelineProcessors } from "../hooks/usePipelineProcessors";
import { useProcessors } from "../hooks/useProcessors";
import {
    createPipeline,
    createPipelineProcessor,
    getPipeline,
    updatePipeline,
    updatePipelineProcessor,
    deletePipelineProcessor,
} from "../services/api";
import type {
    DynamicSchema,
    Pipeline,
    PipelineProcessorDraft,
    ProcessorDefinition,
} from "../types";

type PrefillState = Partial<Pick<Pipeline, "name" | "description">> & {
    processors?: PipelineProcessorDraft[];
};

function defaultsFromSchema(schema: DynamicSchema): Record<string, unknown> {
    const output: Record<string, unknown> = {};
    for (const [key, descriptor] of Object.entries(schema)) {
        if (typeof descriptor === "object") {
            output[key] = defaultsFromSchema(descriptor);
            continue;
        }
        output[key] =
            descriptor === "number"
                ? 0
                : descriptor === "boolean"
                  ? false
                  : descriptor === "array"
                    ? []
                    : descriptor === "json"
                      ? {}
                      : "";
    }
    return output;
}

function normalizeDrafts(
    definitions: ProcessorDefinition[],
    drafts: PipelineProcessorDraft[],
): PipelineProcessorDraft[] {
    if (definitions.length === 0) return drafts;
    const known = new Set(definitions.map((definition) => definition.id));
    return drafts.map((draft) => {
        if (known.has(draft.type)) return draft;
        return { ...draft, type: definitions[0].id };
    });
}

export default function PipelineFormPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const isEdit = Boolean(id);
    const prefill = (location.state as PrefillState | null) ?? null;

    const {
        processors: definitions,
        loading: definitionsLoading,
        error: definitionsError,
    } = useProcessors();
    const {
        processors: remoteProcessors,
        loading: processorsLoading,
        error: processorsError,
    } = usePipelineProcessors(id);

    const [name, setName] = useState(prefill?.name ?? "");
    const [description, setDescription] = useState(prefill?.description ?? "");
    const [drafts, setDrafts] = useState<PipelineProcessorDraft[]>(
        prefill?.processors ?? [],
    );
    const [originalDrafts, setOriginalDrafts] = useState<PipelineProcessorDraft[]>([]);
    const [loadingItem, setLoadingItem] = useState(isEdit);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const canAddProcessor = !definitionsLoading && definitions.length > 0;

    const defaultDraft = useMemo<PipelineProcessorDraft | null>(() => {
        const first = definitions[0];
        if (!first) return null;
        return { type: first.id, config: defaultsFromSchema(first.schema) };
    }, [definitions]);

    useEffect(() => {
        if (!isEdit || !id) return;
        let cancelled = false;
        setLoadingItem(true);
        getPipeline(id)
            .then((pipeline) => {
                if (!cancelled) {
                    setName(pipeline.name);
                    setDescription(pipeline.description ?? "");
                }
            })
            .catch((err: Error) => {
                if (!cancelled) setError(err.message || "Error cargando pipeline");
            })
            .finally(() => {
                if (!cancelled) setLoadingItem(false);
            });
        return () => {
            cancelled = true;
        };
    }, [id, isEdit]);

    useEffect(() => {
        if (!isEdit) return;
        const mapped = remoteProcessors.map((processor) => ({
            id: processor.id,
            type: processor.type,
            config: processor.config,
        }));
        setOriginalDrafts(mapped);
        setDrafts((current) => (current.length > 0 ? current : mapped));
    }, [isEdit, remoteProcessors]);

    useEffect(() => {
        if (!definitionsLoading && defaultDraft && drafts.length === 0 && !isEdit) {
            setDrafts([defaultDraft]);
        }
    }, [defaultDraft, definitionsLoading, drafts.length, isEdit]);

    useEffect(() => {
        if (definitions.length === 0 || drafts.length === 0) return;
        setDrafts((current) => normalizeDrafts(definitions, current));
    }, [definitions, drafts.length]);

    function addProcessor() {
        if (!defaultDraft) return;
        setDrafts((current) => [...current, { ...defaultDraft }]);
        setSuccess("");
    }

    function removeProcessor(index: number) {
        setDrafts((current) => current.filter((_, currentIndex) => currentIndex !== index));
        setSuccess("");
    }

    function moveProcessor(index: number, direction: -1 | 1) {
        setDrafts((current) => {
            const destination = index + direction;
            if (destination < 0 || destination >= current.length) return current;
            const next = [...current];
            const [selected] = next.splice(index, 1);
            next.splice(destination, 0, selected);
            return next;
        });
        setSuccess("");
    }

    function handleTypeChange(index: number, type: string) {
        const definition = definitions.find((item) => item.id === type);
        const nextConfig = definition ? defaultsFromSchema(definition.schema) : {};
        setDrafts((current) =>
            current.map((item, currentIndex) =>
                currentIndex === index ? { ...item, type, config: nextConfig } : item,
            ),
        );
        setSuccess("");
    }

    function handleConfigChange(index: number, config: Record<string, unknown>) {
        setDrafts((current) =>
            current.map((item, currentIndex) =>
                currentIndex === index ? { ...item, config } : item,
            ),
        );
        setSuccess("");
    }

    async function persistProcessors(pipelineId: string) {
        const originalById = new Map(
            originalDrafts
                .filter((item): item is PipelineProcessorDraft & { id: string } => Boolean(item.id))
                .map((item) => [item.id, item]),
        );
        const currentIds = new Set(
            drafts
                .map((item) => item.id)
                .filter((value): value is string => Boolean(value)),
        );

        await Promise.all(
            [...originalById.keys()]
                .filter((processorId) => !currentIds.has(processorId))
                .map((processorId) => deletePipelineProcessor(pipelineId, processorId)),
        );

        for (const [index, draft] of drafts.entries()) {
            const payload = {
                type: draft.type,
                processorid: draft.type,
                config: draft.config,
                position: index,
            };
            if (draft.id && originalById.has(draft.id)) {
                await updatePipelineProcessor(pipelineId, draft.id, payload);
                continue;
            }
            await createPipelineProcessor(pipelineId, payload);
        }
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setSuccess("");
        setSubmitting(true);

        try {
            if (!canAddProcessor && drafts.length > 0) {
                throw new Error("No se pudieron cargar definiciones de procesadores.");
            }

            let pipelineId = id;
            if (isEdit && id) {
                await updatePipeline(id, { name, description });
            } else {
                const created = await createPipeline({ name, description });
                pipelineId = created.id;
            }

            if (pipelineId) {
                await persistProcessors(pipelineId);
            }

            setSuccess("Pipeline guardado correctamente.");
            navigate("/pipelines");
        } catch (err) {
            setError((err as Error).message || "Error guardando pipeline");
        } finally {
            setSubmitting(false);
        }
    }

    if (loadingItem || (isEdit && processorsLoading)) {
        return <LoadingState message="Cargando pipeline…" />;
    }

    return (
        <main className="flex h-full flex-col overflow-hidden">
            <div className="flex shrink-0 items-center gap-4 border-b border-border bg-background px-6 py-4">
                <button
                    onClick={() => navigate("/pipelines")}
                    className="rounded border border-border px-3 py-1.5 text-sm text-muted hover:bg-primary/30"
                >
                    ← Volver
                </button>
                <h1 className="text-xl font-semibold text-text-logo">
                    {isEdit ? "Editar pipeline" : prefill ? "Duplicar pipeline" : "Nuevo pipeline"}
                </h1>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                <div className="mx-auto max-w-3xl">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                                Nombre
                            </label>
                            <input
                                className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent"
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                                Descripción
                            </label>
                            <textarea
                                className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent"
                                rows={2}
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="block text-xs font-semibold uppercase tracking-wider text-muted">
                                        Procesadores (flujo)
                                    </span>
                                    <p className="text-xs text-muted/80">
                                        Reordena con ↑/↓ para definir el flujo de transformación.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={addProcessor}
                                    disabled={!canAddProcessor || submitting}
                                    className="rounded border border-border px-2 py-0.5 text-xs text-muted hover:bg-primary/30 disabled:opacity-40"
                                >
                                    + Añadir procesador
                                </button>
                            </div>

                            {definitionsError ? (
                                <p className="rounded bg-error/20 px-3 py-2 text-sm text-error">
                                    {definitionsError}
                                </p>
                            ) : null}
                            {processorsError ? (
                                <p className="rounded bg-error/20 px-3 py-2 text-sm text-error">
                                    {processorsError}
                                </p>
                            ) : null}

                            {drafts.length === 0 ? (
                                <p className="rounded border border-border/70 p-3 text-sm text-muted">
                                    Sin procesadores. Usa “Añadir procesador”.
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {drafts.map((draft, index) => (
                                        <PipelineProcessorRow
                                            key={draft.id ?? `${draft.type}-${index}`}
                                            index={index}
                                            draft={draft}
                                            definitions={definitions}
                                            disabled={submitting}
                                            canMoveUp={index > 0}
                                            canMoveDown={index < drafts.length - 1}
                                            canRemove={drafts.length > 0}
                                            onMoveUp={() => moveProcessor(index, -1)}
                                            onMoveDown={() => moveProcessor(index, 1)}
                                            onRemove={() => removeProcessor(index)}
                                            onTypeChange={(type) => handleTypeChange(index, type)}
                                            onConfigChange={(config) =>
                                                handleConfigChange(index, config)
                                            }
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {error ? (
                            <p className="rounded bg-error/20 px-3 py-2 text-sm text-error">{error}</p>
                        ) : null}
                        {success ? (
                            <p className="rounded bg-accent/20 px-3 py-2 text-sm text-accent">{success}</p>
                        ) : null}

                        <div className="flex gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="rounded bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent/80 disabled:opacity-50"
                            >
                                {submitting ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear pipeline"}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate("/pipelines")}
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
