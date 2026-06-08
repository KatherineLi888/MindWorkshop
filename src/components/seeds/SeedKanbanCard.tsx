"use client";

import { useRouter } from "next/navigation";
import {
  seedBoardMeta,
  SEED_PHASE_LABELS,
  isGoalPlanSeed,
  GOAL_PLAN_SEED_MARKER,
} from "@/lib/seeds/classify";
import { seedOriginLabel } from "@/lib/seeds/origin";
import { PHASE_ICONS } from "@/lib/seeds/overview-stats";
import { seedDisplayTitle } from "@/lib/seeds/naming";
import type { IdeaSeed } from "@/lib/seeds/types";
import { formatDate } from "@/lib/utils";

export function SeedKanbanCard({ seed }: { seed: IdeaSeed }) {
  const router = useRouter();
  const meta = seedBoardMeta(seed);
  const goalPlan = isGoalPlanSeed(seed);
  const title = seedDisplayTitle(seed.title);
  const phase = meta.phase;

  return (
    <button
      type="button"
      onClick={() => router.push(`/seeds/${seed.id}`)}
      className="block w-full rounded-lg border border-[#EEF1F5] bg-white p-3 text-left transition hover:border-[#CBD5E1] hover:shadow-sm active:scale-[0.99]"
    >
      <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-600">
        <span aria-hidden>{PHASE_ICONS[phase]}</span>
        <span>{SEED_PHASE_LABELS[phase]}</span>
        {goalPlan && phase !== "archived" && (
          <span className="text-violet-600">· {GOAL_PLAN_SEED_MARKER}</span>
        )}
        <span className="ml-auto tabular-nums text-slate-400">
          {meta.stageCount} 阶段
        </span>
      </div>

      <p className="mt-2 text-sm font-medium leading-snug text-slate-800">
        {title}
      </p>

      <div className="mt-2 flex items-center justify-between gap-2 border-t border-[#F1F5F9] pt-2">
        <span className="text-[10px] text-slate-500">
          来源 · {seedOriginLabel(seed)}
        </span>
        <span className="shrink-0 text-[10px] text-slate-400">
          {formatDate(seed.updatedAt)}
        </span>
      </div>
    </button>
  );
}
