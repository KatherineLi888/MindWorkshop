"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, Suspense } from "react";
import { SeedLifeDots } from "@/components/seeds/SeedLifeTimeline";
import { ensureEntityHasSeed, getSeedForEntity } from "@/lib/seeds/ensure";
import {
  appendReturnTo,
  parseReturnTo,
  SEEDS_HOME,
  STATS_HOME,
} from "@/lib/navigation/return-to";
import type { IdeaSeed, SeedStage } from "@/lib/seeds/types";
import { cn } from "@/lib/utils";

type Props = {
  entityType: string;
  entityId: string;
  title?: string;
  stage?: SeedStage;
  parentEntityType?: string;
  parentEntityId?: string;
  compact?: boolean;
  className?: string;
};

function resolveSeedReturn(
  pathname: string,
  searchParams: URLSearchParams | null
): string | null {
  const existing = parseReturnTo(searchParams);
  if (existing === STATS_HOME || existing?.startsWith(SEEDS_HOME)) {
    return existing;
  }
  if (pathname.startsWith(SEEDS_HOME)) return SEEDS_HOME;
  if (pathname === STATS_HOME) return STATS_HOME;
  return null;
}

function SeedLinkPanelInner({
  entityType,
  entityId,
  title,
  stage,
  parentEntityType,
  parentEntityId,
  compact = false,
  className,
}: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [seed, setSeed] = useState<IdeaSeed | null>(null);

  const refresh = useCallback(() => {
    if (!entityId) return;
    const row = ensureEntityHasSeed({
      entityType,
      entityId,
      title,
      stage,
      parentEntityType,
      parentEntityId,
    });
    setSeed(row ?? getSeedForEntity(entityType, entityId));
  }, [
    entityType,
    entityId,
    title,
    stage,
    parentEntityType,
    parentEntityId,
  ]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!entityId) return null;

  const back = resolveSeedReturn(pathname, searchParams);
  const seedPath = seed ? `/seeds/${seed.id}` : SEEDS_HOME;
  const seedHref = back ? appendReturnTo(seedPath, back) : seedPath;
  const allHref = back ? appendReturnTo(SEEDS_HOME, back) : SEEDS_HOME;

  if (compact) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-[#E8ECF0] bg-white px-2 py-0.5",
          className
        )}
      >
        <span className="text-[9px] text-slate-400">◌</span>
        <Link
          href={seedHref}
          className="max-w-[8rem] truncate text-[10px] font-medium text-[#1D4ED8] hover:underline"
        >
          {seed?.title ?? "未命名种子"}
        </Link>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-[#E8ECF0] bg-[#FAFBFC] px-3 py-2",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-medium text-slate-600">关联种子</p>
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-[9px] font-medium",
            seed?.status === "active"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-slate-100 text-slate-500"
          )}
        >
          {seed?.status === "active" ? "生长中" : "已结束"}
        </span>
      </div>
      <Link
        href={seedHref}
        className="mt-1 block text-sm font-medium text-[#1D4ED8] hover:underline"
      >
        {seed?.title ?? "未命名种子"}
      </Link>
      {seed && <SeedLifeDots seed={seed} />}
      <p className="mt-1 text-[9px] text-slate-400">
        一切想法的原始轨迹 ·{" "}
        <Link href={allHref} className="text-[#1D4ED8] hover:underline">
          查看全部种子
        </Link>
      </p>
    </div>
  );
}

export function SeedLinkPanel(props: Props) {
  return (
    <Suspense fallback={null}>
      <SeedLinkPanelInner {...props} />
    </Suspense>
  );
}
