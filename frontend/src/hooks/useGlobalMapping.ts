import { useEffect, useState } from "react";
import type { MappingField, MappingType } from "../types";
import { getGlobalMapping, getMappingTypes } from "../services/api";

/**
 * Fallback field types used when GET /mapping-types is unavailable.
 * IDs use deterministic zero-padded UUIDs that the backend can recognise once types are seeded.
 */
export const FALLBACK_MAPPING_TYPES: MappingType[] = [
    { id: "00000000-0000-0000-0000-000000000001", type_name: "string" },
    { id: "00000000-0000-0000-0000-000000000002", type_name: "integer" },
    { id: "00000000-0000-0000-0000-000000000003", type_name: "decimal" },
    { id: "00000000-0000-0000-0000-000000000004", type_name: "boolean" },
    { id: "00000000-0000-0000-0000-000000000005", type_name: "date" },
    { id: "00000000-0000-0000-0000-000000000006", type_name: "ip" },
    { id: "00000000-0000-0000-0000-000000000007", type_name: "timestamp" },
];

export type GlobalMappingState = {
    fields: MappingField[];
    mappingTypes: MappingType[];
    loading: boolean;
    typesUsingFallback: boolean;
    error: string;
    refetch: () => void;
};

export function useGlobalMapping(): GlobalMappingState {
    const [fields, setFields] = useState<MappingField[]>([]);
    const [mappingTypes, setMappingTypes] = useState<MappingType[]>([]);
    const [loading, setLoading] = useState(true);
    const [typesUsingFallback, setTypesUsingFallback] = useState(false);
    const [error, setError] = useState("");
    const [tick, setTick] = useState(0);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError("");

        Promise.all([
            getGlobalMapping(),
            getMappingTypes().catch(() => [] as MappingType[]),
        ])
            .then(([fetchedFields, fetchedTypes]) => {
                if (!cancelled) {
                    setFields(fetchedFields);
                    if (fetchedTypes.length > 0) {
                        setMappingTypes(fetchedTypes);
                        setTypesUsingFallback(false);
                    } else {
                        setMappingTypes(FALLBACK_MAPPING_TYPES);
                        setTypesUsingFallback(true);
                    }
                }
            })
            .catch((err: Error) => {
                if (!cancelled) {
                    setError(err.message || "Error cargando mapping");
                    setMappingTypes(FALLBACK_MAPPING_TYPES);
                    setTypesUsingFallback(true);
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
        fields,
        mappingTypes,
        loading,
        typesUsingFallback,
        error,
        refetch: () => setTick((n) => n + 1),
    };
}
