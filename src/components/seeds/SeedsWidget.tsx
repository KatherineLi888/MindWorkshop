"use client";

import Link from "next/link";
import { SeedKanbanCard } from "@/components/seeds/SeedKanbanCard";
import { Card } from "@/components/ui/card";
import type { SeedSummary } from "@/lib/seeds/types";

export function SeedsWidget({
  title,
  summary,
  compact = false,
}: {
  title: string;
  summary: SeedSummary;
  compact?: boolean;
}) {
  const { sprouting, growing, archived, spotlight } = summary;

  return (
    <Card className="flex h-full flex-col bg-white p-3">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
          <p className="mt-0.5 text-[10px] text-slate-400">
            萌芽 / 生长 / 归档（客观标准）
          </p>
        </div>
        <div className="flex shrink-0 gap-2 text-center text-[9px]">
          <div>
            <p className="text-base font-bold tabular-nums text-lime-700">
              {sprouting}
            </p>
            <p className="text-slate-400">萌芽</p>
          </div>
          <div>
            <p className="text-base font-bold tabular-nums text-emerald-600">
              {growing}
            </p>
            <p className="text-slate-400">生长</p>
          </div>
          <div>
            <p className="text-base font-bold tabular-nums text-slate-400">
              {archived}
            </p>
            <p className="text-slate-400">归档</p>
          </div>
        </div>
      </div>

      {spotlight.length === 0 ? (
        <p className="flex flex-1 items-center justify-center text-xs text-slate-400">
          暂无生长中的种子
        </p>
      ) : (
        <ul className={compact ? "space-y-1.5" : "space-y-2"}>
          {spotlight.slice(0, compact ? 2 : 3).map((seed) => (
            <li key={seed.id}>
              <SeedKanbanCard seed={seed} />
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/seeds"
        className="mt-2 text-center text-[10px] text-[#1D4ED8] hover:underline"
      >
        查看全部种子看板 →
      </Link>
    </Card>
  );
}
