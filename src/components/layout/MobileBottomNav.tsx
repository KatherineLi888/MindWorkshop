"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  FLOW_NAV_ITEMS,
  KNOWLEDGE_NAV_GROUP,
  ROOT_NAV_GROUP,
  STATS_NAV,
  isArchiveNavActive,
  isInboxNavActive,
  isNavItemActive,
  isSeedsNavActive,
  isStatsNavActive,
  isThinkingNavActive,
} from "./nav-config";
import { MobileCreateMenu } from "@/components/layout/MobileCreateMenu";
import { MobileIdeasMenu } from "@/components/layout/MobileIdeasMenu";
import { MobileKnowledgeMenu } from "@/components/layout/MobileKnowledgeMenu";
import { MobileMoreMenu } from "@/components/layout/MobileMoreMenu";
import { cn } from "@/lib/utils";

const IDEAS_PATHS = [
  ...ROOT_NAV_GROUP.items.map((i) => i.href),
  ...FLOW_NAV_ITEMS.map((i) => i.href),
] as const;

function tabClass(active: boolean, compact = false) {
  return cn(
    "flex flex-col items-center justify-center gap-0.5 transition active:opacity-80",
    compact ? "min-w-0 px-1 py-1 text-[9px]" : "flex-1 py-1 text-[10px]",
    active ? "font-medium text-[var(--primary)]" : "text-slate-500"
  );
}

function isIdeasNavActive(pathname: string): boolean {
  return IDEAS_PATHS.some(
    (href) =>
      href === "/inbox"
        ? isInboxNavActive(pathname)
        : href === "/seeds"
          ? isSeedsNavActive(pathname)
          : href === "/thinking"
            ? isThinkingNavActive(pathname)
            : isNavItemActive(pathname, href)
  );
}

function isKnowledgeNavActive(pathname: string): boolean {
  return KNOWLEDGE_NAV_GROUP.items.some((item) =>
    isNavItemActive(pathname, item.href)
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const [ideasOpen, setIdeasOpen] = useState(false);
  const [knowledgeOpen, setKnowledgeOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const ideasActive = isIdeasNavActive(pathname) || ideasOpen;
  const knowledgeActive = isKnowledgeNavActive(pathname) || knowledgeOpen;
  const statsActive = isStatsNavActive(pathname);
  const moreActive =
    isArchiveNavActive(pathname) ||
    pathname === "/settings" ||
    pathname.startsWith("/settings/") ||
    moreOpen;

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-[var(--background)]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <div className="relative flex h-14 items-stretch px-0.5">
          {/* 左侧：统计 */}
          <Link href={STATS_NAV.href} className={tabClass(statsActive)}>
            <span className="text-lg leading-none">{STATS_NAV.icon}</span>
            <span>{STATS_NAV.label}</span>
          </Link>

          {/* 中间：想法 */}
          <button
            type="button"
            onClick={() => {
              setKnowledgeOpen(false);
              setCreateOpen(false);
              setMoreOpen(false);
              setIdeasOpen((v) => !v);
            }}
            className={tabClass(ideasActive)}
          >
            <span className="text-lg leading-none">💡</span>
            <span>想法</span>
          </button>

          {/* 居中加号 */}
          <div className="flex w-14 shrink-0 items-center justify-center">
            <button
              type="button"
              aria-label="新建"
              onClick={() => {
                setIdeasOpen(false);
                setKnowledgeOpen(false);
                setMoreOpen(false);
                setCreateOpen(true);
              }}
              className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary)] text-2xl font-light text-white shadow-md transition hover:brightness-105 active:scale-95"
            >
              +
            </button>
          </div>

          {/* 右侧：知识库 */}
          <button
            type="button"
            onClick={() => {
              setIdeasOpen(false);
              setCreateOpen(false);
              setMoreOpen(false);
              setKnowledgeOpen((v) => !v);
            }}
            className={tabClass(knowledgeActive)}
          >
            <span className="text-lg leading-none">📚</span>
            <span>知识库</span>
          </button>

          {/* 右侧：更多 */}
          <button
            type="button"
            onClick={() => {
              setIdeasOpen(false);
              setCreateOpen(false);
              setKnowledgeOpen(false);
              setMoreOpen((v) => !v);
            }}
            className={tabClass(moreActive)}
          >
            <span className="text-lg leading-none">⋯</span>
            <span>更多</span>
          </button>
        </div>
      </nav>

      <MobileIdeasMenu open={ideasOpen} onClose={() => setIdeasOpen(false)} />
      <MobileKnowledgeMenu
        open={knowledgeOpen}
        onClose={() => setKnowledgeOpen(false)}
      />
      <MobileMoreMenu open={moreOpen} onClose={() => setMoreOpen(false)} />
      <MobileCreateMenu open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}
