"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { MODULE_INTRO } from "@/lib/module-copy";
import { withSeedsReturn } from "@/lib/navigation/return-to";
import { SeedDataOverview } from "@/components/seeds/SeedDataOverview";
import { SeedKanban } from "@/components/seeds/SeedKanban";
import { Card } from "@/components/ui/card";
import { SEED_PHASE_LABELS, classifySeed } from "@/lib/seeds/classify";
import { backfillMissingSeeds } from "@/lib/seeds/backfill";
import { loadSeeds } from "@/lib/seeds/storage";
import type { IdeaSeed, SeedPhase } from "@/lib/seeds/types";
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
    <div className="space-y-4 bg-[#F8FAFC] p-4 lg:p-6">
      <PageHeader
        title="种子"
        description={MODULE_INTRO.seeds}
      />

      <SeedDataOverview seeds={seeds} />

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
              "rounded-full px-3 py-1 text-xs transition",
              filter === key
                ? "bg-slate-700 text-white"
                : "bg-white text-slate-600 ring-1 ring-[#E2E8F0] hover:bg-slate-50"
            )}
          >
            {label}
            <span className="ml-1 tabular-nums opacity-80">{count}</span>
          </button>
        ))}
      </div>

      <SeedKanban seeds={seeds} focus={filter} />

      {filter === "archived" && (
        <Card className="border-dashed bg-white p-3 text-center shadow-sm">
          <p className="text-[11px] text-slate-500">
            已归档种子也可在
            <Link
              href={withSeedsReturn("/archive?tab=seeds")}
              className="mx-1 text-[#1D4ED8] hover:underline"
            >
              总归档箱 · 种子
            </Link>
            统一查看
          </p>
        </Card>
      )}
    </div>
  );
}
