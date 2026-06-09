"use client";

import Link from "next/link";
import { withStatsReturn } from "@/lib/navigation/return-to";
import { cn } from "@/lib/utils";

type ViewPreset = "today" | "week" | "month";

const ACTIONS = [
  {
    key: "thinking",
    label: "新建思考",
    icon: "◉",
    tint: "bg-violet-50 text-violet-700 ring-violet-100 hover:bg-violet-100/80",
    href: "/thinking",
  },
  {
    key: "decision",
    label: "新建决策",
    icon: "◇",
    tint: "bg-blue-50 text-blue-700 ring-blue-100 hover:bg-blue-100/80",
    href: "/decisions?new=1",
  },
  {
    key: "review",
    label: "新建复盘",
    icon: "◎",
    tint: "bg-cyan-50 text-cyan-700 ring-cyan-100 hover:bg-cyan-100/80",
    href: (preset: ViewPreset) => {
      const period =
        preset === "today" ? "day" : preset === "week" ? "week" : "month";
      return `/review/new?kind=period&periodPreset=${period}`;
    },
  },
  {
    key: "track",
    label: "新建问题追踪",
    icon: "◈",
    tint: "bg-amber-50 text-amber-700 ring-amber-100 hover:bg-amber-100/80",
    href: "/graph?new=1",
  },
] as const;

type Props = {
  preset: ViewPreset;
  className?: string;
};

export function DashboardQuickActions({ preset, className }: Props) {
  return (
    <div className={cn("grid grid-cols-4 gap-1.5", className)}>
      {ACTIONS.map((action) => {
        const raw =
          typeof action.href === "function"
            ? action.href(preset)
            : action.href;
        const href = withStatsReturn(raw);
        return (
          <Link
            key={action.key}
            href={href}
            className={cn(
              "flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-2 text-center ring-1 transition active:scale-[0.98]",
              action.tint
            )}
          >
            <span className="shrink-0 text-sm leading-none">{action.icon}</span>
            <span className="w-full truncate px-0.5 text-[9px] font-medium leading-tight">
              {action.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
