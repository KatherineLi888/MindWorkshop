"use client";

import { formatNoteStamp } from "@/lib/utils";

type Props = {
  iso: string;
  className?: string;
};

/** 左侧紧凑时间框：年月日 + 时分 */
export function NoteTimeBadge({ iso, className }: Props) {
  const { ymd, hm } = formatNoteStamp(iso);
  return (
    <div
      className={
        className ??
        "flex w-[4.25rem] shrink-0 flex-col items-center justify-center rounded-md border border-[#E2E8F0] bg-white px-1 py-1.5 text-center leading-tight"
      }
    >
      <span className="text-[9px] tabular-nums text-slate-400">{ymd}</span>
      <span className="mt-0.5 text-[10px] font-medium tabular-nums text-slate-600">
        {hm}
      </span>
    </div>
  );
}
