"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ARCHIVE_NAV,
  FLOW_NAV_ITEMS,
  HOME_NAV,
  KNOWLEDGE_NAV_GROUP,
  ROOT_NAV_GROUP,
  STATS_NAV,
  THINKING_NAV,
  isArchiveNavActive,
  isHomeNavActive,
  isNavItemActive,
  isStatsNavActive,
  isThinkingNavActive,
} from "./nav-config";
import { cn } from "@/lib/utils";

const DECISIONS_NAV = FLOW_NAV_ITEMS.find((i) => i.href === "/decisions")!;
const GOALS_NAV = FLOW_NAV_ITEMS.find((i) => i.href === "/goals")!;

const MORE_LINKS = [
  HOME_NAV,
  STATS_NAV,
  ...ROOT_NAV_GROUP.items,
  ...FLOW_NAV_ITEMS.filter(
    (i) => !["/thinking", "/decisions", "/goals"].includes(i.href)
  ),
  ...KNOWLEDGE_NAV_GROUP.items,
  ARCHIVE_NAV,
  { href: "/settings", label: "设置", icon: "⚙" },
] as const;

function tabClass(active: boolean) {
  return cn(
    "flex flex-1 flex-col items-center justify-center gap-0.5 py-1 text-[10px] transition",
    active ? "font-medium text-[var(--primary)]" : "text-slate-500"
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!moreOpen) return;
    const onPointer = (e: MouseEvent) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    window.addEventListener("mousedown", onPointer);
    return () => window.removeEventListener("mousedown", onPointer);
  }, [moreOpen]);

  const moreActive = MORE_LINKS.some(
    (item) =>
      item.href !== HOME_NAV.href &&
      (pathname === item.href || pathname.startsWith(`${item.href}/`))
  );

  return (
    <>
      {moreOpen && (
        <div className="fixed inset-0 z-40 bg-black/25 md:hidden" aria-hidden />
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-[var(--background)]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        {moreOpen && (
          <div
            ref={sheetRef}
            className="absolute bottom-full left-2 right-2 mb-2 max-h-[min(70dvh,24rem)] overflow-y-auto rounded-xl border border-[var(--border)] bg-white p-2 shadow-lg"
          >
            <p className="px-2 pb-1 text-[10px] font-medium text-slate-400">
              更多
            </p>
            <div className="grid grid-cols-4 gap-1">
              {MORE_LINKS.map((item) => {
                const active =
                  item.href === STATS_NAV.href
                    ? isStatsNavActive(pathname)
                    : item.href === ARCHIVE_NAV.href
                      ? isArchiveNavActive(pathname)
                      : item.href === HOME_NAV.href
                        ? isHomeNavActive(pathname)
                        : isNavItemActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex flex-col items-center rounded-lg px-1 py-2 text-[10px]",
                      active
                        ? "bg-[var(--surface)] text-[var(--primary)]"
                        : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <span className="text-base leading-none">{item.icon}</span>
                    <span className="mt-0.5 truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        <div className="relative flex h-14 items-stretch px-1">
          <Link
            href={THINKING_NAV.href}
            className={tabClass(isThinkingNavActive(pathname))}
          >
            <span className="text-lg leading-none">{THINKING_NAV.icon}</span>
            <span>{THINKING_NAV.label}</span>
          </Link>

          <Link
            href={DECISIONS_NAV.href}
            className={tabClass(isNavItemActive(pathname, DECISIONS_NAV.href))}
          >
            <span className="text-lg leading-none">{DECISIONS_NAV.icon}</span>
            <span>{DECISIONS_NAV.label}</span>
          </Link>

          <div className="flex flex-1 items-center justify-center">
            <Link
              href={HOME_NAV.href}
              aria-label="首页"
              className={cn(
                "-mt-5 flex h-12 w-12 items-center justify-center rounded-full text-2xl font-light text-white shadow-md transition active:scale-95",
                isHomeNavActive(pathname)
                  ? "bg-[var(--primary)] ring-2 ring-[var(--primary)]/30"
                  : "bg-[var(--primary)] hover:brightness-105"
              )}
            >
              +
            </Link>
          </div>

          <Link
            href={GOALS_NAV.href}
            className={tabClass(isNavItemActive(pathname, GOALS_NAV.href))}
          >
            <span className="text-lg leading-none">{GOALS_NAV.icon}</span>
            <span>{GOALS_NAV.label}</span>
          </Link>

          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            className={tabClass(moreActive || moreOpen)}
          >
            <span className="text-lg leading-none">⋯</span>
            <span>更多</span>
          </button>
        </div>
      </nav>
    </>
  );
}
