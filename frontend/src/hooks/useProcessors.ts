import { useEffect, useState } from "react";
import type { ProcessorDefinition } from "../types";
import { getProcessors } from "../services/api";

export type ProcessorsState = {
    processors: ProcessorDefinition[];
    loading: boolean;
    error: string;
};

export function useProcessors(): ProcessorsState {
    const [processors, setProcessors] = useState<ProcessorDefinition[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError("");

        getProcessors()
            .then((data) => {
                if (!cancelled) {
                    setProcessors(data);
                }
            })
            .catch((err: Error) => {
                if (!cancelled) {
                    setProcessors([]);
                    setError(err.message || "Error cargando procesadores");
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    return { processors, loading, error };
}
