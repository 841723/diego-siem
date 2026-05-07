import { useEffect, useState } from "react";
import { getPipelineProcessors } from "../services/api";
import type { PipelineProcessor } from "../types";

type PipelineProcessorsState = {
    processors: PipelineProcessor[];
    loading: boolean;
    error: string;
    refetch: () => void;
};

export function usePipelineProcessors(
    pipelineId: string | undefined,
): PipelineProcessorsState {
    const [processors, setProcessors] = useState<PipelineProcessor[]>([]);
    const [loading, setLoading] = useState(Boolean(pipelineId));
    const [error, setError] = useState("");
    const [tick, setTick] = useState(0);

    useEffect(() => {
        if (!pipelineId) {
            setProcessors([]);
            setLoading(false);
            setError("");
            return;
        }
        let cancelled = false;
        setLoading(true);
        setError("");

        getPipelineProcessors(pipelineId)
            .then((data) => {
                if (!cancelled) setProcessors(data);
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
    }, [pipelineId, tick]);

    return {
        processors,
        loading,
        error,
        refetch: () => setTick((value) => value + 1),
    };
}
