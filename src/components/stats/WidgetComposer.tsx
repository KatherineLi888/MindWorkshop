"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { renderWidgetView } from "@/components/stats/StatsWidgets";
import type { DashboardStats } from "@/lib/stats/aggregate";
import {
  ALL_KPI_KEYS,
  ALL_WIDGET_SIZES,
  createWidgetInstance,
  defaultFilters,
  KPI_META,
  scopeForType,
  SIZE_LABELS,
  SIZE_PREVIEW_SPAN,
  TIME_RANGE_LABELS,
  WIDGET_META,
  WIDGET_SCOPES,
  type GoalTypeFilter,
  type KpiKey,
  type TimeRange,
  type WidgetFilters,
  type WidgetId,
  type WidgetInstance,
  type WidgetScope,
  type WidgetSize,
  type WidgetStyle,
} from "@/lib/stats/dashboard-config";
import {
  availableSizesAt,
  buildOccupancy,
  type GridAnchor,
} from "@/lib/stats/grid-layout";
import type { ViewTimeScope } from "@/lib/stats/dashboard-views";
import { buildWidgetView, filterGoals } from "@/lib/stats/widget-query";

type Props = {
  stats: DashboardStats;
  initial?: WidgetInstance | null;
  anchor?: GridAnchor | null;
  layoutInstances: WidgetInstance[];
  viewScope?: ViewTimeScope | null;
  onSave: (instance: WidgetInstance) => void;
  onClose: () => void;
};

const STEPS = ["尺寸", "板块", "筛选", "样式"] as const;
const PREVIEW_GRID_COLS = 4;
const PREVIEW_GRID_ROWS = 4;
type FilterPanel =
  | "time"
  | "kpi"
  | "goalType"
  | "due"
  | "goals"
  | "limit"
  | "decision"
  | "modules"
  | "recent"
  | null;

