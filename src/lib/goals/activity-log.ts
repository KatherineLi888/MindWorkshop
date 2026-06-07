import { loadLocal, saveLocal, LOCAL_KEYS } from "@/lib/local-store";
import type { KeyResult, KrRecordMode } from "./types";
import { unitLabel } from "./kr-progress";

export type GoalActivityKind = KrRecordMode | "manual";

export type GoalActivityEntry = {
  id: string;
  goalId: string;
  krId?: string;
  krTitle?: string;
  /** 日历展示关键词（来自 KR 设置） */
  calendarKeyword?: string;
  recordedAt: string;
  /** YYYY-MM-DD，本地日历分组 */
  date: string;
  value: number;
  unit?: string;
  kind: GoalActivityKind;
};

export function formatKrCalendarLabel(
  keyword: string | undefined,
  krTitle: string | undefined,
  value: number,
  unit?: string,
  kind?: GoalActivityKind
): string {
  const name = keyword?.trim() || krTitle?.trim() || "记录";
  const countLike =
    !kind ||
    kind === "count" ||
    kind === "consume" ||
    kind === "manual" ||
    kind === "set";
  if (countLike && !unit) {
    return `${name} ${Math.round(value)}次`;
  }
  if (unit) {
    return `${name} ${formatActivityNumber(value)}${unit}`;
  }
  return `${name} ${Math.round(value)}次`;
}

