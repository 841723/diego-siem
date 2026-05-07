import { useEffect, useState } from "react";
import { getRules } from "../services/api";
import type { Rule } from "../types";

export type RulesState = {
    rules: Rule[];
    loading: boolean;
    error: string;
    refetch: () => void;
};

export function useRules(): RulesState {
    const [rules, setRules] = useState<Rule[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [tick, setTick] = useState(0);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError("");

        getRules()
            .then((data) => {
                if (!cancelled) {
                    setRules(data);
                }
            })
            .catch((err: Error) => {
                if (!cancelled) {
                    setRules([]);
                    setError(err.message || "Error cargando reglas");
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
        rules,
        loading,
        error,
        refetch: () => setTick((value) => value + 1),
    };
}
