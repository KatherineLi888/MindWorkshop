"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { buildFullFunnelAnalytics } from "@/lib/flow/funnel-analytics";
import type { FullFunnelAnalytics } from "@/lib/flow/types";
import { cn } from "@/lib/utils";

export function FlowFunnelAnalyticsPanel() {
  const [data, setData] = useState<FullFunnelAnalytics | null>(null);

  const refresh = useCallback(async () => {
    setData(await buildFullFunnelAnalytics());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!data) {
    return (
      <p className="py-8 text-center text-sm text-slate-400">加载分析数据…</p>
    );
  }

  const { deep, inboxPending } = data;
  const maxLoss = Math.max(...deep.stageLeaks.map((l) => l.lossRate), 1);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-800">数据分析</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          哪个环节漏得最厉害、哪里需要加强、各阶段流失率与入口使用偏好
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {deep.worstLeak && (
          <Card className="border-amber-200 bg-amber-50/60 p-3">
            <p className="text-[10px] font-medium uppercase tracking-wide text-amber-800">
              漏损最严重
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {deep.worstLeak.fromLabel} → {deep.worstLeak.toLabel}
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-amber-700">
              {deep.worstLeak.lossRate}%
              <span className="ml-1 text-xs font-normal text-amber-600">
                流失
              </span>
            </p>
            <p className="mt-0.5 text-[11px] text-amber-800/80">
              {deep.worstLeak.dropped} 条未进入「{deep.worstLeak.toLabel}」
            </p>
          </Card>
        )}

        {deep.strengthenAt && (
          <Card className="border-[#BFDBFE] bg-[#EFF6FF]/50 p-3">
            <p className="text-[10px] font-medium uppercase tracking-wide text-[#1D4ED8]">
              建议加强
            </p>
            <Link
              href={deep.strengthenAt.href}
              className="mt-1 block text-sm font-semibold text-[#1D4ED8] hover:underline"
            >
              {deep.strengthenAt.label}
            </Link>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-600">
              {deep.strengthenAt.hint}
            </p>
          </Card>
        )}

        {deep.mostUsedEntry && (
          <Card className="bg-white p-3">
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
              最常用入口
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {deep.mostUsedEntry.label}
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-[#1D4ED8]">
              {deep.mostUsedEntry.total}
              <span className="ml-1 text-xs font-normal text-slate-400">
                次跳入
              </span>
            </p>
          </Card>
        )}

        {deep.leastUsedEntry && (
          <Card className="bg-white p-3">
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
              最少用入口
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {deep.leastUsedEntry.label}
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-600">
              {deep.leastUsedEntry.total}
              <span className="ml-1 text-xs font-normal text-slate-400">
                次跳入
              </span>
            </p>
          </Card>
        )}
      </div>

      <Card className="bg-white p-4">
        <p className="text-xs font-medium text-slate-700">各阶段流失率</p>
        <p className="mt-0.5 text-[10px] text-slate-400">
          主漏斗严格链路：相邻阶段之间的留存与流失
        </p>
        <ul className="mt-3 space-y-2">
          {deep.stageLeaks.map((leak) => {
            const isWorst =
              deep.worstLeak?.fromStage === leak.fromStage &&
              deep.worstLeak?.toStage === leak.toStage;
            return (
              <li
                key={`${leak.fromStage}-${leak.toStage}`}
                className={cn(
                  "rounded-lg border px-3 py-2",
                  isWorst
                    ? "border-amber-200 bg-amber-50/40"
                    : "border-[#EEF1F5] bg-[#FAFBFC]"
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-medium text-slate-700">
                    {leak.fromLabel} → {leak.toLabel}
                    {isWorst && (
                      <span className="ml-1.5 text-[10px] text-amber-700">
                        漏损最高
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] tabular-nums text-slate-500">
                    {leak.entered} 入 · {leak.progressed} 过 · {leak.dropped} 漏
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#E2E8F0]">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{
                        width: `${leak.retainRate}%`,
                      }}
                    />
                  </div>
                  <span className="w-20 shrink-0 text-right text-[10px] tabular-nums">
                    <span className="text-emerald-600">
                      留存 {leak.retainRate}%
                    </span>
                    <span className="mx-0.5 text-slate-300">/</span>
                    <span
                      className={cn(
                        leak.lossRate >= maxLoss * 0.8 && leak.lossRate > 0
                          ? "font-medium text-amber-700"
                          : "text-slate-500"
                      )}
                    >
                      流失 {leak.lossRate}%
                    </span>
                  </span>
                </div>
              </li>
            );
          })}
          {deep.stageLeaks.length === 0 && (
            <p className="text-center text-xs text-slate-400">
              暂无阶段跳转数据，完成一次模块间「跳入」后会出现
            </p>
          )}
        </ul>
      </Card>

      {inboxPending > 0 && (
        <Card className="border-[#E2E8F0] bg-[#FAFBFC] p-3">
          <p className="text-[11px] text-slate-600">
            收集箱另有{" "}
            <Link href="/inbox" className="font-semibold text-[#1D4ED8]">
              {inboxPending} 条待处理
            </Link>
            ，尚未跳入下游。处理后可改善漏斗入口流量。
          </p>
        </Card>
      )}
    </section>
  );
}
