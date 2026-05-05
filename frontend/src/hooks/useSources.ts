import { useEffect, useState } from "react";
import type { SourceConfig } from "../types";
import { getSources } from "../services/api";

export type SourcesState = {
    sources: SourceConfig[];
    loading: boolean;
    error: string;
    refetch: () => void;
};

export function useSources(): SourcesState {
    const [sources, setSources] = useState<SourceConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [tick, setTick] = useState(0);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);

        getSources()
            .then((data) => {
                if (!cancelled) {
                    setSources(data);
                    setError("");
                }
            })
            .catch((err: Error) => {
                if (!cancelled) {
                    setSources([]);
                    setError(err.message || "Error cargando fuentes");
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
        sources,
        loading,
        error,
        refetch: () => setTick((n) => n + 1),
    };
}
