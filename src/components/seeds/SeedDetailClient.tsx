"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  seedBoardMeta,
  SEED_PHASE_LABELS,
  distinctStages,
  isGoalPlanSeed,
  GOAL_PLAN_SEED_MARKER,
} from "@/lib/seeds/classify";
import { buildEventSummary } from "@/lib/seeds/event-summary";
import { seedStageLabel, SEED_ACTION_LABELS } from "@/lib/seeds/labels";
import { seedEntityHref } from "@/lib/seeds/resolve-href";
import type { IdeaSeed } from "@/lib/seeds/types";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const STAGE_DOT: Record<string, string> = {
  inbox: "bg-slate-400",
  thinking: "bg-violet-500",
  decisions: "bg-blue-500",
  goals: "bg-emerald-500",
  track: "bg-amber-500",
  review: "bg-cyan-500",
  home: "bg-rose-400",
  model: "bg-fuchsia-500",
  theory: "bg-violet-400",
  canvas: "bg-teal-500",
};

export function SeedDetailClient({ seed }: { seed: IdeaSeed }) {
  const router = useRouter();
  const meta = seedBoardMeta(seed);
  const stages = distinctStages(seed);
  const goalPlan = isGoalPlanSeed(seed);

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <Button variant="ghost" size="sm" onClick={() => router.push("/seeds")}>
        ← 返回种子看板
      </Button>

      <Card className="bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold text-slate-900">{seed.title}</h1>
            <p className="mt-1 text-xs text-slate-500">
              诞生于 {formatDate(seed.createdAt)} · 最近更新{" "}
              {formatDate(seed.updatedAt)}
            </p>
          </div>
          <div className="text-right">
            <span
              className={cn(
                "inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ring-1",
                meta.phase === "sprouting" && "bg-lime-50 text-lime-800 ring-lime-200",
                meta.phase === "growing" &&
                  "bg-emerald-50 text-emerald-700 ring-emerald-200",
                meta.phase === "archived" &&
                  "bg-slate-100 text-slate-500 ring-slate-200"
              )}
            >
              {SEED_PHASE_LABELS[meta.phase]}
            </span>
            <p className="mt-1 text-[10px] tabular-nums text-slate-500">
              {meta.stageCount} 个阶段 · 当前 {meta.currentStageLabel}
              {goalPlan && meta.phase !== "archived" && (
                <span className="ml-1 text-violet-600">· {GOAL_PLAN_SEED_MARKER}</span>
              )}
            </p>
          </div>
        </div>

        {stages.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {stages.map((st, i) => (
              <span
                key={st}
                className="inline-flex items-center gap-1 rounded-full bg-[#F8FAFC] px-2 py-0.5 text-[10px] text-slate-600 ring-1 ring-[#EEF1F5]"
              >
                {i > 0 && <span className="text-slate-300">→</span>}
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    STAGE_DOT[st] ?? "bg-slate-300"
                  )}
                />
                {seedStageLabel(st)}
              </span>
            ))}
          </div>
        )}

        {seed.status === "ended" && seed.endReason && (
          <p className="mt-3 text-xs text-slate-500">
            归档原因：{seed.endReason}
          </p>
        )}
      </Card>

      <Card className="bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-800">阶段与时间线</h2>
        <p className="mt-0.5 text-[10px] text-slate-400">
          每个时间点发生了什么，可跳转查看当时的记录
        </p>

        <ul className="mt-4 space-y-0">
          {seed.events.map((ev, i) => {
            const href = seedEntityHref(ev.entityType, ev.entityId);
            const prev = i > 0 ? seed.events[i - 1] : undefined;
            const summary = buildEventSummary(ev, prev);
            const isLast = i === seed.events.length - 1;

            return (
              <li key={ev.id} className="relative flex gap-4 pb-6">
                {!isLast && (
                  <span
                    className="absolute left-[11px] top-5 bottom-0 w-px bg-[#E2E8F0]"
                    aria-hidden
                  />
                )}
                <span
                  className={cn(
                    "relative z-10 mt-1 h-6 w-6 shrink-0 rounded-full ring-2 ring-white",
                    STAGE_DOT[ev.stage] ?? "bg-slate-300"
                  )}
                  aria-hidden
                />
                <div className="min-w-0 flex-1 border-b border-[#F1F5F9] pb-4 last:border-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <span className="text-sm font-medium text-slate-800">
                        {seedStageLabel(ev.stage)}
                      </span>
                      <span className="ml-2 text-[10px] text-slate-400">
                        {SEED_ACTION_LABELS[ev.action]}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {formatDate(ev.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    {summary}
                  </p>
                  {href && (
                    <Link
                      href={href}
                      className="mt-2 inline-block text-[11px] text-[#1D4ED8] hover:underline"
                    >
                      查看此时记录 →
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
