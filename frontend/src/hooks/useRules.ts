import { useEffect, useState } from "react";
import { getRuleAlerts, getRuleDefinitions, getRules } from "../services/api";
import type { Rule, RuleAlert, RuleDefinition } from "../types";

type BaseState = {
    loading: boolean;
    error: string;
};

type RulesState = BaseState & {
    rules: Rule[];
    refetch: () => void;
};

type RuleDefinitionsState = BaseState & {
    definitions: RuleDefinition[];
};

type RuleAlertsState = BaseState & {
    alerts: RuleAlert[];
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
                if (!cancelled) setRules(data);
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

    return { rules, loading, error, refetch: () => setTick((value) => value + 1) };
}

export function useRuleDefinitions(): RuleDefinitionsState {
    const [definitions, setDefinitions] = useState<RuleDefinition[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError("");

        getRuleDefinitions()
            .then((data) => {
                if (!cancelled) setDefinitions(data);
            })
            .catch((err: Error) => {
                if (!cancelled) {
                    setDefinitions([]);
                    setError(err.message || "Error cargando tipos de regla");
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    return { definitions, loading, error };
}

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
                if (!cancelled) setAlerts(data);
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

    return { alerts, loading, error, refetch: () => setTick((value) => value + 1) };
}
