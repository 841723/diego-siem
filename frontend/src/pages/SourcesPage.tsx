import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "../components/DataTable";
import LoadingState from "../components/LoadingState";
import { usePipelines } from "../hooks/usePipelines";
import { useSources } from "../hooks/useSources";

export default function SourcesPage() {
    const { sources, loading, error } = useSources();
    const { pipelines } = usePipelines();
    const navigate = useNavigate();

    const pipelineNames = useMemo(
        () =>
            new Map(pipelines.map((pipeline) => [pipeline.id, pipeline.name] as const)),
        [pipelines],
    );

    const sortedSources = useMemo(
        () => [...sources].sort((a, b) => a.name.localeCompare(b.name)),
        [sources],
    );

    const tableRows = sortedSources.map((source) => [
        <span className='text-sm text-muted'>{source.name}</span>,
        <span className='font-mono text-xs text-muted'>{source.port}</span>,
        <span className='text-xs text-muted'>{source.protocol}</span>,
        <span className='text-xs text-muted'>{source.parser}</span>,
        <span className='text-xs text-muted'>
            {pipelineNames.get(source.pipelineid) ?? "Pipeline desconocido"}
        </span>,
    ]);

    return (
        <main className='flex flex-col h-full overflow-hidden'>
            <div className='flex items-center justify-between border-b border-border bg-background px-6 py-4 shrink-0'>
                <div>
                    <h1 className='text-xl font-semibold text-text-logo'>Fuentes</h1>
                    <p className='text-xs text-muted'>
                        Gestiona las fuentes de logs del sistema
                    </p>
                </div>
                <button
                    onClick={() => navigate("/sources/new")}
                    className='rounded bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/80'
                >
                    + Nueva fuente
                </button>
            </div>

            <div className='flex-1 flex flex-col overflow-hidden p-6 h-full'>
                {error && (
                    <p className='mb-4 rounded bg-error/20 px-3 py-2 text-sm text-error'>
                        {error}
                    </p>
                )}

                {loading ? (
                    <LoadingState message='Cargando fuentes…' />
                ) : (
                    <DataTable
                        headers={[
                            "Nombre",
                            "Puerto",
                            "Protocolo",
                            "Parser",
                            "Pipeline",
                        ]}
                        rows={tableRows}
                        emptyMessage='No hay fuentes configuradas'
                        onRowClick={(rowIndex) =>
                            navigate(`/sources/${sortedSources[rowIndex].id}`)
                        }
                    />
                )}
            </div>
        </main>
    );
}
