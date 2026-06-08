"use client";

import Link from "next/link";
import { buildEventSummary } from "@/lib/seeds/event-summary";
import { SEED_ACTION_LABELS, seedStageLabel } from "@/lib/seeds/labels";
import { seedEntityHref } from "@/lib/seeds/resolve-href";
import type { IdeaSeed, SeedLifeEvent } from "@/lib/seeds/types";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const STAGE_DOT: Record<string, string> = {
  inbox: "bg-slate-400",
  thinking: "bg-violet-500",
  decisions: "bg-blue-500",
  goals: "bg-emerald-500",
  track: "bg-amber-500",
  review: "bg-cyan-500",
  home: "bg-rose-400",
  model: "bg-fuchsia-500",
  theory: "bg-violet-400",
  canvas: "bg-teal-500",
};

const STAGE_RING: Record<string, string> = {
  inbox: "ring-slate-200",
  thinking: "ring-violet-200",
  decisions: "ring-blue-200",
  goals: "ring-emerald-200",
  track: "ring-amber-200",
  review: "ring-cyan-200",
  home: "ring-rose-200",
  model: "ring-fuchsia-200",
  theory: "ring-violet-200",
  canvas: "ring-teal-200",
};

function EventRow({
  event,
  prev,
  isLast,
  compact,
  returnTo,
}: {
  event: SeedLifeEvent;
  prev?: SeedLifeEvent;
  isLast: boolean;
  compact?: boolean;
  returnTo?: string;
}) {
  const href = seedEntityHref(event.entityType, event.entityId, returnTo);
  const dot = STAGE_DOT[event.stage] ?? "bg-slate-300";
  const ring = STAGE_RING[event.stage] ?? "ring-slate-200";

  return (
    <div className={cn("relative flex gap-3", !isLast && "pb-3")}>
      {!isLast && (
        <span
          className="absolute left-[7px] top-4 bottom-0 w-px bg-[#E2E8F0]"
          aria-hidden
        />
      )}
      <span
        className={cn(
          "relative z-10 mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full ring-2",
          dot,
          ring
        )}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-xs font-medium text-slate-800">
            {seedStageLabel(event.stage)}
          </span>
          <span className="text-[10px] text-slate-400">
            {SEED_ACTION_LABELS[event.action]}
          </span>
          {!compact && (
            <span className="text-[10px] text-slate-400">
              {formatDate(event.createdAt)}
            </span>
          )}
        </div>
        {!compact && (
          <p className="mt-0.5 text-[10px] text-slate-500">
            {buildEventSummary(event, prev)}
          </p>
        )}
        {href ? (
          <Link
            href={href}
            className="mt-0.5 inline-block text-[10px] text-[#1D4ED8] hover:underline"
          >
            查看此时记录 →
          </Link>
        ) : (
          <p className="mt-0.5 text-[10px] text-slate-400">
            {event.entityType}
          </p>
        )}
      </div>
    </div>
  );
}

export function SeedLifeTimeline({
  seed,
  compact = false,
  maxEvents,
}: {
  seed: IdeaSeed;
  compact?: boolean;
  maxEvents?: number;
}) {
  const events = maxEvents ? seed.events.slice(-maxEvents) : seed.events;
  const hidden = maxEvents ? Math.max(0, seed.events.length - maxEvents) : 0;

  return (
    <div>
      {hidden > 0 && (
        <p className="mb-2 text-[10px] text-slate-400">… 还有 {hidden} 步</p>
      )}
      {events.map((ev, i) => (
        <EventRow
          key={ev.id}
          event={ev}
          prev={i > 0 ? events[i - 1] : undefined}
          isLast={i === events.length - 1 && seed.status !== "ended"}
          compact={compact}
        />
      ))}
      {seed.status === "ended" && (
        <div className="relative flex gap-3">
          <span className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full bg-slate-300 ring-2 ring-slate-200" />
          <div>
            <p className="text-xs font-medium text-slate-500">种子结束</p>
            {seed.endReason && (
              <p className="text-[10px] text-slate-400">{seed.endReason}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** 横向轨迹点（仪表盘等紧凑场景） */
export function SeedLifeDots({ seed }: { seed: IdeaSeed }) {
  const events = seed.events.slice(-8);
  return (
    <div className="flex items-center gap-0.5 overflow-x-auto py-1">
      {events.map((ev, i) => (
        <span key={ev.id} className="flex shrink-0 items-center gap-0.5">
          {i > 0 && <span className="h-px w-2 bg-slate-200" />}
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              STAGE_DOT[ev.stage] ?? "bg-slate-300"
            )}
            title={`${seedStageLabel(ev.stage)} · ${SEED_ACTION_LABELS[ev.action]}`}
          />
        </span>
      ))}
      {seed.status === "ended" && (
        <>
          <span className="h-px w-2 bg-slate-200" />
          <span className="text-[9px] text-slate-400">终</span>
        </>
      )}
    </div>
  );
}
