import { useCallback } from "react";

export type PipelineProcessorDraftItem = {
    localId: string;
    id?: string;
    processorid: string;
    config: Record<string, unknown>;
};

export type PipelineDraft = {
    name: string;
    description: string;
    processors: PipelineProcessorDraftItem[];
};

function buildStorageKey(scope: string): string {
    return `pipeline-draft:${scope}`;
}

export function usePipelineDraft(scope: string) {
    const storageKey = buildStorageKey(scope);

    const loadDraft = useCallback((): PipelineDraft | null => {
        try {
            const raw = sessionStorage.getItem(storageKey);
            if (!raw) return null;
            return JSON.parse(raw) as PipelineDraft;
        } catch {
            return null;
        }
    }, [storageKey]);

    const saveDraft = useCallback(
        (draft: PipelineDraft) => {
            sessionStorage.setItem(storageKey, JSON.stringify(draft));
        },
        [storageKey],
    );

    const clearDraft = useCallback(() => {
        sessionStorage.removeItem(storageKey);
    }, [storageKey]);

    return { loadDraft, saveDraft, clearDraft };
}
