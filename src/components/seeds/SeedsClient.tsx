"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { SeedKanban } from "@/components/seeds/SeedKanban";
import { SeedKanbanCard } from "@/components/seeds/SeedKanbanCard";
import { Card } from "@/components/ui/card";
import { classifySeed, SEED_PHASE_LABELS, spotlightGrowing } from "@/lib/seeds/classify";
import type { SeedPhase } from "@/lib/seeds/types";
import { backfillMissingSeeds } from "@/lib/seeds/backfill";
import { loadSeeds } from "@/lib/seeds/storage";
import type { IdeaSeed } from "@/lib/seeds/types";
import { cn } from "@/lib/utils";

type BoardFilter = "all" | SeedPhase;

export function SeedsClient() {
  const [seeds, setSeeds] = useState<IdeaSeed[]>([]);
  const [filter, setFilter] = useState<BoardFilter>("all");

  const refresh = useCallback(() => {
    backfillMissingSeeds();
    setSeeds(loadSeeds());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const spotlight = useMemo(() => spotlightGrowing(seeds, 5), [seeds]);

  const counts = useMemo(() => {
    let sprouting = 0;
    let growing = 0;
    let archived = 0;
    for (const s of seeds) {
      const p = classifySeed(s);
      if (p === "sprouting") sprouting++;
      else if (p === "growing") growing++;
      else archived++;
    }
    return { sprouting, growing, archived, all: seeds.length };
  }, [seeds]);

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <PageHeader
        title="种子"
        description="独立于各模块的原始轨迹。萌芽=仅单阶段；生长=已跨阶段或目标计划；归档=已结束。"
      />

      {spotlight.length > 0 && (
        <section>
          <div className="mb-2 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-xs font-semibold text-slate-700">
                当下生长中
              </h2>
              <p className="text-[10px] text-slate-400">
                最近仍在跨阶段流转的种子
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFilter("growing")}
              className="text-[10px] text-[#1D4ED8] hover:underline"
            >
              查看全部生长中 →
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {spotlight.map((s) => (
              <SeedKanbanCard key={s.id} seed={s} />
            ))}
          </div>
        </section>
      )}

      <div className="flex flex-wrap gap-1">
        {(
          [
            ["all", "全部看板", counts.all],
            ["sprouting", SEED_PHASE_LABELS.sprouting, counts.sprouting],
            ["growing", SEED_PHASE_LABELS.growing, counts.growing],
            ["archived", SEED_PHASE_LABELS.archived, counts.archived],
          ] as const
        ).map(([key, label, count]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={cn(
              "rounded-full px-3 py-1 text-xs",
              filter === key
                ? "bg-[#3B82F6] text-white"
                : "bg-[#F8FAFC] text-slate-600"
            )}
          >
            {label}
            <span className="ml-1 tabular-nums opacity-80">{count}</span>
          </button>
        ))}
      </div>

      <SeedKanban seeds={seeds} focus={filter} />

      {filter === "archived" && (
        <Card className="border-dashed bg-[#FAFBFC] p-3 text-center">
          <p className="text-[11px] text-slate-500">
            已归档种子也可在
            <Link href="/archive?tab=seeds" className="mx-1 text-[#1D4ED8] hover:underline">
              总归档箱 · 种子
            </Link>
            统一查看
          </p>
        </Card>
      )}
    </div>
  );
}
