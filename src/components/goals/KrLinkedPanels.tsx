"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AnchorTrackSection } from "@/components/track/AnchorTrackSection";
import { loadReviewRecords } from "@/lib/review/storage";
import type { ReviewRecord } from "@/lib/review/types";
import { formatDate } from "@/lib/utils";

type Props = {
  goalId: string;
  goalTitle: string;
  krId: string;
  krTitle: string;
};

export function KrLinkedPanels({
  goalId,
  goalTitle,
  krId,
  krTitle,
}: Props) {
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [reviewOpen, setReviewOpen] = useState(false);

  const refresh = useCallback(() => {
    setReviews(
      loadReviewRecords().filter(
        (r) => r.goalId === goalId && r.krId === krId
      )
    );
  }, [goalId, krId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const label = krTitle.trim() || "未命名 KR";

  return (
    <div className="mt-2 space-y-2">
      <AnchorTrackSection
        anchorType="goal_kr"
        anchorId={krId}
        anchorTitle={`${goalTitle} · ${label}`}
      />

      <div className="rounded-lg border border-[#EEF1F5] bg-[#FAFBFC]">
        <button
          type="button"
          onClick={() => setReviewOpen((o) => !o)}
          className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left"
        >
          <span className="text-[11px] font-medium text-slate-700">
            复盘记录
            {reviews.length > 0 && (
              <span className="ml-1.5 text-[10px] font-normal text-slate-400">
                {reviews.length} 条
              </span>
            )}
          </span>
          <span className="text-[10px] text-slate-400">
            {reviewOpen ? "收起" : "展开"}
          </span>
        </button>
        {reviewOpen && (
          <div className="space-y-2 border-t border-[#EEF1F5] px-3 pb-3 pt-2">
            {reviews.length === 0 ? (
              <p className="text-center text-[10px] text-slate-400">
                暂无复盘 ·
                <Link
                  href={`/review?goalId=${goalId}&krId=${krId}&krLabel=${encodeURIComponent(label)}`}
                  className="mx-0.5 text-[#1D4ED8] hover:underline"
                >
                  新建复盘
                </Link>
              </p>
            ) : (
              <>
                <ul className="space-y-1">
                  {reviews.slice(0, 5).map((r) => (
                    <li key={r.id}>
                      <Link
                        href="/review"
                        className="block rounded-md bg-white px-2 py-1.5 text-[10px] text-slate-600 ring-1 ring-[#EEF1F5] hover:ring-[#BFDBFE]"
                      >
                        <span className="font-medium text-slate-800">
                          {r.title}
                        </span>
                        <span className="ml-1.5 text-slate-400">
                          {formatDate(r.updatedAt)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/review?goalId=${goalId}&krId=${krId}&krLabel=${encodeURIComponent(label)}`}
                  className="block text-center text-[10px] text-[#1D4ED8] hover:underline"
                >
                  + 新建 KR 复盘
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
