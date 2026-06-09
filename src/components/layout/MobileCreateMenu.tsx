"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
};

const QUICK_WRITE = {
  label: "随便写写...",
  href: "/home",
  description: "零散想法，先记下来",
} as const;

const CREATE_ITEMS = [
  {
    key: "thinking",
    label: "思考",
    icon: "◉",
    href: "/thinking",
    tagline: "理理头绪，看得更清楚",
    tint: "hover:bg-violet-50/80",
  },
  {
    key: "decision",
    label: "决策",
    icon: "◇",
    href: "/decisions?new=1",
    tagline: "真的要花时间做吗？",
    tint: "hover:bg-blue-50/80",
  },
  {
    key: "goal",
    label: "目标",
    icon: "◎",
    href: "/goals?new=1",
    tagline: "下定决心就执行到底！",
    tint: "hover:bg-emerald-50/80",
  },
  {
    key: "track",
    label: "问题追踪",
    icon: "◈",
    href: "/graph?new=1",
    tagline: "问题是成长的加速器",
    tint: "hover:bg-amber-50/80",
  },
] as const;

function MenuLink({
  href,
  onNavigate,
  className,
  children,
}: {
  href: string;
  onNavigate: () => void;
  className?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  return (
    <Link
      href={href}
      onClick={(e) => {
        e.preventDefault();
        onNavigate();
        router.push(href);
      }}
      className={className}
    >
      {children}
    </Link>
  );
}

export function MobileCreateMenu({ open, onClose }: Props) {
  if (!open) return null;

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
          <p className="text-sm font-semibold text-slate-800">新建</p>
        </div>

        <div className="p-2">
          <MenuLink
            href={QUICK_WRITE.href}
            onNavigate={onClose}
            className="mb-1 flex w-full items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3.5 transition active:scale-[0.99] hover:bg-slate-100/80"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-base text-slate-600 shadow-sm">
              ✎
            </span>
            <div className="min-w-0 flex-1 text-left">
              <span className="text-sm font-medium text-slate-900">
                {QUICK_WRITE.label}
              </span>
              <p className="mt-0.5 text-xs text-slate-400">
                {QUICK_WRITE.description}
              </p>
            </div>
          </MenuLink>

          <MenuLink
            href="/ai"
            onNavigate={onClose}
            className="mb-1 flex w-full items-center gap-3 rounded-2xl px-4 py-3 transition active:scale-[0.99] hover:bg-indigo-50/80"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-semibold text-indigo-600">
              AI
            </span>
            <div className="min-w-0 flex-1 text-left">
              <span className="text-sm font-medium text-slate-900">AI 助手</span>
              <p className="mt-0.5 text-xs text-slate-400">
                查目标、建复盘、对话创建
              </p>
            </div>
          </MenuLink>

          <ul className="space-y-0.5">
            {CREATE_ITEMS.map((item) => (
              <li key={item.key}>
                <MenuLink
                  href={item.href}
                  onNavigate={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 transition active:scale-[0.99]",
                    item.tint
                  )}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-base text-slate-600">
                    {item.icon}
                  </span>
                  <div className="min-w-0 flex-1 text-left">
                    <span className="text-sm font-medium text-slate-900">
                      {item.label}
                    </span>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {item.tagline}
                    </p>
                  </div>
                </MenuLink>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-slate-100 p-2">
          <button
            type="button"
            className="w-full rounded-xl py-2.5 text-sm text-slate-500 transition hover:bg-slate-50"
            onClick={onClose}
          >
            取消
          </button>
        </div>
      </div>
    </>
  );
}
