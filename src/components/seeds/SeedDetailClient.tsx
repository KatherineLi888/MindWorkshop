"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PHASE_ICONS } from "@/lib/seeds/overview-stats";
import { seedOriginLabel } from "@/lib/seeds/origin";
import { SeedTimelineViews } from "@/components/seeds/SeedTimelineViews";
import { Card } from "@/components/ui/card";
import {
  seedBoardMeta,
  SEED_PHASE_LABELS,
  isGoalPlanSeed,
  GOAL_PLAN_SEED_MARKER,
} from "@/lib/seeds/classify";
import { loadEntityBirthContent } from "@/lib/seeds/entity-content";
import { birthEvent, birthLocationFull } from "@/lib/seeds/origin";
import { seedDisplayTitle } from "@/lib/seeds/naming";
import type { IdeaSeed } from "@/lib/seeds/types";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { parseReturnTo, SEEDS_HOME } from "@/lib/navigation/return-to";

function SeedDetailInner({ seed }: { seed: IdeaSeed }) {
  const searchParams = useSearchParams();
  const returnTo = parseReturnTo(searchParams) ?? SEEDS_HOME;
  const meta = seedBoardMeta(seed);
  const goalPlan = isGoalPlanSeed(seed);
  const born = birthEvent(seed);
  const [birthContent, setBirthContent] = useState("");

  useEffect(() => {
    if (!born) return;
    let alive = true;
    void loadEntityBirthContent(born).then((text) => {
      if (alive) setBirthContent(text);
    });
    return () => {
      alive = false;
    };
  }, [born?.id]);

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={SEEDS_HOME}
          className="text-xs text-slate-500 hover:text-slate-700 hover:underline"
        >
          种子看板
        </Link>
      </div>

      <Card className="bg-white p-4">
        <div className="flex flex-wrap items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600">
              <span aria-hidden>{PHASE_ICONS[meta.phase]}</span>
              {SEED_PHASE_LABELS[meta.phase]}
            </p>
            <h1 className="mt-1 text-lg font-semibold text-slate-900">
              {seedDisplayTitle(seed.title)}
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              创建于 {formatDate(seed.createdAt)} · 更新于{" "}
              {formatDate(seed.updatedAt)}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              来源 · {seedOriginLabel(seed)}
            </p>
          </div>
          <div className="text-right">
            <span
              className={cn(
                "inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ring-1",
                meta.phase === "sprouting" &&
                  "bg-lime-50 text-lime-800 ring-lime-200",
                meta.phase === "growing" &&
                  "bg-emerald-50 text-emerald-700 ring-emerald-200",
                meta.phase === "archived" &&
                  "bg-slate-100 text-slate-500 ring-slate-200"
              )}
            >
              {SEED_PHASE_LABELS[meta.phase]}
            </span>
            <p className="mt-1 text-[10px] tabular-nums text-slate-500">
              {meta.stageCount} 个阶段 · {meta.currentStageLabel}
              {goalPlan && meta.phase !== "archived" && (
                <span className="ml-1 text-violet-600">
                  · {GOAL_PLAN_SEED_MARKER}
                </span>
              )}
            </p>
          </div>
        </div>

        {born && (
          <div className="mt-4 rounded-lg border border-[#EEF1F5] bg-[#FAFBFC] p-3">
            <p className="text-[10px] font-medium text-slate-500">诞生信息</p>
            <p className="mt-1 text-xs text-slate-800">
              在「{birthLocationFull(seed)}」诞生
            </p>
            {birthContent && (
              <p className="mt-2 whitespace-pre-wrap text-[11px] leading-relaxed text-slate-600">
                {birthContent}
              </p>
            )}
          </div>
        )}

        {seed.status === "ended" && seed.endReason && (
          <p className="mt-3 text-xs text-slate-500">
            归档原因：{seed.endReason}
          </p>
        )}
      </Card>

      <Card className="bg-white p-4">
        <SeedTimelineViews seed={seed} returnTo={returnTo} />
      </Card>
    </div>
  );
}

export function SeedDetailClient({ seed }: { seed: IdeaSeed }) {
  return (
    <Suspense fallback={null}>
      <SeedDetailInner seed={seed} />
    </Suspense>
  );
}
