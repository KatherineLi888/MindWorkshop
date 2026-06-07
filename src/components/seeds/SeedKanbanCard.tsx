"use client";

import Link from "next/link";
import { seedBoardMeta, SEED_PHASE_LABELS, isGoalPlanSeed, GOAL_PLAN_SEED_MARKER } from "@/lib/seeds/classify";
import type { IdeaSeed } from "@/lib/seeds/types";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const PHASE_STYLE = {
  sprouting: "bg-lime-50 text-lime-800 ring-lime-200",
  growing: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  archived: "bg-slate-100 text-slate-500 ring-slate-200",
};

export function SeedKanbanCard({ seed }: { seed: IdeaSeed }) {
  const meta = seedBoardMeta(seed);
  const goalPlan = isGoalPlanSeed(seed);

  return (
    <Link
      href={`/seeds/${seed.id}`}
      className="block rounded-lg border border-[#EEF1F5] bg-white p-3 transition hover:border-[#BFDBFE] hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 flex-1 text-sm font-medium leading-snug text-slate-800">
          {seed.title}
        </p>
        <div className="shrink-0 text-right">
          <p className="text-[10px] font-medium tabular-nums text-slate-600">
            {meta.stageCount} 阶段
          </p>
          <p className="text-[10px] text-[#1D4ED8]">{meta.currentStageLabel}</p>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-[10px] text-slate-400">
          {formatDate(seed.updatedAt)}
        </span>
        <div className="flex shrink-0 items-center gap-1">
          {goalPlan && meta.phase !== "archived" && (
            <span className="rounded-full bg-violet-50 px-1.5 py-0.5 text-[9px] font-medium text-violet-700 ring-1 ring-violet-200">
              {GOAL_PLAN_SEED_MARKER}
            </span>
          )}
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[9px] font-medium ring-1",
              PHASE_STYLE[meta.phase]
            )}
          >
            {SEED_PHASE_LABELS[meta.phase]}
          </span>
        </div>
      </div>
    </Link>
  );
}
