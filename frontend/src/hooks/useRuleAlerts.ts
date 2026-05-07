import { useEffect, useState } from "react";
import { getRuleAlerts } from "../services/api";
import type { RuleAlert } from "../types";

export type RuleAlertsState = {
    alerts: RuleAlert[];
    loading: boolean;
    error: string;
    refetch: () => void;
};

export function useRuleAlerts(): RuleAlertsState {
    const [alerts, setAlerts] = useState<RuleAlert[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [tick, setTick] = useState(0);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError("");

        getRuleAlerts()
            .then((data) => {
                if (!cancelled) {
                    setAlerts(data);
                }
            })
            .catch((err: Error) => {
                if (!cancelled) {
                    setAlerts([]);
                    setError(err.message || "Error cargando alertas");
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
        alerts,
        loading,
        error,
        refetch: () => setTick((value) => value + 1),
    };
}
