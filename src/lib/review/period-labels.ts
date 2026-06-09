import type { PeriodPreset } from "./types";

export const PERIOD_PRESET_LABELS: Record<PeriodPreset, string> = {
  day: "一天",
  week: "一周",
  month: "一月",
  quarter: "季度",
  half_year: "半年",
  year: "一年",
  custom: "自定义",
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function formatPeriodDot(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${d.getMonth() + 1}.${pad2(d.getDate())}`;
}

export function formatReviewPeriodTitle(
  preset: PeriodPreset,
  start: Date,
  end: Date
): string {
  const label = PERIOD_PRESET_LABELS[preset];
  const a = formatPeriodDot(start.toISOString());
  const b = formatPeriodDot(end.toISOString());
  return `${label}复盘(${a}~${b})`;
}
