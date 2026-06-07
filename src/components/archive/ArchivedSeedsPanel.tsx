"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SeedKanbanCard } from "@/components/seeds/SeedKanbanCard";
import { loadSeeds } from "@/lib/seeds/storage";
import { classifySeed } from "@/lib/seeds/classify";
import type { IdeaSeed } from "@/lib/seeds/types";

export function ArchivedSeedsPanel() {
  const [archived, setArchived] = useState<IdeaSeed[]>([]);

  useEffect(() => {
    setArchived(
      loadSeeds().filter((s) => classifySeed(s) === "archived")
    );
  }, []);

  if (archived.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-[#E2E8F0] py-16 text-center text-sm text-slate-400">
        暂无已归档种子
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">
        共 {archived.length} 颗已结束的种子 ·{" "}
        <Link href="/seeds" className="text-[#1D4ED8] hover:underline">
          返回种子看板
        </Link>
      </p>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {archived.map((s) => (
          <li key={s.id}>
            <SeedKanbanCard seed={s} />
          </li>
        ))}
      </ul>
    </div>
  );
}
