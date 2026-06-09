"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FLOW_NAV_ITEMS,
  ROOT_NAV_GROUP,
  isInboxNavActive,
  isNavItemActive,
  isSeedsNavActive,
  isThinkingNavActive,
} from "@/components/layout/nav-config";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
};

const INBOX_NAV = FLOW_NAV_ITEMS.find((i) => i.href === "/inbox")!;
const THINKING_NAV = FLOW_NAV_ITEMS.find((i) => i.href === "/thinking")!;
const DECISIONS_NAV = FLOW_NAV_ITEMS.find((i) => i.href === "/decisions")!;
const GOALS_NAV = FLOW_NAV_ITEMS.find((i) => i.href === "/goals")!;
const TRACK_NAV = FLOW_NAV_ITEMS.find((i) => i.href === "/graph")!;
const REVIEW_NAV = FLOW_NAV_ITEMS.find((i) => i.href === "/review")!;

const IDEAS_ITEMS = [
  ...ROOT_NAV_GROUP.items,
  INBOX_NAV,
  THINKING_NAV,
  DECISIONS_NAV,
  GOALS_NAV,
  { ...TRACK_NAV, label: "问题追踪" },
  REVIEW_NAV,
] as const;

export function MobileIdeasMenu({ open, onClose }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  if (!open) return null;

  const isActive = (href: string) => {
    if (href === "/inbox") return isInboxNavActive(pathname);
    if (href === "/seeds") return isSeedsNavActive(pathname);
    if (href === "/thinking") return isThinkingNavActive(pathname);
    return isNavItemActive(pathname, href);
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-slate-900/25 backdrop-blur-[2px] md:hidden"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom))] left-4 right-4 z-[70] overflow-hidden rounded-3xl bg-white shadow-2xl shadow-slate-900/10 md:hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="text-sm font-semibold text-slate-800">想法</p>
        </div>
        <div className="grid grid-cols-4 gap-1 p-3">
          {IDEAS_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  onClose();
                  router.push(item.href);
                }}
                className={cn(
                  "flex flex-col items-center rounded-2xl px-1 py-3 text-[10px] transition active:scale-[0.97]",
                  active
                    ? "bg-[var(--primary-soft)] font-medium text-[var(--primary)]"
                    : "text-slate-600 hover:bg-slate-50"
                )}
              >
                <span className="mb-1.5 text-xl leading-none">{item.icon}</span>
                <span className="line-clamp-2 text-center leading-tight">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
        <div className="border-t border-slate-100 p-2">
          <button
            type="button"
            className="w-full rounded-xl py-2.5 text-sm text-slate-500 transition hover:bg-slate-50"
            onClick={onClose}
          >
            关闭
          </button>
        </div>
      </div>
    </>
  );
}
