"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { SeedLifeTimeline } from "@/components/seeds/SeedLifeTimeline";
import {
  classifySeed,
  GOAL_PLAN_SEED_MARKER,
  isGoalPlanSeed,
  SEED_PHASE_LABELS,
  seedBoardMeta,
} from "@/lib/seeds/classify";
import { ensureEntityHasSeed, getSeedForEntity } from "@/lib/seeds/ensure";
import { seedStageLabel } from "@/lib/seeds/labels";
import type { IdeaSeed, SeedPhase } from "@/lib/seeds/types";
import { cn } from "@/lib/utils";

const PHASE_SEED_STYLE: Record<
  SeedPhase,
  { icon: string; btn: string; dot: string }
> = {
  sprouting: {
    icon: "🌰",
    btn: "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100",
    dot: "bg-amber-600",
  },
  growing: {
    icon: "🌱",
    btn: "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
    dot: "bg-emerald-600",
  },
  archived: {
    icon: "🍂",
    btn: "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100",
    dot: "bg-slate-400",
  },
};

type Props = {
  entityId: string;
  title?: string;
  className?: string;
};

export function GoalSeedBadge({ entityId, title, className }: Props) {
  const [seed, setSeed] = useState<IdeaSeed | null>(null);
  const [open, setOpen] = useState(false);

  const refresh = useCallback(() => {
    if (!entityId) return;
    ensureEntityHasSeed({
      entityType: "goal",
      entityId,
      title,
      stage: "goals",
    });
    setSeed(getSeedForEntity("goal", entityId));
  }, [entityId, title]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!entityId) return null;

  const phase = seed ? classifySeed(seed) : "growing";
  const goalPlan = seed ? isGoalPlanSeed(seed) : true;
  const style = PHASE_SEED_STYLE[phase];
  const meta = seed ? seedBoardMeta(seed) : null;
  const origin = seed?.events[0];
  const originLabel = origin ? seedStageLabel(origin.stage) : "—";

  return (
    <>
      <button
        type="button"
        title={`种子 · ${seed?.title ?? "未命名"} · ${SEED_PHASE_LABELS[phase]}${goalPlan ? ` · ${GOAL_PLAN_SEED_MARKER}` : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className={cn(
          "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium transition",
          style.btn,
          className
        )}
      >
        <span className="text-xs leading-none">{style.icon}</span>
        <span className="max-w-[5rem] truncate">{SEED_PHASE_LABELS[phase]}</span>
        {goalPlan && phase !== "archived" && (
          <span className="rounded bg-emerald-100/80 px-1 text-[9px] text-emerald-700">
            计划
          </span>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-black/30 p-4 sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl",
                  phase === "sprouting" && "bg-amber-100",
                  phase === "growing" && "bg-emerald-100",
                  phase === "archived" && "bg-slate-100"
                )}
              >
                {style.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900">
                  {seed?.title ?? "未命名种子"}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {SEED_PHASE_LABELS[phase]}
                  {goalPlan && phase !== "archived" && ` · ${GOAL_PLAN_SEED_MARKER}`}
                  {meta && ` · ${meta.stageCount} 个阶段`}
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-[#F8FAFC] px-3 py-2">
                <p className="text-[10px] text-slate-400">根源</p>
                <p className="mt-0.5 font-medium text-slate-700">{originLabel}</p>
              </div>
              <div className="rounded-lg bg-[#F8FAFC] px-3 py-2">
                <p className="text-[10px] text-slate-400">当前所在</p>
                <p className="mt-0.5 font-medium text-slate-700">
                  {meta?.currentStageLabel ?? "—"}
                </p>
              </div>
            </div>

            {seed && (
              <div className="mt-3 max-h-40 overflow-y-auto rounded-lg border border-[#E8ECF0] px-3 py-2">
                <p className="mb-2 text-[10px] font-medium text-slate-500">
                  生命轨迹
                </p>
                <SeedLifeTimeline seed={seed} compact maxEvents={6} />
              </div>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
              >
                关闭
              </button>
              {seed && (
                <Link
                  href={`/seeds/${seed.id}`}
                  className="rounded-lg bg-[#3B82F6] px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600"
                  onClick={() => setOpen(false)}
                >
                  查看种子详情 →
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
