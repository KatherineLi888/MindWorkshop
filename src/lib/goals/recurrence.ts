import type { KeyResult, KrTask } from "./types";

export type RecurrenceKind =
  | "daily"
  | "workdays"
  | "weekly"
  | "monthly_date"
  | "monthly_first_workday"
  | "monthly_range";

export type RecurrenceSchedule = {
  kind: RecurrenceKind;
  /** 0=周日 … 6=周六 */
  weekdays?: number[];
  monthDay?: number;
  monthRangeStart?: number;
  monthRangeEnd?: number;
};

export type Schedulable = {
  start_date?: string | null;
  due_date?: string | null;
  recurrence?: RecurrenceSchedule | null;
};

const WEEK_LABELS = ["日", "一", "二", "三", "四", "五", "六"];

export function normalizeRecurrence(
  raw: unknown
): RecurrenceSchedule | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Partial<RecurrenceSchedule>;
  const kind = r.kind;
  if (!kind) return null;
  return {
    kind,
    weekdays: Array.isArray(r.weekdays) ? r.weekdays.map(Number) : undefined,
    monthDay: r.monthDay != null ? Number(r.monthDay) : undefined,
    monthRangeStart:
      r.monthRangeStart != null ? Number(r.monthRangeStart) : undefined,
    monthRangeEnd:
      r.monthRangeEnd != null ? Number(r.monthRangeEnd) : undefined,
  };
}

function parseIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isWeekday(d: Date): boolean {
  const day = d.getDay();
  return day >= 1 && day <= 5;
}

function inDateRange(iso: string, start: string | null, end: string | null): boolean {
  if (start && iso < start) return false;
  if (end && iso > end) return false;
  return true;
}

function matchesRecurrence(iso: string, rec: RecurrenceSchedule): boolean {
  const d = parseIso(iso);
  const dow = d.getDay();
  const dom = d.getDate();

  switch (rec.kind) {
    case "daily":
      return true;
    case "workdays":
      return isWeekday(d);
    case "weekly": {
      const days = rec.weekdays ?? [];
      return days.length > 0 && days.includes(dow);
    }
    case "monthly_date":
      return rec.monthDay != null && dom === rec.monthDay;
    case "monthly_first_workday": {
      if (!isWeekday(d)) return false;
      for (let i = 1; i < dom; i++) {
        const prev = new Date(d.getFullYear(), d.getMonth(), i);
        if (isWeekday(prev)) return false;
      }
      return true;
    }
    case "monthly_range": {
      const a = rec.monthRangeStart ?? 1;
      const b = rec.monthRangeEnd ?? a;
      return dom >= a && dom <= b;
    }
    default:
      return false;
  }
}

/** 指定日期是否应执行（区间 + 重复周期，或无周期时仅看 due_date） */
export function isScheduledOnDate(
  item: Schedulable,
  dateIso: string
): boolean {
  if (!inDateRange(dateIso, item.start_date ?? null, item.due_date ?? null)) {
    if (!item.recurrence && item.due_date === dateIso) return true;
    if (!item.recurrence) return false;
  }

  if (item.recurrence) {
    if (!inDateRange(dateIso, item.start_date ?? null, item.due_date ?? null)) {
      return false;
    }
    return matchesRecurrence(dateIso, item.recurrence);
  }

  return item.due_date === dateIso;
}

export function formatRecurrenceLabel(rec: RecurrenceSchedule | null | undefined): string {
  if (!rec) return "";
  switch (rec.kind) {
    case "daily":
      return "每日";
    case "workdays":
      return "法定工作日";
    case "weekly": {
      const days = (rec.weekdays ?? [])
        .sort((a, b) => a - b)
        .map((d) => `周${WEEK_LABELS[d]}`);
      return days.length ? `每周${days.join("/")}` : "每周";
    }
    case "monthly_date":
      return `每月${rec.monthDay ?? "?"}号`;
    case "monthly_first_workday":
      return "每月首个工作日";
    case "monthly_range": {
      const a = rec.monthRangeStart ?? 1;
      const b = rec.monthRangeEnd ?? a;
      return a === b ? `每月${a}号` : `每月${a}-${b}号`;
    }
    default:
      return "";
  }
}

/** 例：2026.6.1-2026.7.30 （每周一/三/五） */
export function formatScheduleCaption(item: Schedulable): string {
  const parts: string[] = [];
  if (item.start_date || item.due_date) {
    const fmt = (iso: string) => {
      const [y, m, d] = iso.split("-");
      return `${y}.${Number(m)}.${Number(d)}`;
    };
    if (item.start_date && item.due_date) {
      parts.push(`${fmt(item.start_date)}-${fmt(item.due_date)}`);
    } else if (item.due_date) {
      parts.push(`至 ${fmt(item.due_date)}`);
    } else if (item.start_date) {
      parts.push(`自 ${fmt(item.start_date)}`);
    }
  }
  const rec = formatRecurrenceLabel(item.recurrence);
  if (rec) parts.push(`（${rec}）`);
  return parts.join(" ");
}

export function isKrDueToday(kr: KeyResult, today: string): boolean {
  if (isScheduledOnDate(kr, today)) {
    if (kr.krKind === "qualitative" || (kr.tasks?.length ?? 0) > 0) {
      const pending = (kr.tasks ?? []).some(
        (t) => t.title.trim() && !t.completed
      );
      return pending;
    }
    return kr.current < kr.target || kr.recordMode === "count";
  }
  return false;
}

export function isTaskDueToday(task: KrTask, today: string): boolean {
  if (task.completed || !task.title.trim()) return false;
  if (isScheduledOnDate(task, today)) return true;
  return task.due_date === today;
}

export function addDaysIso(iso: string, days: number): string {
  const d = parseIso(iso);
  d.setDate(d.getDate() + days);
  return toIso(d);
}

/** 今天之前最近一次应执行但未出现在今日列表的日期 */
export function getLatestMissedScheduleDate(
  item: Schedulable,
  today: string,
  minLookbackDays = 120
): string | null {
  if (!item.recurrence && !item.start_date && !item.due_date) return null;

  const yesterday = addDaysIso(today, -1);
  const lookbackStart = addDaysIso(today, -minLookbackDays);
  const rangeStart = item.start_date ?? lookbackStart;
  const start = rangeStart > lookbackStart ? rangeStart : lookbackStart;

  let cursor = yesterday;
  while (cursor >= start) {
    if (isScheduledOnDate(item, cursor)) return cursor;
    cursor = addDaysIso(cursor, -1);
  }
  return null;
}

export function getTaskOverdueDate(task: KrTask, today: string): string | null {
  if (task.completed || !task.title.trim()) return null;
  if (isTaskDueToday(task, today)) return null;

  if (task.due_date && task.due_date < today) return task.due_date;

  if (task.recurrence || task.start_date) {
    return getLatestMissedScheduleDate(task, today);
  }
  return null;
}

export function getKrOverdueDate(kr: KeyResult, today: string): string | null {
  if (kr.krKind === "qualitative" || (kr.tasks?.length ?? 0) > 0) {
    return null;
  }
  if (isKrDueToday(kr, today)) return null;

  const incomplete =
    kr.recordMode === "count" ? true : kr.current < kr.target;
  if (!incomplete) return null;

  if (kr.due_date && kr.due_date < today) return kr.due_date;

  if (kr.recurrence || kr.start_date) {
    return getLatestMissedScheduleDate(kr, today);
  }
  return null;
}

export function formatOverdueLabel(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${Number(y)}.${Number(m)}.${Number(d)}`;
}
