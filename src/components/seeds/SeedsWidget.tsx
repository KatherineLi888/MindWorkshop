"use client";

import Link from "next/link";
import { SeedKanbanCard } from "@/components/seeds/SeedKanbanCard";
import { withReturn } from "@/lib/navigation/return-to";
import type { SeedSummary } from "@/lib/seeds/types";
import { cn } from "@/lib/utils";

function StatCell({
  value,
  label,
  accent,
}: {
  value: number;
  label: string;
  accent: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-1">
      <span className={cn("text-xl font-semibold tabular-nums", accent)}>
        {value}
      </span>
      <span className="mt-0.5 text-[10px] text-slate-400">{label}</span>
    </div>
  );
}

export function SeedsWidget({
  title,
  summary,
  compact = false,
  returnTo,
}: {
  title: string;
  summary: SeedSummary;
  compact?: boolean;
  /** 从统计页等跳出时，子链接携带 returnTo */
  returnTo?: string;
}) {
  const { sprouting, growing, archived, spotlight } = summary;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 px-1">
        <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
        <Link
          href={withReturn("/seeds", returnTo)}
          className="text-[10px] text-slate-400 transition hover:text-[var(--primary)]"
        >
          全部
        </Link>
      </div>

      <div className="mt-3 grid grid-cols-3 divide-x divide-slate-100 rounded-xl bg-slate-50/80 px-1 py-2">
        <StatCell value={sprouting} label="萌芽" accent="text-lime-600" />
        <StatCell value={growing} label="生长" accent="text-emerald-600" />
        <StatCell value={archived} label="归档" accent="text-slate-500" />
      </div>

      {spotlight.length === 0 ? (
        <p className="mt-4 flex flex-1 items-center justify-center text-center text-xs text-slate-400">
          暂无生长中的种子
        </p>
      ) : (
        <ul className={cn("mt-3 space-y-2", compact && "space-y-1.5")}>
          {spotlight.slice(0, compact ? 2 : 3).map((seed) => (
            <li key={seed.id}>
              <SeedKanbanCard seed={seed} returnTo={returnTo} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
