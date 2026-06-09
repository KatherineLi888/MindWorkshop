"use client";

import { useRouter } from "next/navigation";
import {
  seedBoardMeta,
  SEED_PHASE_LABELS,
  isGoalPlanSeed,
  GOAL_PLAN_SEED_MARKER,
} from "@/lib/seeds/classify";
import { seedOriginLabel } from "@/lib/seeds/origin";
import { seedDisplayTitle } from "@/lib/seeds/naming";
import type { IdeaSeed } from "@/lib/seeds/types";
import { SEEDS_HOME, withReturn } from "@/lib/navigation/return-to";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const PHASE_ACCENT: Record<string, string> = {
  sprouting: "border-l-lime-400 bg-lime-50/30",
  growing: "border-l-emerald-400 bg-emerald-50/20",
  archived: "border-l-slate-300 bg-slate-50/50",
};

export function SeedKanbanCard({
  seed,
  returnTo,
}: {
  seed: IdeaSeed;
  /** 跳出后返回页，默认返回种子看板 */
  returnTo?: string;
}) {
  const router = useRouter();
  const meta = seedBoardMeta(seed);
  const goalPlan = isGoalPlanSeed(seed);
  const title = seedDisplayTitle(seed.title);
  const phase = meta.phase;

  return (
    <button
      type="button"
      onClick={() =>
        router.push(
          withReturn(`/seeds/${seed.id}`, returnTo ?? SEEDS_HOME)
        )
      }
      className={cn(
        "block w-full rounded-xl border-l-[3px] px-3 py-2.5 text-left transition",
        "hover:shadow-sm active:scale-[0.99]",
        PHASE_ACCENT[phase] ?? "border-l-slate-300 bg-white"
      )}
    >
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">
          {title}
        </span>
        <span className="shrink-0 text-[10px] text-slate-400">
          {formatDate(seed.updatedAt)}
        </span>
      </div>
      <p className="mt-1 text-[10px] text-slate-400">
        {SEED_PHASE_LABELS[phase]}
        {goalPlan && phase !== "archived" && (
          <span className="text-violet-500"> · {GOAL_PLAN_SEED_MARKER}</span>
        )}
        <span className="text-slate-300"> · </span>
        {seedOriginLabel(seed)}
      </p>
    </button>
  );
}
