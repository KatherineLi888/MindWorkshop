"use client";

import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AI_NAV,
  ARCHIVE_NAV,
  FLOW_NAV_ITEMS,
  HOME_NAV,
  KNOWLEDGE_NAV_GROUP,
  ROOT_NAV_GROUP,
  STATS_NAV,
  isAiNavActive,
  isArchiveNavActive,
  isHomeNavActive,
  isNavItemActive,
  isSeedsNavActive,
  isStatsNavActive,
} from "./nav-config";
import { cn } from "@/lib/utils";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { CLOUD_SYNCED_EVENT } from "@/lib/cloud-sync-events";
import { AUTH_ENABLED } from "@/lib/config";
import { isCloudEnabled } from "@/lib/supabase/client";

const navLinkClass = (active: boolean) =>
  cn(
    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
    active
      ? "bg-[var(--background)] text-[var(--primary)] shadow-sm ring-1 ring-[var(--border)]"
      : "text-slate-600 hover:bg-[var(--background)]"
  );

const SIDEBAR_COLLAPSED_KEY = "workshop-sidebar-collapsed";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!isCloudEnabled()) return;
    const sync = async () => {
      try {
        const { hydrateFromCloud } = await import("@/lib/migrate/local-to-cloud");
        await hydrateFromCloud();
        window.dispatchEvent(new Event(CLOUD_SYNCED_EVENT));
      } catch {
        /* 云端同步失败不阻塞本地使用 */
      }
    };
    void sync();
    const onVisible = () => {
      if (document.visibilityState === "visible") void sync();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)] text-[var(--foreground)] md:flex-row">
      <aside
        className={cn(
          "hidden shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)] transition-[width] duration-200 md:flex md:min-h-screen",
          collapsed ? "w-14" : "w-52"
        )}
      >
        <div
          className={cn(
            "flex items-center border-b border-[var(--border)] py-4",
            collapsed ? "justify-center px-2" : "justify-between px-4"
          )}
        >
          <Logo variant={collapsed ? "icon" : "lockup"} />
          <button
            type="button"
            onClick={toggleCollapsed}
            title={collapsed ? "展开侧栏" : "收起侧栏"}
            className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-[var(--background)] hover:text-slate-600"
          >
            {collapsed ? "»" : "«"}
          </button>
        </div>
        <nav className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden p-2">
          <Link
            href={HOME_NAV.href}
            title={HOME_NAV.label}
            className={cn(
              navLinkClass(isHomeNavActive(pathname)),
              "mb-1",
              collapsed && "justify-center px-2"
            )}
          >
            <span className="w-5 shrink-0 text-center text-xs">
              {HOME_NAV.icon}
            </span>
            {!collapsed && HOME_NAV.label}
          </Link>
          <Link
            href={STATS_NAV.href}
            title="统计仪表盘"
            className={cn(
              navLinkClass(isStatsNavActive(pathname)),
              "mb-3",
              collapsed && "justify-center px-2"
            )}
          >
            <span className="shrink-0">{STATS_NAV.icon}</span>
            {!collapsed && "统计仪表盘"}
          </Link>

          <div className="mb-3">
            {!collapsed && (
              <p className="px-3 pb-1 pt-1 text-[10px] font-medium tracking-wide text-slate-400">
                {ROOT_NAV_GROUP.label}
              </p>
            )}
            <div className="space-y-0.5">
              {ROOT_NAV_GROUP.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className={cn(
                    navLinkClass(isSeedsNavActive(pathname)),
                    collapsed && "justify-center px-2"
                  )}
                >
                  <span className="w-5 shrink-0 text-center text-xs">
                    {item.icon}
                  </span>
                  {!collapsed && item.label}
                </Link>
              ))}
            </div>
          </div>

          {!collapsed && (
            <p className="px-3 pb-1 text-[10px] font-medium tracking-wide text-slate-400">
              流程
            </p>
          )}
          <div className="space-y-0.5">
            {FLOW_NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={cn(
                  navLinkClass(isNavItemActive(pathname, item.href)),
                  collapsed && "justify-center px-2"
                )}
              >
                <span className="w-5 shrink-0 text-center text-xs">
                  {item.icon}
                </span>
                {!collapsed && item.label}
              </Link>
            ))}
          </div>

          <div className="mt-3">
            {!collapsed && (
              <p className="px-3 pb-1 pt-1 text-[10px] font-medium tracking-wide text-slate-400">
                {KNOWLEDGE_NAV_GROUP.label}
              </p>
            )}
            <div className="space-y-0.5">
              {KNOWLEDGE_NAV_GROUP.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className={cn(
                    navLinkClass(isNavItemActive(pathname, item.href)),
                    collapsed && "justify-center px-2"
                  )}
                >
                  <span className="w-5 shrink-0 text-center text-xs">
                    {item.icon}
                  </span>
                  {!collapsed && item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-3">
            {!collapsed && (
              <p className="px-3 pb-1 pt-1 text-[10px] font-medium tracking-wide text-slate-400">
                助手
              </p>
            )}
            <Link
              href={AI_NAV.href}
              title={AI_NAV.label}
              className={cn(
                navLinkClass(isAiNavActive(pathname)),
                collapsed && "justify-center px-2"
              )}
            >
              <span className="w-5 shrink-0 text-center text-xs">
                {AI_NAV.icon}
              </span>
              {!collapsed && AI_NAV.label}
            </Link>
          </div>
        </nav>
        <div className="mt-auto space-y-0.5 border-t border-[var(--border)] p-2">
          <Link
            href={ARCHIVE_NAV.href}
            title={ARCHIVE_NAV.label}
            className={cn(
              navLinkClass(isArchiveNavActive(pathname)),
              collapsed && "justify-center px-2"
            )}
          >
            <span className="w-5 shrink-0 text-center text-xs">
              {ARCHIVE_NAV.icon}
            </span>
            {!collapsed && ARCHIVE_NAV.label}
          </Link>
          <Link
            href="/settings"
            title="设置"
            className={cn(
              "block rounded-lg py-2 text-sm text-slate-500 hover:bg-[var(--background)]",
              collapsed ? "px-2 text-center" : "px-3"
            )}
          >
            {collapsed ? "⚙" : "设置"}
          </Link>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0">
        {!AUTH_ENABLED && (
          <p className="shrink-0 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-1.5 text-center text-[10px] text-slate-500">
            本地模式 · 数据存于本机 ·{" "}
            <Link href="/login" className="text-[var(--primary)] underline">
              登录
            </Link>{" "}
            可开启云端同步
          </p>
        )}
        {AUTH_ENABLED && isCloudEnabled() && (
          <p className="shrink-0 border-b border-emerald-200/60 bg-emerald-50/50 px-4 py-1.5 text-center text-[10px] text-emerald-700">
            云端模式 · 数据已与账号同步
          </p>
        )}
        {AUTH_ENABLED && !isCloudEnabled() && (
          <p className="shrink-0 border-b border-amber-200/60 bg-amber-50/50 px-4 py-1.5 text-center text-[10px] text-amber-700">
            登录已启用，请在 .env.local 配置 Supabase 变量以开启云端同步
          </p>
        )}
        <header className="flex shrink-0 items-center justify-between border-b border-[var(--border)] px-4 py-3 md:hidden">
          <Link href={HOME_NAV.href} className="font-semibold">
            思绪工坊
          </Link>
          <Link href={HOME_NAV.href} className="text-xs text-[var(--primary)]">
            首页
          </Link>
        </header>
        <main className="min-h-0 flex-1 overflow-auto">{children}</main>
      </div>

      <MobileBottomNav />
    </div>
  );
}
