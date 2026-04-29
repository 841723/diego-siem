import { useEffect, useState } from "react";
import type { Mapping } from "../types";
import { getMappings } from "../services/api";

export type MappingsState = {
    mappings: Mapping[];
    loading: boolean;
    error: string;
    refetch: () => void;
};

export function useMappings(): MappingsState {
    const [mappings, setMappings] = useState<Mapping[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [tick, setTick] = useState(0);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);

        getMappings()
            .then((data) => {
                if (!cancelled) {
                    setMappings(data);
                    setError("");
                }
            })
            .catch((err: Error) => {
                if (!cancelled) {
                    setMappings([]);
                    setError(err.message || "Error cargando mappings");
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
        mappings,
        loading,
        error,
        refetch: () => setTick((n) => n + 1),
    };
}
