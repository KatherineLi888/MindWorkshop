"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FunnelStack } from "@/components/flow/FunnelStack";
import { appendReturnTo } from "@/lib/navigation/return-to";
import {
  buildFullFunnelAnalytics,
} from "@/lib/flow/funnel-analytics";
import type { FullFunnelAnalytics } from "@/lib/flow/types";
import { cn } from "@/lib/utils";

const STAGE_COLORS: Record<string, string> = {
  thinking: "#8B5CF6",
  decisions: "#3B82F6",
  goals: "#10B981",
  track: "#F59E0B",
};

const MAIN_FUNNEL_BOUNDS = [100, 78, 58, 40, 22];

type Props = {
  className?: string;
  compact?: boolean;
};

/** 仪表盘专用：主漏斗 + 跳入矩阵，点击跳转详情页 */
export function DashboardFunnelPanel({ className, compact = true }: Props) {
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
    return Math.max(1, ...data.jumpMatrix.cells.flat());
  }, [data]);

  const detailHref = appendReturnTo("/home/funnel", "/stats");

  if (loading && !data) {
    return (
      <div className={cn("py-8 text-center text-xs text-slate-400", className)}>
        加载流程数据…
      </div>
    );
  }

  if (!data) return null;

  const { jumpMatrix, linear } = data;
  const mainTiers = linear.map((step) => ({
    id: step.stage,
    label: step.label,
    count: step.count,
    color: STAGE_COLORS[step.stage],
    href: step.href,
  }));

  return (
    <Link
      href={detailHref}
      className={cn(
        "group block rounded-xl border border-[#E8ECF0] bg-white p-4 shadow-sm transition",
        "hover:border-[#CBD5E1] hover:shadow-md",
        className
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-slate-700">流程漏斗 · 跳入矩阵</p>
        <span className="text-[10px] text-[#3B82F6] opacity-0 transition group-hover:opacity-100">
          查看详情 →
        </span>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="rounded-lg border border-[#EEF1F5] bg-[#FAFBFC] p-3">
          <p className="text-[10px] font-medium text-slate-600">主漏斗</p>
          <p className="text-[9px] text-slate-400">思考 → 决策 → 目标 → 追踪</p>
          <div className="mt-2 pointer-events-none">
            <FunnelStack
              tiers={mainTiers}
              widthBounds={MAIN_FUNNEL_BOUNDS}
              layerHeight={compact ? 44 : 64}
              size="main"
            />
          </div>
        </section>

        <section className="rounded-lg border border-[#EEF1F5] bg-[#FAFBFC] p-2.5">
          <p className="text-[10px] font-medium text-slate-600">跳入矩阵</p>
          <div className="mt-2 overflow-x-auto pointer-events-none">
            <table className="w-full border-collapse text-[9px]">
              <thead>
                <tr>
                  <th className="border border-[#EEF1F5] bg-white px-1 py-1" />
                  {jumpMatrix.columns.map((col) => (
                    <th
                      key={col.stage}
                      className="border border-[#EEF1F5] bg-white px-1 py-1 text-center text-slate-500"
                    >
                      {col.label.replace("从", "").replace("跳入", "")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {jumpMatrix.rows.map((row, rowIdx) => (
                  <tr key={row.stage}>
                    <td className="border border-[#EEF1F5] px-1 py-1 font-medium text-slate-600">
                      {row.label}
                    </td>
                    {jumpMatrix.columns.map((col, colIdx) => {
                      const n = jumpMatrix.cells[rowIdx][colIdx];
                      const dim =
                        stageIndex(row.stage) < stageIndex(col.stage);
                      const heat = n / maxCell;
                      return (
                        <td
                          key={col.stage}
                          className={cn(
                            "border border-[#EEF1F5] px-1 py-1 text-center tabular-nums",
                            dim && "text-slate-300"
                          )}
                          style={
                            !dim && n > 0
                              ? {
                                  backgroundColor: `rgba(59, 130, 246, ${0.08 + heat * 0.35})`,
                                }
                              : undefined
                          }
                        >
                          {dim ? "—" : n}
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
    </Link>
  );
}

function stageIndex(stage: string): number {
  return ["inbox", "thinking", "decisions", "goals", "track"].indexOf(stage);
}
