import type { TimeWindow } from "../../types";

export const FIXED_PAGE_SIZE = 100;
export const MAX_LOG_PAGES = 5;
export const PAGE_SIZE_OPTIONS = [FIXED_PAGE_SIZE] as const;
export const DEFAULT_COLUMNS = ["timestamp", "sourceid", "numseq"];
export const DEFAULT_FROM = "now-1h";
export const DEFAULT_TO = "now";
export const DEFAULT_SORT = "timestamp:desc";

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export const TIME_WINDOWS: TimeWindow[] = [
    { label: "Último minuto", value: "now:::now-1m", ms: MINUTE_MS },
    { label: "Últimos 15 minutos", value: "now:::now-15m", ms: 15 * MINUTE_MS },
    { label: "Última hora", value: "now:::now-1h", ms: HOUR_MS },
    { label: "Últimas 6 horas", value: "now:::now-6h", ms: 6 * HOUR_MS },
    { label: "Últimas 24 horas", value: "now:::now-24h", ms: DAY_MS },
    { label: "Últimos 7 días", value: "now:::now-7d", ms: 7 * DAY_MS },
    { label: "Todo", value: "all", ms: null },
];
