"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SeedsWidget } from "@/components/seeds/SeedsWidget";
import { Card } from "@/components/ui/card";
import {
  KPI_META,
  type KpiKey,
  type WidgetInstance,
  type WidgetStyle,
} from "@/lib/stats/dashboard-config";
import type { DashboardStats } from "@/lib/stats/aggregate";
import type { WidgetViewData } from "@/lib/stats/widget-query";
import { formatDate } from "@/lib/utils";

const MODULE_DOT: Record<string, string> = {
  decision: "bg-blue-500",
  goal: "bg-emerald-500",
  thinking: "bg-violet-500",
  model: "bg-amber-500",
  canvas: "bg-cyan-500",
};

function EmptyChart({ text }: { text: string }) {
  return (
    <div className="flex h-full min-h-[8rem] items-center justify-center text-xs text-slate-400">
      {text}
    </div>
  );
}

function SectionTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
      {hint && <p className="mt-0.5 text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
}

function KpiCell({
  href,
  interactive,
  className,
  children,
}: {
  href: string;
  interactive: boolean;
  className: string;
  children: ReactNode;
}) {
  if (interactive) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  return <div className={className}>{children}</div>;
}

export function KpiStrip({
  stats,
  keys,
  style,
  interactive = true,
  values,
  dense = false,
}: {
  stats?: DashboardStats;
  keys: KpiKey[];
  style: WidgetStyle;
  interactive?: boolean;
  values?: Partial<Record<KpiKey, number>>;
  dense?: boolean;
}) {
  const items = keys.filter((k) => KPI_META[k]);
  if (!items.length) return null;

  if (dense && items.length >= 1) {
    const key = items[0];
    const meta = KPI_META[key];
    const val = values?.[key] ?? stats?.kpis[key] ?? 0;
    return (
      <KpiCell
        href={meta.href}
        interactive={interactive}
        className={`flex h-full flex-col items-center justify-center rounded-xl border border-[#E2E8F0] ${meta.bg} p-2 text-center transition hover:shadow-sm`}
      >
        <span className="text-xl">{meta.icon}</span>
        <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
          {val}
        </p>
        <p className="mt-0.5 line-clamp-2 text-[10px] leading-tight text-slate-500">
          {meta.label}
        </p>
      </KpiCell>
    );
  }

  if (style === "compact") {
    return (
      <div className="flex flex-wrap gap-2">
        {items.map((key) => {
          const meta = KPI_META[key];
          return (
            <KpiCell
              key={key}
              href={meta.href}
              interactive={interactive}
              className="flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs hover:bg-slate-50"
            >
              <span>{meta.icon}</span>
              <span className="text-slate-500">{meta.label}</span>
              <span className="font-semibold tabular-nums text-slate-900">
                {values?.[key] ?? stats?.kpis[key] ?? 0}
              </span>
            </KpiCell>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={`grid gap-3 ${
        items.length <= 4
          ? "grid-cols-2 sm:grid-cols-4"
          : "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4"
      }`}
    >
      {items.map((key) => {
        const meta = KPI_META[key];
        return (
          <KpiCell
            key={key}
            href={meta.href}
            interactive={interactive}
            className={`rounded-xl border border-[#E2E8F0] border-l-4 ${meta.accent} ${meta.bg} p-3 transition hover:shadow-sm`}
          >
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <span>{meta.icon}</span>
              <span className="truncate">{meta.label}</span>
            </div>
            <p className="mt-1.5 text-2xl font-semibold tabular-nums text-slate-900">
              {values?.[key] ?? stats?.kpis[key] ?? 0}
            </p>
          </KpiCell>
        );
      })}
    </div>
  );
}

export function DecisionsWidget({
  stats,
  style,
  decisionSource: srcProp,
  decisionOutcome: outProp,
  title = "决策分布",
  compactPreview,
  dense = false,
}: {
  stats?: DashboardStats;
  style: WidgetStyle;
  decisionSource?: WidgetViewData["decisionSource"];
  decisionOutcome?: WidgetViewData["decisionOutcome"];
  title?: string;
  compactPreview?: boolean;
  dense?: boolean;
}) {
  const decisionSource = srcProp ?? stats?.decisionSource ?? [];
  const decisionOutcome = outProp ?? stats?.decisionOutcome ?? [];
  const total = decisionSource.reduce((s, d) => s + d.value, 0);
  const allPoints = [...decisionSource, ...decisionOutcome];

  if (dense) {
    return (
      <Card className="flex h-full flex-col items-center justify-center bg-white p-2 text-center">
        <span className="text-xl">⚖️</span>
        <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
          {total}
        </p>
        <p className="mt-0.5 line-clamp-2 text-[10px] text-slate-500">
          {title}
        </p>
      </Card>
    );
  }

  return (
    <Card className={`flex h-full flex-col bg-white ${compactPreview ? "p-2" : ""}`}>
      <SectionTitle title={title} hint={compactPreview ? undefined : "未归档决策"} />
      {total === 0 ? (
        <EmptyChart text="暂无决策数据" />
      ) : style === "list" ? (
        <ul className="space-y-2">
          {allPoints.map((d) => (
            <li key={d.name} className="flex justify-between text-sm">
              <span className="text-slate-600">{d.name}</span>
              <span className="font-medium tabular-nums">{d.value}</span>
            </li>
          ))}
        </ul>
      ) : style === "chart" ? (
        <div className="flex min-h-[10rem] flex-1 items-center justify-center">
          <div className="h-44 w-full max-w-xs">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={decisionSource}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={64}
                  paddingAngle={3}
                >
                  {decisionSource.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="grid flex-1 gap-4 sm:grid-cols-2">
          <div className="flex min-h-[10rem] items-center justify-center">
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                        data={decisionSource}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={32}
                  outerRadius={52}
                  paddingAngle={3}
                >
                        {decisionSource.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            </div>
          </div>
          <div className="space-y-3 text-sm">
            {allPoints.map((d) => (
              <div key={d.name} className="flex justify-between">
                <span className="flex items-center gap-2 text-slate-600">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: d.fill }}
                  />
                  {d.name}
                </span>
                <span className="font-medium tabular-nums">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function GoalProgressBar({
  progress,
  style,
}: {
  progress: number;
  style: WidgetStyle;
}) {
  const pct = Math.min(Math.max(progress, 0), 100);

  if (style === "bar_slim") {
    return (
      <div className="h-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-slate-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    );
  }

  if (style === "bar_bold") {
    return (
      <div className="h-3.5 overflow-hidden rounded-lg bg-slate-100">
        <div
          className="h-full rounded-lg bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400"
          style={{ width: `${pct}%` }}
        />
      </div>
    );
  }

  if (style === "bar_inline") {
    return (
      <div className="relative h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-emerald-500"
          style={{ width: `${pct}%` }}
        />
        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-semibold tabular-nums text-slate-700">
          {pct}%
        </span>
      </div>
    );
  }

  if (style === "bar_steps") {
    return (
      <div className="relative">
        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-amber-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="pointer-events-none absolute inset-0 flex justify-between px-[2%]">
          {[25, 50, 75].map((tick) => (
            <span
              key={tick}
              className="h-2.5 w-px bg-white/90"
              style={{ opacity: pct >= tick ? 1 : 0.35 }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (style === "bar_glow") {
    return (
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.65)]"
          style={{ width: `${pct}%` }}
        />
      </div>
    );
  }

  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
      <div
        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function GoalsProgressWidget({
  stats,
  style,
  rows: rowsProp,
  title = "目标进度",
  compactPreview,
}: {
  stats?: DashboardStats;
  style: WidgetStyle;
  rows?: WidgetViewData["goalProgress"];
  title?: string;
  compactPreview?: boolean;
}) {
  const barStyle =
    style === "compact" || style === "list" ? "default" : style;
  const rows = rowsProp ?? stats?.goalProgress ?? [];

  return (
    <Card className={`flex h-full flex-col bg-white ${compactPreview ? "p-2" : ""}`}>
      <SectionTitle title={title} hint={compactPreview ? undefined : "按筛选条件展示"} />
      {rows.length === 0 ? (
        <EmptyChart text="暂无目标" />
      ) : (
        <ul className="space-y-3">
          {rows.map((g) => (
            <li key={g.id}>
              <div className="mb-1 flex justify-between gap-2 text-xs">
                <span className="truncate font-medium text-slate-700">
                  {g.name}
                </span>
                {barStyle !== "bar_inline" && (
                  <span className="shrink-0 tabular-nums text-slate-500">
                    {g.progress}%
                  </span>
                )}
              </div>
              <GoalProgressBar progress={g.progress} style={barStyle} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function GoalsTypesWidget({
  stats,
  style,
  goalTypeDist: distProp,
  title = "目标类型",
}: {
  stats?: DashboardStats;
  style: WidgetStyle;
  goalTypeDist?: WidgetViewData["goalTypeDist"];
  title?: string;
}) {
  const goalTypeDist = distProp ?? stats?.goalTypeDist ?? [];
  const total = goalTypeDist.reduce((s, g) => s + g.value, 0);

  return (
    <Card className="flex h-full flex-col bg-white">
      <SectionTitle title={title} />
      {total === 0 ? (
        <EmptyChart text="暂无目标" />
      ) : style === "pie" ? (
        <div className="flex min-h-[9rem] flex-1 items-center justify-center">
          <div className="h-36 w-full max-w-[12rem]">
            <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={goalTypeDist.filter((g) => g.value > 0)}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={52}
              >
                {goalTypeDist.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          </div>
        </div>
      ) : style === "list" ? (
        <ul className="space-y-2 text-sm">
          {goalTypeDist.map((g) => (
            <li key={g.name} className="flex justify-between">
              <span className="text-slate-600">{g.name}</span>
              <span className="font-medium tabular-nums">{g.value}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-1 flex-wrap content-start gap-2">
          {goalTypeDist.map((g) => (
            <div
              key={g.name}
              className="flex min-w-[5rem] flex-1 flex-col rounded-lg border border-[#EEF1F5] bg-[#F8FAFC] px-3 py-2"
            >
              <span className="text-[10px] text-slate-400">{g.name}</span>
              <span
                className="text-lg font-semibold tabular-nums"
                style={{ color: g.fill }}
              >
                {g.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export function ActivityWidget({
  stats,
  style,
  activityTrend: trendProp,
  title = "创作节奏",
}: {
  stats?: DashboardStats;
  style: WidgetStyle;
  activityTrend?: DashboardStats["activityTrend"];
  title?: string;
}) {
  const activityTrend = trendProp ?? stats?.activityTrend ?? [];
  if (style === "compact") {
    const max = Math.max(...activityTrend.map((d) => d.count), 1);
    return (
      <Card className="flex h-full flex-col bg-white">
        <SectionTitle title={title} hint="每日新增/更新条目数" />
        <div className="flex items-end gap-1.5 h-20">
          {activityTrend.map((d) => (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-blue-400/80"
                style={{
                  height: `${Math.max((d.count / max) * 100, 4)}%`,
                  minHeight: d.count > 0 ? "8px" : "2px",
                }}
              />
              <span className="text-[9px] text-slate-400">{d.date}</span>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex h-full flex-col bg-white">
      <SectionTitle title={title} hint="跨模块合计" />
      <div className="min-h-[10rem] flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={activityTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "#64748B" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "#64748B" }}
              axisLine={false}
              tickLine={false}
              width={28}
            />
            <Tooltip />
            <Bar
              dataKey="count"
              name="条目"
              fill="#3B82F6"
              radius={[6, 6, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function ModulesWidget({
  stats,
  style,
  moduleUsage: usageProp,
  title = "模块存量",
}: {
  stats?: DashboardStats;
  style: WidgetStyle;
  moduleUsage?: WidgetViewData["moduleUsage"];
  title?: string;
}) {
  const moduleUsage = usageProp ?? stats?.moduleUsage ?? [];
  return (
    <Card className="flex h-full flex-col bg-white">
      <SectionTitle title={title} hint="各板块内容规模" />
      {moduleUsage.length === 0 ? (
        <EmptyChart text="暂无数据" />
      ) : style === "cards" ? (
        <div className="flex flex-wrap gap-2">
          {moduleUsage.map((m) => (
            <div
              key={m.name}
              className="rounded-lg border border-[#EEF1F5] bg-[#F8FAFC] px-3 py-2"
            >
              <span className="text-[10px] text-slate-400">{m.name}</span>
              <p
                className="text-lg font-semibold tabular-nums"
                style={{ color: m.fill }}
              >
                {m.value}
              </p>
            </div>
          ))}
        </div>
      ) : style === "list" ? (
        <ul className="space-y-2 text-sm">
          {moduleUsage.map((m) => (
            <li key={m.name} className="flex justify-between">
              <span className="text-slate-600">{m.name}</span>
              <span className="font-medium tabular-nums">{m.value}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="min-h-[10rem] flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={moduleUsage}
              layout="vertical"
              margin={{ left: 4, right: 8 }}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                width={40}
                tick={{ fontSize: 11, fill: "#64748B" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={18}>
                      {moduleUsage.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

export function RecentWidget({
  stats,
  style,
  interactive = true,
  recentActivity: itemsProp,
  title = "最近动态",
}: {
  stats?: DashboardStats;
  style: WidgetStyle;
  interactive?: boolean;
  recentActivity?: WidgetViewData["recentActivity"];
  title?: string;
}) {
  const limit = style === "compact" ? 5 : 8;
  const items = (itemsProp ?? stats?.recentActivity ?? []).slice(0, limit);

  return (
    <Card className="flex h-full flex-col bg-white">
      <div className="mb-3 flex items-center justify-between">
        <SectionTitle title={title} hint="点击跳转对应模块" />
        {interactive ? (
          <Link href="/inbox" className="text-xs text-blue-500 hover:underline">
            收集箱 →
          </Link>
        ) : (
          <span className="text-xs text-slate-400">收集箱</span>
        )}
      </div>
      {items.length === 0 ? (
        <EmptyChart text="还没有活动记录" />
      ) : (
        <ul className="divide-y divide-[#EEF1F5]">
          {items.map((item) => (
            <li key={item.id}>
              {interactive ? (
                <Link
                  href={item.href}
                  className="flex items-center gap-3 py-2.5 transition hover:bg-slate-50/80"
                >
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${MODULE_DOT[item.module] ?? "bg-slate-300"}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {item.moduleLabel} · {formatDate(item.time)}
                    </p>
                  </div>
                  <span className="text-xs text-slate-300">→</span>
                </Link>
              ) : (
                <div className="flex items-center gap-3 py-2.5">
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${MODULE_DOT[item.module] ?? "bg-slate-300"}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {item.moduleLabel} · {formatDate(item.time)}
                    </p>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function renderWidgetView(
  instance: WidgetInstance,
  view: WidgetViewData,
  options?: { interactive?: boolean; compact?: boolean; dense?: boolean }
): ReactNode {
  const interactive = options?.interactive ?? true;
  const compact = options?.compact ?? false;
  const dense = options?.dense ?? instance.size === "1x1";
  const style = instance.style;

  switch (instance.type) {
    case "kpi":
      return (
        <KpiStrip
          keys={view.kpiKeys ?? []}
          values={view.kpiValues}
          style={style}
          interactive={interactive}
          dense={dense}
        />
      );
    case "decisions":
      return (
        <DecisionsWidget
          style={style}
          title={view.title}
          decisionSource={view.decisionSource}
          decisionOutcome={view.decisionOutcome}
          compactPreview={compact}
          dense={dense}
        />
      );
    case "goals_progress":
      return (
        <GoalsProgressWidget
          style={style}
          title={view.title}
          rows={view.goalProgress}
          compactPreview={compact}
        />
      );
    case "goals_types":
      return (
        <GoalsTypesWidget
          style={style}
          title={view.title}
          goalTypeDist={view.goalTypeDist}
        />
      );
    case "activity":
      return (
        <ActivityWidget
          style={style}
          title={view.title}
          activityTrend={view.activityTrend}
        />
      );
    case "modules":
      return (
        <ModulesWidget
          style={style}
          title={view.title}
          moduleUsage={view.moduleUsage}
        />
      );
    case "recent":
      return (
        <RecentWidget
          style={style}
          title={view.title}
          recentActivity={view.recentActivity}
          interactive={interactive}
        />
      );
    case "seeds":
      return (
        <SeedsWidget
          title={view.title}
          summary={
            view.seeds ?? {
              sprouting: 0,
              growing: 0,
              archived: 0,
              spotlight: [],
              recent: [],
            }
          }
          compact={compact || style === "compact"}
        />
      );
    default:
      return null;
  }
}