export function WidgetComposer({
  stats,
  initial,
  anchor,
  layoutInstances,
  viewScope,
  onSave,
  onClose,
}: Props) {
  const [step, setStep] = useState(0);
  const [scope, setScope] = useState<WidgetScope>(() =>
    initial ? scopeForType(initial.type) : "goals"
  );
  const [type, setType] = useState<WidgetId>(
    initial?.type ?? "goals_progress"
  );
  const [size, setSize] = useState<WidgetSize>(
    initial?.size ?? "2x1"
  );
  const [filters, setFilters] = useState<WidgetFilters>(
    initial?.filters ?? defaultFilters("goals_progress")
  );
  const [style, setStyle] = useState<WidgetStyle>(
    initial?.style ?? WIDGET_META.goals_progress.defaultStyle
  );
  const [title, setTitle] = useState(initial?.title ?? "");
  const [filterPanel, setFilterPanel] = useState<FilterPanel>(null);

  const meta = WIDGET_META[type];

  const occ = useMemo(
    () => buildOccupancy(layoutInstances, initial?.instanceId),
    [layoutInstances, initial?.instanceId]
  );

  const fitSizes = useMemo(() => {
    if (anchor) return availableSizesAt(occ, anchor);
    return ALL_WIDGET_SIZES;
  }, [anchor, occ]);

  useEffect(() => {
    if (initial) return;
    if (fitSizes.length && !fitSizes.includes(size)) {
      setSize(fitSizes[0]);
    }
  }, [fitSizes, initial, size]);

  const draft = useMemo(
    (): WidgetInstance => ({
      instanceId: initial?.instanceId ?? "preview",
      type,
      size,
      style,
      row: initial?.row ?? anchor?.row ?? 0,
      col: initial?.col ?? anchor?.col ?? 0,
      title: title.trim() || undefined,
      filters,
    }),
    [
      initial?.instanceId,
      initial?.row,
      initial?.col,
      anchor,
      type,
      size,
      style,
      title,
      filters,
    ]
  );

  const preview = useMemo(
    () => buildWidgetView(draft, stats, viewScope),
    [draft, stats, viewScope]
  );

  const patchFilter = (patch: Partial<WidgetFilters>) =>
    setFilters((f) => ({ ...f, ...patch }));

  const pickScope = (s: WidgetScope) => {
    setScope(s);
    const first = WIDGET_SCOPES[s].types[0];
    if (!initial) pickType(first);
  };

  const pickType = (t: WidgetId) => {
    setType(t);
    setScope(scopeForType(t));
    if (!initial) {
      setFilters(defaultFilters(t));
      setStyle(WIDGET_META[t].defaultStyle);
    }
  };

  const toggleKpi = (key: KpiKey) => {
    const cur = filters.kpiKeys ?? [];
    patchFilter({
      kpiKeys: cur.includes(key)
        ? cur.filter((k) => k !== key)
        : [...cur, key],
    });
  };

  const toggleGoalType = (t: GoalTypeFilter) => {
    const cur = filters.goalTypes ?? ["near", "long", "pending"];
    patchFilter({
      goalTypes: cur.includes(t)
        ? cur.filter((x) => x !== t)
        : [...cur, t],
    });
  };

  const toggleGoalId = (id: string) => {
    const cur = filters.goalIds ?? [];
    patchFilter({
      goalIds: cur.includes(id)
        ? cur.filter((x) => x !== id)
        : [...cur, id],
    });
  };

  const goalOptions = useMemo(
    () =>
      filterGoals(stats.raw.goals, {
        goalTypes: filters.goalTypes,
        timeRange: filters.timeRange,
        timeFrom: filters.timeFrom,
        timeTo: filters.timeTo,
        dueWithin: filters.dueWithin,
        goalLimit: 50,
      }),
    [stats, filters]
  );

  const timeSummary = () => {
    const r = filters.timeRange ?? "all";
    if (r === "custom") {
      const from = filters.timeFrom ?? "…";
      const to = filters.timeTo ?? "…";
      return `${from} 至 ${to}`;
    }
    return TIME_RANGE_LABELS[r];
  };

  const save = () => {
    if (initial) {
      onSave({ ...draft, instanceId: initial.instanceId });
    } else {
      const inst = createWidgetInstance(
        type,
        size,
        filters,
        style,
        title.trim() || undefined,
        anchor ?? undefined
      );
      onSave(inst);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-[#E2E8F0] px-4 py-3">
          <h3 className="text-sm font-semibold">
            {initial
              ? "编辑组件"
              : anchor
                ? `在第 ${anchor.row + 1} 行 · 第 ${anchor.col + 1} 列添加`
                : "添加组件"}
          </h3>
          <div className="mt-2 flex gap-1">
            {STEPS.map((s, i) => (
              <button
                key={s}
                type="button"
                onClick={() => setStep(i)}
                className={`rounded-full px-2.5 py-0.5 text-[10px] ${
                  step === i
                    ? "bg-[#3B82F6] text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {i + 1}.{s}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-[8rem] shrink-0 border-b border-[#EEF1F5] bg-[#F8FAFC] p-3">
          <p className="mb-1 text-[10px] text-slate-400">实时预览</p>
          <div className="max-h-40 overflow-hidden rounded-lg border border-[#E2E8F0] bg-white p-2">
            {renderWidgetView(draft, preview, {
              interactive: false,
              compact: true,
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {step === 0 && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                {anchor
                  ? "先选占位大小（从当前格子向右/下扩展）"
                  : "先选占位大小"}
              </p>
              {fitSizes.length === 0 ? (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                  此位置空间不足，请换一个大格或先移动其他组件
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {ALL_WIDGET_SIZES.map((s) => {
                    const allowed = fitSizes.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        disabled={!allowed}
                        onClick={() => setSize(s)}
                        className={`rounded-xl border-2 p-2.5 text-left transition ${
                          !allowed
                            ? "cursor-not-allowed border-transparent bg-slate-50 opacity-35"
                            : size === s
                              ? "border-[#3B82F6] bg-blue-50"
                              : "border-[#E2E8F0] bg-white hover:border-slate-300"
                        }`}
                      >
                        <SizeShapePreview
                          size={s}
                          selected={size === s && allowed}
                          disabled={!allowed}
                        />
                        <p className="mt-2 text-[11px] font-medium text-slate-800">
                          {SIZE_LABELS[s]}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                已选尺寸：<span className="font-medium text-slate-800">{SIZE_LABELS[size]}</span>
              </p>
              <div>
                <p className="mb-2 text-xs font-medium text-slate-600">
                  选范围
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(WIDGET_SCOPES) as WidgetScope[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => pickScope(s)}
                      className={`rounded-xl border px-2 py-3 text-center transition ${
                        scope === s
                          ? "border-[#3B82F6] bg-blue-50 text-[#1D4ED8]"
                          : "border-[#E2E8F0] hover:bg-slate-50"
                      }`}
                    >
                      <p className="text-sm font-semibold">
                        {WIDGET_SCOPES[s].label}
                      </p>
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-[10px] text-slate-400">
                  {WIDGET_SCOPES[scope].hint}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs font-medium text-slate-600">
                  {WIDGET_SCOPES[scope].label}组件
                </p>
                <div className="space-y-2">
                  {WIDGET_SCOPES[scope].types.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => pickType(t)}
                      className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${
                        type === t
                          ? "border-[#3B82F6] bg-blue-50"
                          : "border-[#E2E8F0] hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {WIDGET_META[t].label}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {WIDGET_META[t].description}
                        </p>
                      </div>
                      {type === t && (
                        <span className="text-[#3B82F6]">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-2">
              <label className="block rounded-xl border border-[#E2E8F0] px-3 py-3">
                <span className="text-xs text-slate-500">组件标题（可选）</span>
                <Input
                  className="mt-1.5"
                  placeholder="如：本周要完成的"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </label>

              {type !== "activity" && (
                <FilterRow
                  label="时间范围"
                  value={timeSummary()}
                  open={filterPanel === "time"}
                  onToggle={() =>
                    setFilterPanel(filterPanel === "time" ? null : "time")
                  }
                >
                  <div className="flex flex-wrap gap-1.5">
                    {(Object.keys(TIME_RANGE_LABELS) as TimeRange[]).map(
                      (r) => (
                        <Chip
                          key={r}
                          active={(filters.timeRange ?? "all") === r}
                          onClick={() =>
                            patchFilter({
                              timeRange: r,
                              ...(r !== "custom"
                                ? { timeFrom: undefined, timeTo: undefined }
                                : {}),
                            })
                          }
                        >
                          {TIME_RANGE_LABELS[r]}
                        </Chip>
                      )
                    )}
                  </div>
                  {(filters.timeRange ?? "all") === "custom" && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <label className="text-[10px] text-slate-500">
                        起
                        <Input
                          type="date"
                          className="mt-0.5"
                          value={filters.timeFrom ?? ""}
                          onChange={(e) =>
                            patchFilter({ timeFrom: e.target.value })
                          }
                        />
                      </label>
                      <label className="text-[10px] text-slate-500">
                        止
                        <Input
                          type="date"
                          className="mt-0.5"
                          value={filters.timeTo ?? ""}
                          onChange={(e) =>
                            patchFilter({ timeTo: e.target.value })
                          }
                        />
                      </label>
                    </div>
                  )}
                </FilterRow>
              )}

              {type === "kpi" && (
                <FilterRow
                  label="统计板块"
                  value={`已选 ${(filters.kpiKeys ?? []).length} 项`}
                  open={filterPanel === "kpi"}
                  onToggle={() =>
                    setFilterPanel(filterPanel === "kpi" ? null : "kpi")
                  }
                >
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_KPI_KEYS.map((k) => (
                      <Chip
                        key={k}
                        active={(filters.kpiKeys ?? []).includes(k)}
                        onClick={() => toggleKpi(k)}
                      >
                        {KPI_META[k].icon} {KPI_META[k].label}
                      </Chip>
                    ))}
                  </div>
                </FilterRow>
              )}

              {(type === "goals_progress" || type === "goals_types") && (
                <>
                  <FilterRow
                    label="目标类型"
                    value={
                      (filters.goalTypes ?? [])
                        .map((t) =>
                          t === "near"
                            ? "近期"
                            : t === "long"
                              ? "长期"
                              : "待定"
                        )
                        .join("、") || "未选"
                    }
                    open={filterPanel === "goalType"}
                    onToggle={() =>
                      setFilterPanel(
                        filterPanel === "goalType" ? null : "goalType"
                      )
                    }
                  >
                    {(["near", "long", "pending"] as GoalTypeFilter[]).map(
                      (t) => (
                        <Chip
                          key={t}
                          active={(filters.goalTypes ?? []).includes(t)}
                          onClick={() => toggleGoalType(t)}
                        >
                          {t === "near"
                            ? "近期"
                            : t === "long"
                              ? "长期"
                              : "待定"}
                        </Chip>
                      )
                    )}
                  </FilterRow>

                  {type === "goals_progress" && (
                    <>
                      <FilterRow
                        label="截止范围"
                        value={
                          filters.dueWithin === "week"
                            ? "本周到期"
                            : filters.dueWithin === "month"
                              ? "本月到期"
                              : "不限"
                        }
                        open={filterPanel === "due"}
                        onToggle={() =>
                          setFilterPanel(
                            filterPanel === "due" ? null : "due"
                          )
                        }
                      >
                        {(
                          [
                            ["all", "不限"],
                            ["week", "本周到期"],
                            ["month", "本月到期"],
                          ] as const
                        ).map(([v, label]) => (
                          <Chip
                            key={v}
                            active={(filters.dueWithin ?? "all") === v}
                            onClick={() => patchFilter({ dueWithin: v })}
                          >
                            {label}
                          </Chip>
                        ))}
                      </FilterRow>

                      <FilterRow
                        label="指定目标"
                        value={
                          (filters.goalIds ?? []).length
                            ? `已选 ${filters.goalIds!.length} 个`
                            : "按条件自动匹配"
                        }
                        open={filterPanel === "goals"}
                        onToggle={() =>
                          setFilterPanel(
                            filterPanel === "goals" ? null : "goals"
                          )
                        }
                      >
                        <div className="max-h-36 space-y-0.5 overflow-y-auto">
                          {goalOptions.length === 0 ? (
                            <p className="text-[10px] text-slate-400">
                              无匹配目标
                            </p>
                          ) : (
                            goalOptions.map((g) => (
                              <label
                                key={g.id}
                                className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-slate-50"
                              >
                                <input
                                  type="checkbox"
                                  checked={(filters.goalIds ?? []).includes(
                                    g.id
                                  )}
                                  onChange={() => toggleGoalId(g.id)}
                                />
                                <span className="min-w-0 flex-1 truncate">
                                  {g.name}
                                </span>
                                <span className="text-slate-400">
                                  {g.progress}%
                                </span>
                              </label>
                            ))
                          )}
                        </div>
                      </FilterRow>

                      <FilterRow
                        label="显示条数"
                        value={`${filters.goalLimit ?? 5} 条`}
                        open={filterPanel === "limit"}
                        onToggle={() =>
                          setFilterPanel(
                            filterPanel === "limit" ? null : "limit"
                          )
                        }
                      >
                        {[3, 5, 8].map((n) => (
                          <Chip
                            key={n}
                            active={(filters.goalLimit ?? 5) === n}
                            onClick={() => patchFilter({ goalLimit: n })}
                          >
                            {n} 条
                          </Chip>
                        ))}
                      </FilterRow>
                    </>
                  )}
                </>
              )}

              {type === "decisions" && (
                <FilterRow
                  label="决策来源"
                  value={
                    filters.decisionSource === "active"
                      ? "主动做"
                      : filters.decisionSource === "passive"
                        ? "被委派"
                        : "全部"
                  }
                  open={filterPanel === "decision"}
                  onToggle={() =>
                    setFilterPanel(
                      filterPanel === "decision" ? null : "decision"
                    )
                  }
                >
                  {(
                    [
                      ["all", "全部"],
                      ["active", "主动做"],
                      ["passive", "被委派"],
                    ] as const
                  ).map(([v, label]) => (
                    <Chip
                      key={v}
                      active={(filters.decisionSource ?? "all") === v}
                      onClick={() => patchFilter({ decisionSource: v })}
                    >
                      {label}
                    </Chip>
                  ))}
                </FilterRow>
              )}

              {type === "modules" && (
                <FilterRow
                  label="对比板块"
                  value={`已选 ${(filters.stockModules ?? ALL_KPI_KEYS).length} 项`}
                  open={filterPanel === "modules"}
                  onToggle={() =>
                    setFilterPanel(
                      filterPanel === "modules" ? null : "modules"
                    )
                  }
                >
                  {ALL_KPI_KEYS.map((k) => (
                    <Chip
                      key={k}
                      active={(filters.stockModules ?? ALL_KPI_KEYS).includes(
                        k
                      )}
                      onClick={() => {
                        const cur = filters.stockModules ?? ALL_KPI_KEYS;
                        patchFilter({
                          stockModules: cur.includes(k)
                            ? cur.filter((x) => x !== k)
                            : [...cur, k],
                        });
                      }}
                    >
                      {KPI_META[k].label}
                    </Chip>
                  ))}
                </FilterRow>
              )}

              {type === "recent" && (
                <FilterRow
                  label="包含板块"
                  value={`已选 ${(filters.recentModules ?? []).length} 项`}
                  open={filterPanel === "recent"}
                  onToggle={() =>
                    setFilterPanel(filterPanel === "recent" ? null : "recent")
                  }
                >
                  {(
                    [
                      ["decision", "决策"],
                      ["goal", "目标"],
                      ["thinking", "思考"],
                      ["model", "模型"],
                      ["canvas", "画布"],
                    ] as const
                  ).map(([v, label]) => (
                    <Chip
                      key={v}
                      active={(filters.recentModules ?? []).includes(v)}
                      onClick={() => {
                        const cur = filters.recentModules ?? [
                          "decision",
                          "goal",
                          "thinking",
                        ];
                        patchFilter({
                          recentModules: cur.includes(v)
                            ? cur.filter((x) => x !== v)
                            : [...cur, v],
                        });
                      }}
                    >
                      {label}
                    </Chip>
                  ))}
                </FilterRow>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {meta.styles.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStyle(s.id)}
                  className={`rounded-xl border p-3 text-left ${
                    style === s.id
                      ? "border-[#3B82F6] bg-blue-50 text-[#1D4ED8]"
                      : "border-[#E2E8F0]"
                  }`}
                >
                  <p className="text-sm font-medium">{s.label}</p>
                  {type === "goals_progress" && (
                    <div className="mt-2 rounded-lg bg-white p-2">
                      <div className="mb-1 text-[10px] text-slate-400">
                        示例 68%
                      </div>
                      <GoalStylePreview barStyle={s.id} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2 border-t border-[#E2E8F0] p-3">
          {step > 0 ? (
            <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)}>
              上一步
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={onClose}>
              取消
            </Button>
          )}
          <div className="flex-1" />
          {step < STEPS.length - 1 ? (
            <Button
              variant="primary"
              size="sm"
              disabled={step === 0 && fitSizes.length === 0}
              onClick={() => setStep(step + 1)}
            >
              下一步
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={save}>
              {initial ? "保存" : "添加到此位置"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-2.5 py-1 text-[11px] transition ${
        active
          ? "bg-[#3B82F6] text-white"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
    >
      {children}
    </button>
  );
}

function GoalStylePreview({ barStyle }: { barStyle: WidgetStyle }) {
  const pct = 68;
  if (barStyle === "bar_slim") {
    return (
      <div className="h-1 rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-slate-700" style={{ width: `${pct}%` }} />
      </div>
    );
  }
  if (barStyle === "bar_bold") {
    return (
      <div className="h-3 rounded-lg bg-slate-100">
        <div
          className="h-full rounded-lg bg-gradient-to-r from-indigo-500 to-cyan-400"
          style={{ width: `${pct}%` }}
        />
      </div>
    );
  }
  if (barStyle === "bar_inline") {
    return (
      <div className="relative h-3 rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-medium">
          {pct}%
        </span>
      </div>
    );
  }
  if (barStyle === "bar_steps") {
    return (
      <div className="h-2.5 rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-amber-500" style={{ width: `${pct}%` }} />
      </div>
    );
  }
  if (barStyle === "bar_glow") {
    return (
      <div className="h-2.5 rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.6)]"
          style={{ width: `${pct}%` }}
        />
      </div>
    );
  }
  return (
    <div className="h-2 rounded-full bg-slate-100">
      <div
        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function SizeShapePreview({
  size,
  selected,
  disabled,
}: {
  size: WidgetSize;
  selected: boolean;
  disabled?: boolean;
}) {
  const { col, row } = SIZE_PREVIEW_SPAN[size];
  return (
    <div
      className="rounded-lg border border-slate-200 bg-slate-50 p-2"
      aria-hidden
    >
      <div
        className="grid gap-[3px]"
        style={{
          gridTemplateColumns: `repeat(${PREVIEW_GRID_COLS}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${PREVIEW_GRID_ROWS}, 11px)`,
        }}
      >
        {Array.from({ length: PREVIEW_GRID_COLS * PREVIEW_GRID_ROWS }).map(
          (_, idx) => {
            const c = idx % PREVIEW_GRID_COLS;
            const r = Math.floor(idx / PREVIEW_GRID_COLS);
            const filled = c < col && r < row;
            return (
              <div
                key={idx}
                className={`rounded-[2px] border ${
                  filled
                    ? selected
                      ? "border-[#1D4ED8] bg-[#3B82F6]"
                      : disabled
                        ? "border-slate-200 bg-slate-300"
                        : "border-[#93C5FD] bg-[#60A5FA]"
                    : "border-slate-200/80 bg-white"
                }`}
              />
            );
          }
        )}
      </div>
    </div>
  );
}

function FilterRow({
  label,
  value,
  open,
  onToggle,
  hideArrow,
  children,
}: {
  label: string;
  value: string;
  open: boolean;
  onToggle: () => void;
  hideArrow?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white">
      <button
        type="button"
        onClick={hideArrow ? undefined : onToggle}
        className="flex w-full items-center gap-2 px-3 py-3 text-left"
      >
        <span className="text-xs text-slate-500">{label}</span>
        <span className="ml-auto truncate text-sm font-medium text-slate-800">
          {value}
        </span>
        {!hideArrow && (
          <span
            className={`text-slate-400 transition ${open ? "rotate-90" : ""}`}
          >
            ›
          </span>
        )}
      </button>
      {(open || hideArrow) && children && (
        <div className="border-t border-[#EEF1F5] px-3 pb-3 pt-2">
          {children}
        </div>
      )}
    </div>
  );
}
