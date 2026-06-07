"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { FLOW_STAGE_HREFS } from "@/lib/flow/types";
import type { TrackLoopbackData } from "@/lib/flow/types";

const STAGE_COLORS: Record<string, string> = {
  thinking: "#8B5CF6",
  decisions: "#3B82F6",
  goals: "#10B981",
};

type Props = {
  data: TrackLoopbackData;
  compact?: boolean;
};

export function TrackLoopbackPanel({ data, compact }: Props) {
  const maxCount = Math.max(1, ...data.steps.map((s) => s.count));

  return (
    <section className="rounded-lg border border-[#E2E8F0] bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-slate-600">追踪回转</p>
        <span className="rounded-full bg-[#F1F5F9] px-2 py-0.5 text-[10px] tabular-nums text-slate-600 ring-1 ring-[#E2E8F0]">
          追踪存量 {data.trackTotal}
        </span>
      </div>
      <p className="text-[10px] text-slate-400">
        推进遇阻或需再收敛时，从追踪跳回思考 / 决策 / 目标
      </p>

      <div className={cn("mt-3 space-y-2", compact && "space-y-1.5")}>
        <div className="flex items-center gap-2">
          <span
            className="shrink-0 rounded px-2 py-1 text-[10px] font-semibold text-white"
            style={{ backgroundColor: "#F59E0B" }}
          >
            追踪
          </span>
          <span className="text-lg font-bold tabular-nums text-slate-800">
            {data.trackTotal}
          </span>
          {data.loopbackTotal > 0 && (
            <span className="text-[10px] text-violet-700">
              已回转 {data.loopbackTotal} 次
            </span>
          )}
        </div>

        {data.steps.map((step) => {
          const widthPct = Math.max(8, (step.count / maxCount) * 100);
          return (
            <div key={step.toStage} className="relative flex items-center gap-2">
              <span className="w-12 shrink-0 text-[9px] text-slate-400">回转</span>
              <div className="relative min-w-0 flex-1">
                <div
                  className="h-1 rounded-full bg-slate-100"
                  aria-hidden
                />
                <div
                  className="absolute left-0 top-0 h-1 rounded-full transition-all"
                  style={{
                    width: `${widthPct}%`,
                    backgroundColor: STAGE_COLORS[step.toStage],
                  }}
                  aria-hidden
                />
                <span
                  className="pointer-events-none absolute left-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full ring-2 ring-white"
                  style={{
                    left: `calc(${widthPct}% - 3px)`,
                    backgroundColor: STAGE_COLORS[step.toStage],
                  }}
                  aria-hidden
                />
              </div>
              <Link
                href={FLOW_STAGE_HREFS[step.toStage]}
                className="flex w-28 shrink-0 items-center justify-end gap-1.5 text-right"
              >
                <span className="text-[10px] font-medium text-slate-700">
                  {step.label}
                </span>
                <span className="text-sm font-bold tabular-nums text-slate-800">
                  {step.count}
                </span>
                {data.trackTotal > 0 && (
                  <span className="text-[9px] tabular-nums text-slate-400">
                    {step.rate}%
                  </span>
                )}
              </Link>
            </div>
          );
        })}

        {data.trackTotal === 0 && (
          <p className="py-2 text-center text-[10px] text-slate-400">
            暂无追踪记录
          </p>
        )}
      </div>
    </section>
  );
}
