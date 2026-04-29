import { useEffect, useState } from "react";
import type { Pipeline } from "../types";
import { getPipelines } from "../services/api";

export type PipelinesState = {
    pipelines: Pipeline[];
    loading: boolean;
    error: string;
    refetch: () => void;
};

export function usePipelines(): PipelinesState {
    const [pipelines, setPipelines] = useState<Pipeline[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [tick, setTick] = useState(0);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);

        getPipelines()
            .then((data) => {
                if (!cancelled) {
                    setPipelines(data);
                    setError("");
                }
            })
            .catch((err: Error) => {
                if (!cancelled) {
                    setPipelines([]);
                    setError(err.message || "Error cargando pipelines");
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [tick]);

    return {
        pipelines,
        loading,
        error,
        refetch: () => setTick((n) => n + 1),
    };
}
