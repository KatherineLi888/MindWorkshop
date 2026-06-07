import type { TimeRange, WidgetFilters } from "./dashboard-config";

function startOfWeek(d = new Date()) {
  const x = new Date(d);
  const day = x.getDay() || 7;
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - day + 1);
  return x;
}

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function parseDayStart(s: string): number {
  const iso = s.length === 10 ? `${s}T00:00:00` : s;
  return new Date(iso).getTime();
}

function parseDayEnd(s: string): number {
  const iso = s.length === 10 ? `${s}T23:59:59.999` : s;
  return new Date(iso).getTime();
}

export function inTimeRange(
  iso: string,
  range: TimeRange = "all",
  custom?: Pick<WidgetFilters, "timeFrom" | "timeTo">
): boolean {
  if (range === "all") return true;
  const t = new Date(iso).getTime();
  const now = Date.now();
  if (range === "7d") return now - t <= 7 * 86400000;
  if (range === "today") return t >= startOfDay().getTime();
  if (range === "week") return t >= startOfWeek().getTime();
  if (range === "month") return t >= startOfMonth().getTime();
  if (range === "custom") {
    const from = custom?.timeFrom ? parseDayStart(custom.timeFrom) : 0;
    const to = custom?.timeTo ? parseDayEnd(custom.timeTo) : now;
    return t >= from && t <= to;
  }
  return true;
}

export function matchesTimeFilter(
  iso: string,
  filters: Pick<WidgetFilters, "timeRange" | "timeFrom" | "timeTo">
): boolean {
  return inTimeRange(iso, filters.timeRange ?? "all", filters);
}

export function dueInRange(
  due: string | null | undefined,
  within: "all" | "week" | "month"
): boolean {
  if (!due || within === "all") return within === "all";
  const t = new Date(due.length === 10 ? `${due}T12:00:00` : due).getTime();
  if (within === "week") {
    const end = startOfWeek();
    end.setDate(end.getDate() + 7);
    return t >= startOfWeek().getTime() && t < end.getTime();
  }
  const endMonth = new Date(
    startOfMonth().getFullYear(),
    startOfMonth().getMonth() + 1,
    1
  );
  return t >= startOfMonth().getTime() && t < endMonth.getTime();
}
