import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "../components/DataTable";
import LoadingState from "../components/LoadingState";
import { useGlobalMapping } from "../hooks/useGlobalMapping";

export default function MappingsPage() {
    const { fields, mappingTypes, loading, error, typesUsingFallback } =
        useGlobalMapping();
    const navigate = useNavigate();

    const typeLabels = useMemo(
        () =>
            new Map(
                mappingTypes.map((type) => [
                    type.id,
                    type.typename || type.displayname || type.id,
                ]),
            ),
        [mappingTypes],
    );

    const tableRows = fields.map((field) => [
        <span className='text-sm text-text'>{field.fieldname || "(sin nombre)"}</span>,
        <span className='text-xs text-muted'>
            {typeLabels.get(field.fieldtypeid) ?? field.fieldtypeid}
        </span>,
        <span className='text-xs text-muted'>{field.defaultvalue || "—"}</span>,
    ]);

    return (
        <main className='flex flex-col h-full overflow-hidden'>
            <div className='flex items-center justify-between border-b border-border bg-background px-6 py-4 shrink-0'>
                <div>
                    <h1 className='text-xl font-semibold text-text-logo'>
                        Mapping global
                    </h1>
                    <p className='text-xs text-muted'>
                        Campos normalizados para los logs
                        {typesUsingFallback && (
                            <span className='ml-2 text-muted/60'>
                                — tipos no disponibles en backend
                            </span>
                        )}
                    </p>
                </div>
                <button
                    onClick={() => navigate("/mapping/new")}
                    className='rounded bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/80'
                >
                    + Nuevo campo
                </button>
            </div>

            <div className='flex-1 overflow-y-auto p-6'>
                {error && (
                    <p className='mb-4 rounded bg-error/20 px-3 py-2 text-sm text-error'>
                        {error}
                    </p>
                )}

                {loading ? (
                    <LoadingState message='Cargando mapping…' />
                ) : (
                    <DataTable
                        headers={["Campo", "Tipo", "Valor por defecto"]}
                        rows={tableRows}
                        emptyMessage='Sin campos definidos'
                        onRowClick={(rowIndex) =>
                            navigate(`/mapping/${rowIndex}/edit`)
                        }
                    />
                )}
            </div>
        </main>
    );
}
