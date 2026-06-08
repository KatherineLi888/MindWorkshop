"use client";

import { useMemo, useState } from "react";
import { SeedColumnFilter } from "@/components/seeds/SeedColumnFilter";
import { SeedKanbanCard } from "@/components/seeds/SeedKanbanCard";
import { Card } from "@/components/ui/card";
import { partitionSeeds, SEED_PHASE_LABELS } from "@/lib/seeds/classify";
import {
  filterSeedsByColumn,
  type SeedColumnFilterState,
} from "@/lib/seeds/origin";
import type { IdeaSeed, SeedPhase } from "@/lib/seeds/types";
import { cn } from "@/lib/utils";

const COLUMNS: SeedPhase[] = ["sprouting", "growing", "archived"];

const COLUMN_HINT: Record<SeedPhase, string> = {
  sprouting: "仅停留在一个阶段",
  growing: "已跨阶段或纳入目标计划",
  archived: "已结束",
};

const COLUMN_ACCENT: Record<SeedPhase, string> = {
  sprouting: "border-lime-300",
  growing: "border-emerald-400",
  archived: "border-slate-300",
};

const EMPTY_FILTER: SeedColumnFilterState = {
  origin: "",
  currentStage: "",
};

type Props = {
  seeds: IdeaSeed[];
  focus?: SeedPhase | "all";
};

export function SeedKanban({ seeds, focus = "all" }: Props) {
  const [columnFilters, setColumnFilters] = useState<
    Record<SeedPhase, SeedColumnFilterState>
  >({
    sprouting: { ...EMPTY_FILTER },
    growing: { ...EMPTY_FILTER },
    archived: { ...EMPTY_FILTER },
  });

  const parts = useMemo(() => {
    const base = partitionSeeds(seeds);
    return {
      sprouting: filterSeedsByColumn(base.sprouting, columnFilters.sprouting),
      growing: filterSeedsByColumn(base.growing, columnFilters.growing),
      archived: filterSeedsByColumn(base.archived, columnFilters.archived),
    };
  }, [seeds, columnFilters]);

  const cols = focus === "all" ? COLUMNS : COLUMNS.filter((c) => c === focus);

  return (
    <div
      className={cn(
        "grid gap-3",
        cols.length === 1 ? "grid-cols-1" : "md:grid-cols-3"
      )}
    >
      {cols.map((phase) => (
        <Card
          key={phase}
          className={cn(
            "border-l-4 bg-white p-3 shadow-sm",
            COLUMN_ACCENT[phase]
          )}
        >
          <div className="mb-2 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-700">
                {SEED_PHASE_LABELS[phase]}
                <span className="ml-1.5 font-normal tabular-nums text-slate-400">
                  {parts[phase].length}
                </span>
              </p>
              <p className="text-[10px] text-slate-400">{COLUMN_HINT[phase]}</p>
            </div>
            <SeedColumnFilter
              value={columnFilters[phase]}
              onChange={(next) =>
                setColumnFilters((prev) => ({ ...prev, [phase]: next }))
              }
            />
          </div>
          <ul className="max-h-[min(60vh,520px)] space-y-2 overflow-y-auto">
            {parts[phase].length === 0 ? (
              <li className="py-8 text-center text-[11px] text-slate-400">
                暂无
              </li>
            ) : (
              parts[phase].map((s) => (
                <li key={s.id}>
                  <SeedKanbanCard seed={s} />
                </li>
              ))
            )}
          </ul>
          {phase === "archived" && parts.archived.length > 0 && (
            <a
              href="/archive?tab=seeds"
              className="mt-2 block text-center text-[10px] text-[#1D4ED8] hover:underline"
            >
              在总归档箱查看全部 →
            </a>
          )}
        </Card>
      ))}
    </div>
  );
}
