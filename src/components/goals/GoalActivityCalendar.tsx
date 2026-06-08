"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  activitySummaryMap,
  addDays,
  addMonths,
  filterGoalActivities,
  filterGoalActivitiesForOkr,
  formatKrCalendarLabel,
  formatMonthTitle,
  formatWeekTitle,
  loadCalendarViewPref,
  monthMatrix,
  parseDateKey,
  saveCalendarViewPref,
  startOfWeek,
  suggestCalendarView,
  toDateKey,
  weekDays,
  type CalendarViewMode,
  type DayActivitySummary,
} from "@/lib/goals/activity-log";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["一", "二", "三", "四", "五", "六", "日"];

type Props = {
  goalId: string;
  krId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  /** 主 OKR 视图：汇总全部子 KR 并分组展示 */
  aggregateSubKrs?: boolean;
  title?: string;
  refreshKey?: number;
  /** 默认展开，无需手动切换 */
  defaultExpanded?: boolean;
  /** 仅整月视图 */
  monthOnly?: boolean;
};

function DayDetail({
  summary,
  groupByKr,
}: {
  summary: DayActivitySummary;
  groupByKr?: boolean;
}) {
  return (
    <div className="mt-2 rounded-lg border border-[#E2E8F0] bg-white p-2.5">
      <p className="text-xs font-medium text-slate-700">
        {summary.date.replace(/-/g, "/")} · 共 {summary.label}
      </p>
      {groupByKr && summary.byKr.length > 0 ? (
        <ul className="mt-1.5 space-y-1.5">
          {summary.byKr.map((row) => (
            <li
              key={row.krId}
              className="flex items-center justify-between gap-2 rounded-md bg-[#F8FAFC] px-2 py-1 text-[11px]"
            >
              <span className="min-w-0 truncate font-medium text-slate-700">
                {row.krTitle}
              </span>
              <span className="shrink-0 tabular-nums text-emerald-700">
                {row.label}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="mt-1.5 space-y-1">
          {summary.entries.map((e) => (
            <li
              key={e.id}
              className="flex items-center justify-between gap-2 text-[11px] text-slate-600"
            >
              <span className="min-w-0 truncate">
                {formatKrCalendarLabel(
                  e.calendarKeyword,
                  e.krTitle,
                  e.value,
                  e.unit,
                  e.kind
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function GoalActivityCalendar({
  goalId,
  krId,
  startDate,
  endDate,
  aggregateSubKrs = false,
  title = "完成日历",
  refreshKey = 0,
  defaultExpanded = false,
  monthOnly = false,
}: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [viewMode, setViewMode] = useState<CalendarViewMode>("month");
  const [anchor, setAnchor] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const loadEntries = useCallback(() => {
    if (aggregateSubKrs) return filterGoalActivitiesForOkr(goalId);
    return filterGoalActivities(goalId, krId);
  }, [aggregateSubKrs, goalId, krId]);

  const [entries, setEntries] = useState(loadEntries);

  useEffect(() => {
    if (monthOnly) {
      setViewMode("month");
    } else {
      const suggested = suggestCalendarView(startDate, endDate);
      const saved = loadCalendarViewPref(goalId, krId);
      setViewMode(saved ?? suggested);
      if (startDate) {
        setAnchor(parseDateKey(startDate));
      }
    }
  }, [goalId, krId, startDate, endDate, monthOnly]);

  useEffect(() => {
    setEntries(loadEntries());
  }, [loadEntries, refreshKey]);

  const summary = useMemo(() => activitySummaryMap(entries), [entries]);
  const selectedSummary = selectedDate ? summary.get(selectedDate) : null;

  const setMode = (mode: CalendarViewMode) => {
    setViewMode(mode);
    saveCalendarViewPref(goalId, mode, krId);
  };

  const inPeriod = (d: Date, daySummary?: DayActivitySummary) => {
    const key = toDateKey(d);
    if (daySummary) return true;
    if (startDate && key < startDate) return false;
    if (endDate && key > endDate) return false;
    return true;
  };

  const todayKey = toDateKey(new Date());

  const monthRows = useMemo(
    () => monthMatrix(anchor.getFullYear(), anchor.getMonth()),
    [anchor]
  );

  const weekRow = useMemo(() => weekDays(anchor), [anchor]);

  const navLabel =
    viewMode === "month"
      ? formatMonthTitle(anchor)
      : formatWeekTitle(startOfWeek(anchor));

  const shift = (dir: -1 | 1) => {
    setAnchor((a) =>
      viewMode === "month" ? addMonths(a, dir) : addDays(a, dir * 7)
    );
    setSelectedDate(null);
  };

  const showBody = defaultExpanded || expanded;

  return (
    <div className="w-full rounded-lg border border-[#EEF1F5] bg-[#FAFBFC]">
      {!defaultExpanded ? (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left"
        >
          <span className="text-xs font-medium text-slate-700">
            {title}
            {entries.length > 0 && (
              <span className="ml-1.5 text-[10px] font-normal text-slate-400">
                {entries.length} 条记录
              </span>
            )}
          </span>
          <span className="text-[10px] text-slate-400">
            {expanded ? "收起" : "展开"}
          </span>
        </button>
      ) : (
        <div className="flex items-center justify-between gap-2 px-3 py-2">
          <span className="text-xs font-medium text-slate-700">{title}</span>
          {entries.length > 0 && (
            <span className="text-[10px] text-slate-400">
              {entries.length} 条记录
            </span>
          )}
        </div>
      )}

      {showBody && (
        <div className="space-y-3 border-t border-[#EEF1F5] px-3 pb-3 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => shift(-1)}
                className="rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-white"
              >
                ‹
              </button>
              <span className="min-w-[8rem] text-center text-xs font-medium text-slate-700">
                {navLabel}
              </span>
              <button
                type="button"
                onClick={() => shift(1)}
                className="rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-white"
              >
                ›
              </button>
            </div>
            {!monthOnly && (
              <div className="flex rounded-lg border border-[#E2E8F0] bg-white p-0.5">
                {(
                  [
                    ["month", "月"],
                    ["week", "周"],
                  ] as const
                ).map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setMode(k)}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-[10px] transition",
                      viewMode === k
                        ? "bg-[#EFF6FF] font-medium text-[#1D4ED8]"
                        : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    {label}视图
                  </button>
                ))}
              </div>
            )}
          </div>

          {viewMode === "month" ? (
            <>
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-slate-400">
                {WEEKDAY_LABELS.map((w) => (
                  <span key={w}>{w}</span>
                ))}
              </div>
              <div className="space-y-1">
                {monthRows.map((row, ri) => (
                  <div key={ri} className="grid grid-cols-7 gap-1">
                    {row.map((d, ci) => {
                      if (!d) {
                        return <div key={ci} className="aspect-square" />;
                      }
                      const key = toDateKey(d);
                      const daySummary = summary.get(key);
                      const active = inPeriod(d, daySummary);
                      const isToday = key === todayKey;
                      const isSelected = key === selectedDate;

                      return (
                        <button
                          key={ci}
                          type="button"
                          disabled={!active}
                          onClick={() =>
                            setSelectedDate((s) => (s === key ? null : key))
                          }
                          className={cn(
                            "flex aspect-square flex-col items-center justify-center rounded-lg border text-[10px] transition",
                            !active && "cursor-not-allowed opacity-30",
                            isSelected
                              ? "border-[#3B82F6] bg-[#EFF6FF]"
                              : isToday
                                ? "border-emerald-200 bg-emerald-50/50"
                                : daySummary
                                  ? "border-emerald-100 bg-white hover:border-emerald-300"
                                  : "border-transparent bg-white/60 hover:bg-white"
                          )}
                        >
                          <span
                            className={cn(
                              "font-medium tabular-nums",
                              isToday ? "text-emerald-700" : "text-slate-600"
                            )}
                          >
                            {d.getDate()}
                          </span>
                          {daySummary ? (
                            <span className="mt-0.5 max-w-full truncate px-0.5 text-[8px] font-semibold text-emerald-600">
                              {aggregateSubKrs && daySummary.byKr.length === 1
                                ? daySummary.byKr[0].label
                                : daySummary.label}
                            </span>
                          ) : active ? (
                            <span className="mt-0.5 text-[8px] text-slate-300">
                              ○
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="grid grid-cols-7 gap-1.5">
              {weekRow.map((d) => {
                const key = toDateKey(d);
                const daySummary = summary.get(key);
                const active = inPeriod(d, daySummary);
                const isToday = key === todayKey;
                const isSelected = key === selectedDate;

                return (
                  <button
                    key={key}
                    type="button"
                    disabled={!active}
                    onClick={() =>
                      setSelectedDate((s) => (s === key ? null : key))
                    }
                    className={cn(
                      "min-h-[4.5rem] rounded-lg border p-1.5 text-left transition",
                      !active && "cursor-not-allowed opacity-30",
                      isSelected
                        ? "border-[#3B82F6] bg-[#EFF6FF]"
                        : isToday
                          ? "border-emerald-200 bg-emerald-50/50"
                          : "border-[#E2E8F0] bg-white hover:border-emerald-200"
                    )}
                  >
                    <p className="text-[10px] font-medium text-slate-500">
                      周{WEEKDAY_LABELS[d.getDay() === 0 ? 6 : d.getDay() - 1]}
                    </p>
                    <p
                      className={cn(
                        "text-sm font-semibold tabular-nums",
                        isToday ? "text-emerald-700" : "text-slate-800"
                      )}
                    >
                      {d.getDate()}
                    </p>
                    {daySummary ? (
                      <p className="mt-1 text-[10px] font-semibold text-emerald-600">
                        {daySummary.label}
                      </p>
                    ) : (
                      <p className="mt-1 text-[9px] text-slate-300">—</p>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {selectedSummary && (
            <DayDetail summary={selectedSummary} groupByKr={aggregateSubKrs} />
          )}

          {entries.length === 0 && (
            <p className="text-center text-[11px] text-slate-400">
              暂无完成记录 · 打卡后会自动出现在日历上
            </p>
          )}
        </div>
      )}
    </div>
  );
}
