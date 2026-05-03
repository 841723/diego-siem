import { useEffect, useState } from "react";
import type { ProcessorDefinition } from "../types";
import { getProcessors } from "../services/api";

/**
 * Hardcoded processor definitions used as fallback when GET /processors is unavailable.
 * When the backend implements the endpoint, these will be replaced by the API response.
 */
const FALLBACK_PROCESSORS: ProcessorDefinition[] = [
    {
        id: "set",
        name: "set",
        description: "Establece un valor en un campo",
        config: { field: "string", value: "string" },
    },
    {
        id: "drop",
        name: "drop",
        description: "Descarta el evento y detiene el pipeline",
        config: {},
    },
    {
        id: "copy",
        name: "copy",
        description: "Copia un campo a otro destino",
        config: { source_field: "string", destination_field: "string" },
    },
    {
        id: "call_pipeline",
        name: "call_pipeline",
        description: "Invoca otro pipeline por su ID",
        config: { pipeline_id: "string" },
    },
    {
        id: "rename",
        name: "rename",
        description: "Renombra un campo",
        config: { source_field: "string", destination_field: "string" },
    },
    {
        id: "lowercase",
        name: "lowercase",
        description: "Convierte el valor de un campo a minúsculas",
        config: { field: "string" },
    },
    {
        id: "uppercase",
        name: "uppercase",
        description: "Convierte el valor de un campo a mayúsculas",
        config: { field: "string" },
    },
];

export type ProcessorsState = {
    processors: ProcessorDefinition[];
    loading: boolean;
    usingFallback: boolean;
};

export function useProcessors(): ProcessorsState {
    const [processors, setProcessors] = useState<ProcessorDefinition[]>([]);
    const [loading, setLoading] = useState(true);
    const [usingFallback, setUsingFallback] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);

        getProcessors()
            .then((data) => {
                if (!cancelled) {
                    if (data.length > 0) {
                        setProcessors(data);
                        setUsingFallback(false);
                    } else {
                        setProcessors(FALLBACK_PROCESSORS);
                        setUsingFallback(true);
                    }
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setProcessors(FALLBACK_PROCESSORS);
                    setUsingFallback(true);
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    return { processors, loading, usingFallback };
}
