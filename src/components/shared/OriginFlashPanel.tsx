"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getRecordFocusLabel,
  getRecordOriginLabel,
  TRIAGE_DESTINATION_LABELS,
} from "@/lib/triage/logic";
import { getTriageRecord } from "@/lib/triage/storage";
import type { TriageRecord } from "@/lib/triage/types";
import { formatDate } from "@/lib/utils";

type Props = {
  triageId: string | null | undefined;
  className?: string;
};

export function OriginFlashPanel({ triageId, className }: Props) {
  const [record, setRecord] = useState<TriageRecord | null>(null);

  useEffect(() => {
    if (!triageId) {
      setRecord(null);
      return;
    }
    setRecord(getTriageRecord(triageId) ?? null);
  }, [triageId]);

  if (!record) return null;

  const focusLabel = getRecordFocusLabel(record);

  return (
    <div
      className={
        className ??
        "rounded-xl border border-[#E2E8F0] bg-[#FAFBFC] px-4 py-3"
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold text-slate-600">来自首页闪念</p>
        <span className="text-[10px] text-slate-400">
          {formatDate(record.createdAt)}
        </span>
      </div>
      <p className="mt-2 text-sm font-medium text-slate-800">{record.summary}</p>
      <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
        <span className="rounded bg-white px-2 py-0.5 text-slate-500 ring-1 ring-[#E2E8F0]">
          {getRecordOriginLabel(record)}
        </span>
        {focusLabel && (
          <span className="rounded bg-white px-2 py-0.5 text-slate-500 ring-1 ring-[#E2E8F0]">
            {focusLabel}
          </span>
        )}
        <span className="rounded bg-[#EFF6FF] px-2 py-0.5 text-[#3B82F6] ring-1 ring-[#BFDBFE]">
          → {TRIAGE_DESTINATION_LABELS[record.destination]}
        </span>
      </div>
      {record.worryPoints.length > 0 && (
        <div className="mt-2">
          <p className="text-[10px] text-slate-400">核心要点</p>
          <ul className="mt-0.5 space-y-0.5 text-[11px] leading-relaxed text-slate-500">
          {record.worryPoints.map((w, i) => (
            <li key={i} className="flex gap-1.5">
              <span className="shrink-0 text-slate-300">·</span>
              <span>{w}</span>
            </li>
          ))}
          </ul>
        </div>
      )}
      <details className="mt-2">
        <summary className="cursor-pointer text-[10px] text-slate-400 hover:text-slate-600">
          查看原始闪念
        </summary>
        <p className="mt-1 whitespace-pre-wrap text-[11px] leading-relaxed text-slate-500">
          {record.rawText}
        </p>
      </details>
      <div className="mt-2 flex flex-wrap gap-3 text-[10px]">
        <Link href="/home" className="text-[#3B82F6] hover:underline">
          返回首页定位
        </Link>
        <Link href="/home/records" className="text-slate-400 hover:text-slate-600">
          全部闪念记录
        </Link>
      </div>
    </div>
  );
}
