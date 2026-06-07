"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { SeedLifeTimeline } from "@/components/seeds/SeedLifeTimeline";
import {
  classifySeed,
  SEED_PHASE_LABELS,
  seedBoardMeta,
} from "@/lib/seeds/classify";
import { ensureEntityHasSeed, getSeedForEntity } from "@/lib/seeds/ensure";
import { seedStageLabel } from "@/lib/seeds/labels";
import {
  getRecordFocusLabel,
  getRecordOriginLabel,
  TRIAGE_DESTINATION_LABELS,
} from "@/lib/triage/logic";
import { getTriageRecord } from "@/lib/triage/storage";
import type { IdeaSeed, SeedPhase } from "@/lib/seeds/types";
import type { TriageRecord } from "@/lib/triage/types";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const PHASE_SEED_STYLE: Record<
  SeedPhase,
  { icon: string; btn: string }
> = {
  sprouting: { icon: "🌰", btn: "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100" },
  growing: { icon: "🌱", btn: "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100" },
  archived: { icon: "🍂", btn: "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100" },
};

type Props = {
  entityId: string;
  title?: string;
  sourceTriageId?: string | null;
  className?: string;
};

export function ThinkingSeedBadge({
  entityId,
  title,
  sourceTriageId,
  className,
}: Props) {
  const [seed, setSeed] = useState<IdeaSeed | null>(null);
  const [triage, setTriage] = useState<TriageRecord | null>(null);
  const [open, setOpen] = useState(false);

  const refresh = useCallback(() => {
    if (!entityId) return;
    ensureEntityHasSeed({
      entityType: "thinking_session",
      entityId,
      title,
      stage: "thinking",
    });
    setSeed(getSeedForEntity("thinking_session", entityId));
  }, [entityId, title]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!sourceTriageId) {
      setTriage(null);
      return;
    }
    setTriage(getTriageRecord(sourceTriageId) ?? null);
  }, [sourceTriageId]);

  if (!entityId) return null;

  const phase = seed ? classifySeed(seed) : "sprouting";
  const style = PHASE_SEED_STYLE[phase];
  const meta = seed ? seedBoardMeta(seed) : null;
  const origin = seed?.events[0];
  const originLabel = origin ? seedStageLabel(origin.stage) : "—";

  return (
    <>
      <button
        type="button"
        title={`种子 · ${seed?.title ?? "未命名"} · ${SEED_PHASE_LABELS[phase]}`}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className={cn(
          "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium transition",
          style.btn,
          className
        )}
      >
        <span className="text-xs leading-none">{style.icon}</span>
        <span>{SEED_PHASE_LABELS[phase]}</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-black/30 p-4 sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xl">
                {style.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900">
                  {seed?.title ?? "未命名种子"}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {SEED_PHASE_LABELS[phase]}
                  {meta && ` · ${meta.stageCount} 个阶段`}
                </p>
              </div>
            </div>

            {triage && (
              <div className="mt-4 rounded-lg border border-[#E8ECF0] bg-[#FAFBFC] p-3">
                <p className="text-[10px] font-medium text-slate-500">
                  来自首页闪念
                </p>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  {triage.summary}
                </p>
                <div className="mt-2 flex flex-wrap gap-1 text-[10px]">
                  <span className="rounded bg-white px-1.5 py-0.5 text-slate-500 ring-1 ring-[#E2E8F0]">
                    {getRecordOriginLabel(triage)}
                  </span>
                  {getRecordFocusLabel(triage) && (
                    <span className="rounded bg-white px-1.5 py-0.5 text-slate-500 ring-1 ring-[#E2E8F0]">
                      {getRecordFocusLabel(triage)}
                    </span>
                  )}
                  <span className="rounded bg-[#EFF6FF] px-1.5 py-0.5 text-[#3B82F6]">
                    → {TRIAGE_DESTINATION_LABELS[triage.destination]}
                  </span>
                </div>
                {triage.worryPoints.length > 0 && (
                  <ul className="mt-2 space-y-0.5 text-[11px] text-slate-600">
                    <p className="text-[10px] text-slate-400">核心要点</p>
                    {triage.worryPoints.map((w, i) => (
                      <li key={i}>· {w}</li>
                    ))}
                  </ul>
                )}
                <p className="mt-2 text-[10px] text-slate-400">
                  {formatDate(triage.createdAt)}
                </p>
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-[#F8FAFC] px-3 py-2">
                <p className="text-[10px] text-slate-400">根源</p>
                <p className="mt-0.5 font-medium text-slate-700">{originLabel}</p>
              </div>
              <div className="rounded-lg bg-[#F8FAFC] px-3 py-2">
                <p className="text-[10px] text-slate-400">当前所在</p>
                <p className="mt-0.5 font-medium text-slate-700">
                  {meta?.currentStageLabel ?? "—"}
                </p>
              </div>
            </div>

            {seed && (
              <div className="mt-3 max-h-36 overflow-y-auto rounded-lg border border-[#E8ECF0] px-3 py-2">
                <p className="mb-2 text-[10px] font-medium text-slate-500">
                  生命轨迹
                </p>
                <SeedLifeTimeline seed={seed} compact maxEvents={6} />
              </div>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
              >
                关闭
              </button>
              {seed && (
                <Link
                  href={`/seeds/${seed.id}`}
                  className="rounded-lg bg-[#3B82F6] px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600"
                  onClick={() => setOpen(false)}
                >
                  查看种子详情 →
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