function localDateKey(iso = new Date()): string {
  const d = iso instanceof Date ? iso : new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function loadGoalActivities(): GoalActivityEntry[] {
  return loadLocal<GoalActivityEntry[]>(LOCAL_KEYS.goalActivities, []);
}

export function saveGoalActivities(entries: GoalActivityEntry[]) {
  saveLocal(LOCAL_KEYS.goalActivities, entries);
}

export function filterGoalActivities(
  goalId: string,
  krId?: string | null
): GoalActivityEntry[] {
  const all = loadGoalActivities();
  return all.filter((e) => {
    if (e.goalId !== goalId) return false;
    if (krId === undefined || krId === null) return true;
    return e.krId === krId;
  });
}

/** 主 OKR 日历：含全部子 KR + 手动量化记录 */
export function filterGoalActivitiesForOkr(goalId: string): GoalActivityEntry[] {
  return loadGoalActivities().filter((e) => e.goalId === goalId);
}

/** 记录 KR 打卡/录入对应的日历增量 */
export function logValueForKrRecord(kr: KeyResult, inputValue: number): number {
  switch (kr.recordMode) {
    case "count":
    case "consume":
      return 1;
    case "accumulate":
      return inputValue;
    case "set":
      return 1;
    default:
      return inputValue;
  }
}

export function appendGoalActivity(input: {
  goalId: string;
  krId?: string;
  krTitle?: string;
  calendarKeyword?: string;
  value: number;
  unit?: string;
  kind: GoalActivityKind;
  recordedAt?: string;
}): GoalActivityEntry {
  const recordedAt = input.recordedAt ?? new Date().toISOString();
  const entry: GoalActivityEntry = {
    id: crypto.randomUUID(),
    goalId: input.goalId,
    krId: input.krId,
    krTitle: input.krTitle,
    calendarKeyword: input.calendarKeyword,
    recordedAt,
    date: localDateKey(recordedAt),
    value: input.value,
    unit: input.unit,
    kind: input.kind,
  };
  const prev = loadGoalActivities();
  saveGoalActivities([entry, ...prev]);
  return entry;
}

export function logKrActivity(
  goalId: string,
  kr: KeyResult,
  inputValue: number
): GoalActivityEntry {
  return appendGoalActivity({
    goalId,
    krId: kr.id,
    krTitle: kr.title.trim() || undefined,
    calendarKeyword: kr.calendarKeyword,
    value: logValueForKrRecord(kr, inputValue),
    unit: unitLabel(kr),
    kind: kr.recordMode,
  });
}

export function logManualGoalActivity(
  goalId: string,
  unit: string,
  delta = 1
): GoalActivityEntry {
  return appendGoalActivity({
    goalId,
    value: delta,
    unit: unit || undefined,
    kind: "manual",
  });
}

export type DayActivitySummary = {
  date: string;
  totalValue: number;
  entryCount: number;
  entries: GoalActivityEntry[];
  /** 展示用，如「5次」「5.2km」 */
  label: string;
  /** 按 KR 分组（主 OKR 日历用） */
  byKr: { krId: string; krTitle: string; totalValue: number; label: string }[];
};

export function summarizeDayActivities(
  entries: GoalActivityEntry[]
): DayActivitySummary[] {
  const map = new Map<string, GoalActivityEntry[]>();
  for (const e of entries) {
    const list = map.get(e.date) ?? [];
    list.push(e);
    map.set(e.date, list);
  }

  return [...map.entries()]
    .map(([date, dayEntries]) => {
      const sorted = [...dayEntries].sort(
        (a, b) =>
          new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
      );
      const totalValue = sorted.reduce((acc, e) => acc + e.value, 0);
      const units = new Set(sorted.map((e) => e.unit).filter(Boolean));
      const singleUnit = units.size === 1 ? [...units][0] : undefined;
      const mostlyCount = sorted.every(
        (e) =>
          e.kind === "count" ||
          e.kind === "consume" ||
          e.kind === "manual" ||
          e.kind === "set"
      );

      let label: string;
      if (mostlyCount && !singleUnit) {
        label = `${Math.round(totalValue)}次`;
      } else if (singleUnit) {
        label = `${formatActivityNumber(totalValue)}${singleUnit}`;
      } else {
        label = `${sorted.length}条`;
      }

      const krMap = new Map<
        string,
        {
          krId: string;
          krTitle: string;
          calendarKeyword?: string;
          totalValue: number;
          unit?: string;
          kinds: Set<string>;
        }
      >();
      for (const e of sorted) {
        const key = e.krId ?? "__manual__";
        const title =
          e.calendarKeyword?.trim() ||
          e.krTitle ||
          (e.kind === "manual" ? "手动追踪" : "记录");
        const row = krMap.get(key) ?? {
          krId: key,
          krTitle: title,
          calendarKeyword: e.calendarKeyword,
          totalValue: 0,
          unit: e.unit,
          kinds: new Set<string>(),
        };
        row.totalValue += e.value;
        if (e.unit) row.unit = e.unit;
        if (e.calendarKeyword) row.calendarKeyword = e.calendarKeyword;
        row.kinds.add(e.kind);
        krMap.set(key, row);
      }
      const byKr = [...krMap.values()].map((row) => {
        const kind = [...row.kinds][0] as GoalActivityKind | undefined;
        const krLabel = formatKrCalendarLabel(
          row.calendarKeyword,
          row.krTitle,
          row.totalValue,
          row.unit,
          kind
        );
        return {
          krId: row.krId,
          krTitle: row.calendarKeyword?.trim() || row.krTitle,
          totalValue: row.totalValue,
          label: krLabel,
        };
      });

      return {
        date,
        totalValue,
        entryCount: sorted.length,
        entries: sorted,
        label,
        byKr,
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function formatActivityNumber(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(2).replace(/\.?0+$/, "");
}

export function activitySummaryMap(
  entries: GoalActivityEntry[]
): Map<string, DayActivitySummary> {
  return new Map(
    summarizeDayActivities(entries).map((s) => [s.date, s])
  );
}

export type CalendarViewMode = "month" | "week";

const CAL_PREF_PREFIX = "goal-cal-view-";

export function loadCalendarViewPref(
  goalId: string,
  krId?: string | null
): CalendarViewMode | null {
  if (typeof window === "undefined") return null;
  const key = `${CAL_PREF_PREFIX}${goalId}${krId ? `-${krId}` : ""}`;
  const raw = localStorage.getItem(key);
  if (raw === "week") return "week";
  if (raw === "month") return "month";
  return null;
}

export function saveCalendarViewPref(
  goalId: string,
  mode: CalendarViewMode,
  krId?: string | null
) {
  if (typeof window === "undefined") return;
  const key = `${CAL_PREF_PREFIX}${goalId}${krId ? `-${krId}` : ""}`;
  localStorage.setItem(key, mode);
}

/** 根据周期长度推荐默认视图 */
export function suggestCalendarView(
  startDate?: string | null,
  endDate?: string | null
): CalendarViewMode {
  if (!startDate || !endDate) return "month";
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1;
  return days <= 21 ? "week" : "month";
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function startOfWeek(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

export function addMonths(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setMonth(copy.getMonth() + n);
  return copy;
}

export function monthMatrix(year: number, month: number): (Date | null)[][] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startPad = first.getDay() === 0 ? 6 : first.getDay() - 1;
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= last.getDate(); d++) {
    cells.push(new Date(year, month, d));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }
  return rows;
}

export function weekDays(anchor: Date): Date[] {
  const start = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function formatMonthTitle(d: Date): string {
  return `${d.getFullYear()}年${d.getMonth() + 1}月`;
}

export function formatWeekTitle(start: Date): string {
  const end = addDays(start, 6);
  const sameMonth = start.getMonth() === end.getMonth();
  if (sameMonth) {
    return `${start.getFullYear()}年${start.getMonth() + 1}月 ${start.getDate()}–${end.getDate()}日`;
  }
  return `${start.getMonth() + 1}/${start.getDate()} – ${end.getMonth() + 1}/${end.getDate()}`;
}

export function isDateInRange(
  d: Date,
  startDate?: string | null,
  endDate?: string | null
): boolean {
  if (!startDate && !endDate) return true;
  const key = toDateKey(d);
  if (startDate && key < startDate) return false;
  if (endDate && key > endDate) return false;
  return true;
}
