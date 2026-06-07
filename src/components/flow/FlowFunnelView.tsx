"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FunnelStack } from "@/components/flow/FunnelStack";
import { TrackLoopbackPanel } from "@/components/flow/TrackLoopbackPanel";
import { ExportExcelButton } from "@/components/shared/ExportExcelButton";
import {
  buildFullFunnelAnalytics,
  fullFunnelToExportRows,
} from "@/lib/flow/funnel-analytics";
import type { FullFunnelAnalytics } from "@/lib/flow/types";
import { cn } from "@/lib/utils";

const STAGE_COLORS: Record<string, string> = {
  inbox: "#64748B",
  thinking: "#8B5CF6",
  decisions: "#3B82F6",
  goals: "#10B981",
  track: "#F59E0B",
};

/** 主漏斗轮廓：每层顶宽 = 上一层底宽 */
const MAIN_FUNNEL_BOUNDS = [100, 78, 58, 40, 22];

type Props = {
  className?: string;
  showExport?: boolean;
  compact?: boolean;
};

export function FlowFunnelView({
  className,
  showExport = true,
  compact = false,
}: Props) {
  const [data, setData] = useState<FullFunnelAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setData(await buildFullFunnelAnalytics());
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const maxCell = useMemo(() => {
    if (!data) return 1;
    return Math.max(
      1,
      ...data.jumpMatrix.cells.flat(),
      ...data.entryInsights.map((e) => e.total)
    );
  }, [data]);

  if (loading && !data) {
    return (
      <div className={cn("py-6 text-center text-xs text-slate-400", className)}>
        加载中…
      </div>
    );
  }

  if (!data) return null;

  const { jumpMatrix, linear, entryInsights, topEntry, trackLoopback } = data;

  const mainTiers = linear.map((step, idx) => ({
    id: step.stage,
    label: step.label,
    count: step.count,
    color: STAGE_COLORS[step.stage],
    href: step.href,
    seamLoss:
      idx > 0
        ? {
            fromLabel:
              data.deep.stageLeaks[idx - 1]?.fromLabel ??
              linear[idx - 1]?.label ??
              "",
            toLabel:
              data.deep.stageLeaks[idx - 1]?.toLabel ?? step.label,
            lossRate: data.deep.stageLeaks[idx - 1]?.lossRate ?? 0,
            dropped: data.deep.stageLeaks[idx - 1]?.dropped ?? 0,
          }
        : undefined,
  }));

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        {topEntry && (
          <p className="text-[10px] text-slate-600">
            <span className="font-medium text-[#1D4ED8]">
              跳入最多：{topEntry.label}
            </span>
            <span className="ml-1.5 text-slate-400">({topEntry.total})</span>
            {topEntry.biggestLeak && (
              <span className="ml-2 text-amber-700">
                最大漏损：{topEntry.biggestLeak.fromLabel}→
                {topEntry.biggestLeak.toLabel} 流失
                {topEntry.biggestLeak.drop}
              </span>
            )}
          </p>
        )}
        {showExport && (
          <ExportExcelButton
            rows={fullFunnelToExportRows(data)}
            fileName="flow-funnel.xlsx"
            sheetName="流程漏斗"
            label="导出"
          />
        )}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="rounded-lg border border-[#E2E8F0] bg-white p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-slate-600">主漏斗</p>
            <Link
              href="/inbox"
              className="rounded-full bg-[#F1F5F9] px-2.5 py-1 text-[10px] font-medium text-slate-600 ring-1 ring-[#E2E8F0] hover:bg-[#E2E8F0]"
            >
              收集箱待处理{" "}
              <span className="tabular-nums text-[#1D4ED8]">
                {data.inboxPending}
              </span>
            </Link>
          </div>
          <p className="text-[10px] text-slate-400">思考 → 决策 → 目标 → 追踪</p>

          <div className="mt-3">
            <FunnelStack
              tiers={mainTiers}
              widthBounds={MAIN_FUNNEL_BOUNDS}
              layerHeight={compact ? 50 : 76}
              size="main"
            />
          </div>
        </section>

        <section className="rounded-lg border border-[#E2E8F0] bg-white p-2.5">
          <p className="text-[10px] font-medium text-slate-600">跳入矩阵</p>
          <p className="text-[9px] text-slate-400">
            纵=到达阶段 · 横=跳入入口（不含收集箱）
          </p>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full border-collapse text-[9px]">
              <thead>
                <tr>
                  <th className="border border-[#EEF1F5] bg-[#FAFBFC] px-1.5 py-1 text-left text-slate-500" />
                  {jumpMatrix.columns.map((col, colIdx) => {
                    const isTop = topEntry?.entryStage === col.stage;
                    return (
                      <th
                        key={col.stage}
                        className={cn(
                          "border border-[#EEF1F5] px-1 py-1 text-center font-medium",
                          isTop
                            ? "bg-[#EFF6FF] text-[#1D4ED8]"
                            : "bg-[#FAFBFC] text-slate-500"
                        )}
                      >
                        <span className="block leading-tight">
                          {col.label.replace("从", "").replace("跳入", "")}
                        </span>
                        <span className="text-[8px] font-bold tabular-nums">
                          {jumpMatrix.columnTotals[colIdx]}
                          {isTop && " ↑"}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {jumpMatrix.rows.map((row, rowIdx) => (
                  <tr key={row.stage}>
                    <td className="border border-[#EEF1F5] px-1.5 py-1 font-medium text-slate-600">
                      {row.label}
                    </td>
                    {jumpMatrix.columns.map((col, colIdx) => {
                      const n = jumpMatrix.cells[rowIdx][colIdx];
                      const total = jumpMatrix.columnTotals[colIdx];
                      const pct =
                        total > 0 ? Math.round((n / total) * 100) : 0;
                      const dim =
                        stageIndex(row.stage) < stageIndex(col.stage);
                      const heat = n / maxCell;
                      return (
                        <td
                          key={col.stage}
                          className={cn(
                            "border border-[#EEF1F5] px-1 py-1 text-center tabular-nums",
                            dim && "bg-[#FAFBFC] text-slate-300"
                          )}
                          style={
                            !dim && n > 0
                              ? {
                                  backgroundColor: `rgba(59, 130, 246, ${0.08 + heat * 0.35})`,
                                }
                              : undefined
                          }
                        >
                          {dim ? (
                            "—"
                          ) : (
                            <span
                              className={cn(
                                n > 0 && "font-semibold text-[#1E40AF]"
                              )}
                            >
                              {n}
                              {total > 0 && (
                                <span className="ml-0.5 text-[8px] font-normal text-slate-400">
                                  {pct}%
                                </span>
                              )}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <TrackLoopbackPanel data={trackLoopback} compact={compact} />

      {entryInsights.length > 0 && (
        <section className="rounded-lg border border-[#E2E8F0] bg-white p-3">
          <p className="text-xs font-medium text-slate-600">各入口下漏对比</p>
          <div className="mt-3 flex flex-wrap justify-center gap-4">
            {entryInsights.map((insight, rank) => {
              const colIdx = jumpMatrix.columns.findIndex(
                (c) => c.stage === insight.entryStage
              );
              if (colIdx < 0) return null;
              const funnel = jumpMatrix.columnFunnels[colIdx].filter(
                (f) => stageIndex(f.stage) >= stageIndex(insight.entryStage)
              );
              const tierCount = funnel.length;
              const miniBounds = buildMiniBounds(tierCount);

              const miniTiers = funnel.map((f) => ({
                id: f.stage,
                label: f.label,
                count: f.count,
                color: STAGE_COLORS[f.stage],
              }));

              return (
                <div
                  key={insight.entryStage}
                  className={cn(
                    "rounded-lg border px-2 pb-2 pt-1.5",
                    rank === 0
                      ? "border-[#93C5FD] bg-[#EFF6FF]/40 ring-1 ring-[#BFDBFE]"
                      : "border-[#EEF1F5] bg-[#FAFBFC]"
                  )}
                >
                  <p className="text-center text-[10px] font-medium text-slate-700">
                    {rank === 0 && (
                      <span className="mr-0.5 text-[#1D4ED8]">▲</span>
                    )}
                    {insight.label.replace("从", "").replace("跳入", "")}
                    <span className="ml-1 font-bold tabular-nums">
                      {insight.total}
                    </span>
                  </p>
                  <FunnelStack
                    tiers={miniTiers}
                    widthBounds={miniBounds}
                    layerHeight={24}
                    size="mini"
                    className="mt-1"
                  />
                  {insight.biggestLeak && (
                    <p className="mt-1.5 text-center text-[9px] text-amber-700">
                      漏最多 {insight.biggestLeak.fromLabel}→
                      {insight.biggestLeak.toLabel} −
                      {insight.biggestLeak.drop}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function buildMiniBounds(tierCount: number): number[] {
  const all = [100, 78, 56, 34, 16];
  return all.slice(0, tierCount + 1);
}

function stageIndex(stage: string): number {
  const order = ["inbox", "thinking", "decisions", "goals", "track"];
  return order.indexOf(stage);
}
