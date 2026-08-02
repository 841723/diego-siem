const TIMESTAMP_MS_THRESHOLD = 1_000_000_000_000;

export function toTimestampMs(value: number): number {
    return value > TIMESTAMP_MS_THRESHOLD ? value : value * 1000;
}

export function formatTimestamp(value: string): string {
    return new Date(value).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
}

export function formatCellValue(value: unknown): string {
    if (value === null || value === undefined) return "-";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
}
