"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { buildEventSummary } from "@/lib/seeds/event-summary";
import { loadEntityFullContent } from "@/lib/seeds/entity-content";
import { seedEntityHref } from "@/lib/seeds/resolve-href";
import { SEED_ACTION_LABELS, seedStageLabel } from "@/lib/seeds/labels";
import type { IdeaSeed } from "@/lib/seeds/types";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

type ViewMode = "summary" | "full";

const STAGE_DOT: Record<string, string> = {
  thinking: "bg-violet-500",
  decisions: "bg-blue-500",
  goals: "bg-emerald-500",
  track: "bg-amber-500",
  theory: "bg-violet-400",
  inbox: "bg-slate-400",
  home: "bg-rose-400",
};

type Props = {
  seed: IdeaSeed;
  returnTo: string;
};

export function SeedTimelineViews({ seed, returnTo }: Props) {
  const [mode, setMode] = useState<ViewMode>("summary");

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-800">阶段与时间线</h2>
        <div className="flex rounded-lg border border-[#E2E8F0] p-0.5 text-[10px]">
          <button
            type="button"
            onClick={() => setMode("summary")}
            className={cn(
              "rounded-md px-2.5 py-1 transition",
              mode === "summary"
                ? "bg-[#3B82F6] text-white"
                : "text-slate-600 hover:bg-slate-50"
            )}
          >
            简洁概要
          </button>
          <button
            type="button"
            onClick={() => setMode("full")}
            className={cn(
              "rounded-md px-2.5 py-1 transition",
              mode === "full"
                ? "bg-[#3B82F6] text-white"
                : "text-slate-600 hover:bg-slate-50"
            )}
          >
            完整详情
          </button>
        </div>
      </div>
      <p className="mt-0.5 text-[10px] text-slate-400">
        {mode === "summary"
          ? "核心节点与关键选择"
          : "完整思考链路与问答记录"}
      </p>

      <ul className="mt-4 space-y-0">
        {seed.events.map((ev, i) => (
          <TimelineEvent
            key={ev.id}
            seed={seed}
            index={i}
            mode={mode}
            returnTo={returnTo}
          />
        ))}
      </ul>
    </div>
  );
}

function TimelineEvent({
  seed,
  index,
  mode,
  returnTo,
}: {
  seed: IdeaSeed;
  index: number;
  mode: ViewMode;
  returnTo: string;
}) {
  const ev = seed.events[index];
  const prev = index > 0 ? seed.events[index - 1] : undefined;
  const summary = buildEventSummary(ev, prev);
  const href = seedEntityHref(ev.entityType, ev.entityId, returnTo);
  const isLast = index === seed.events.length - 1;
  const [fullBlocks, setFullBlocks] = useState<
    Awaited<ReturnType<typeof loadEntityFullContent>>
  >([]);

  useEffect(() => {
    if (mode !== "full") return;
    let alive = true;
    void loadEntityFullContent(ev).then((blocks) => {
      if (alive) setFullBlocks(blocks);
    });
    return () => {
      alive = false;
    };
  }, [mode, ev.id, ev.entityId, ev.entityType]);

  return (
    <li className="relative flex gap-4 pb-6">
      {!isLast && (
        <span
          className="absolute left-[11px] top-5 bottom-0 w-px bg-[#E2E8F0]"
          aria-hidden
        />
      )}
      <span
        className={cn(
          "relative z-10 mt-1 h-6 w-6 shrink-0 rounded-full ring-2 ring-white",
          STAGE_DOT[ev.stage] ?? "bg-slate-300"
        )}
        aria-hidden
      />
      <div className="min-w-0 flex-1 border-b border-[#F1F5F9] pb-4 last:border-0">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <span className="text-sm font-medium text-slate-800">
              {seedStageLabel(ev.stage)}
            </span>
            <span className="ml-2 text-[10px] text-slate-400">
              {SEED_ACTION_LABELS[ev.action]}
            </span>
          </div>
          <span className="text-[10px] text-slate-400">
            {formatDate(ev.createdAt)}
          </span>
        </div>

        {mode === "summary" ? (
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            {summary}
          </p>
        ) : (
          <div className="mt-2 space-y-2">
            <p className="text-xs text-slate-500">{summary}</p>
            {fullBlocks.map((block) => (
              <div
                key={block.heading}
                className="rounded-lg bg-[#F8FAFC] px-2.5 py-2"
              >
                <p className="text-[10px] font-medium text-slate-500">
                  {block.heading}
                </p>
                <ul className="mt-1 space-y-1">
                  {block.lines.map((line, li) => (
                    <li
                      key={li}
                      className="text-[11px] leading-relaxed text-slate-700"
                    >
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {href && (
          <Link
            href={href}
            className="mt-2 inline-block text-[11px] text-[#1D4ED8] hover:underline"
          >
            查看此时记录 →
          </Link>
        )}
      </div>
    </li>
  );
}
