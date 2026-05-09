import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "../components/DataTable";
import LoadingState from "../components/LoadingState";
import { usePipelines } from "../hooks/usePipelines";
import { useSources } from "../hooks/useSources";

export default function PipelinesPage() {
    const { pipelines, loading, error } = usePipelines();
    const { sources } = useSources();
    const navigate = useNavigate();

    const sortedPipelines = useMemo(
        () => [...pipelines].sort((a, b) => a.name.localeCompare(b.name)),
        [pipelines],
    );

    const sourceUsageByPipeline = useMemo(() => {
        const usage = new Map<string, number>();
        for (const source of sources) {
            usage.set(source.pipelineid, (usage.get(source.pipelineid) ?? 0) + 1);
        }
        return usage;
    }, [sources]);

    const tableRows = sortedPipelines.map((pipeline) => [
        <span className='text-sm text-text'>{pipeline.name}</span>,
        <span className='text-xs text-muted line-clamp-2'>
            {pipeline.description || "—"}
        </span>,
        <span className='text-xs text-muted'>
            Used by {sourceUsageByPipeline.get(pipeline.id) ?? 0} sources
        </span>,
    ]);

    return (
        <main className='flex flex-col h-full overflow-hidden'>
            <div className='flex items-center justify-between border-b border-border bg-background px-6 py-4 shrink-0'>
                <div>
                    <h1 className='text-xl font-semibold text-text-logo'>Pipelines</h1>
                    <p className='text-xs text-muted'>
                        Define cadenas de procesadores para transformar logs entrantes
                    </p>
                </div>
                <button
                    onClick={() => navigate("/pipelines/new")}
                    className='rounded bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/80'
                >
                    + Nuevo pipeline
                </button>
            </div>

            <div className='flex-1 overflow-y-auto p-6'>
                {error && (
                    <p className='mb-4 rounded bg-error/20 px-3 py-2 text-sm text-error'>
                        {error}
                    </p>
                )}

                {loading ? (
                    <LoadingState message='Cargando pipelines…' />
                ) : (
                    <DataTable
                        headers={["Nombre", "Descripción", "Uso"]}
                        rows={tableRows}
                        emptyMessage='No hay pipelines configurados'
                        onRowClick={(rowIndex) =>
                            navigate(`/pipelines/${sortedPipelines[rowIndex].id}/edit`)
                        }
                    />
                )}
            </div>
        </main>
    );
}
