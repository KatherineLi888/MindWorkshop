"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { HeaderAddButton } from "@/components/layout/HeaderAddButton";
import { MODULE_INTRO } from "@/lib/module-copy";
import { loadReviewRecords } from "@/lib/review/storage";
import type { ReviewKind, ReviewRecord } from "@/lib/review/types";
import { MarkdownContent } from "@/components/shared/MarkdownContent";
import { formatDate } from "@/lib/utils";

const KIND_LABELS: Record<ReviewKind, string> = {
  period: "周期复盘",
  goal: "目标复盘",
  event: "事件复盘",
  decision: "决策复盘",
};

export function ReviewClient() {
  const router = useRouter();
  const [records, setRecords] = useState<ReviewRecord[]>([]);

  const refreshRecords = useCallback(() => {
    setRecords(loadReviewRecords());
  }, []);

  useEffect(() => {
    refreshRecords();
  }, [refreshRecords]);

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <PageHeader
        title="复盘"
        description={MODULE_INTRO.review}
        actions={
          <HeaderAddButton
            title="新建复盘"
            onClick={() => router.push("/review/new")}
          />
        }
      />

      <section>
        {records.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#E2E8F0] bg-white py-16 text-center">
            <p className="text-sm text-slate-500">暂无复盘记录</p>
            <Link
              href="/review/new"
              className="mt-2 inline-block text-xs text-[#3B82F6] hover:underline"
            >
              开始第一次复盘 →
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {records.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/review/new?edit=${r.id}`}
                  className="block w-full rounded-lg border border-[#EEF1F5] bg-white px-3 py-2.5 text-left transition hover:bg-[#FAFBFC]"
                >
                  <span className="text-[10px] text-slate-400">
                    {KIND_LABELS[r.kind]} · {formatDate(r.updatedAt)}
                  </span>
                  <p className="text-sm font-medium text-slate-800">{r.title}</p>
                  {r.summary && (
                    <div className="mt-1 line-clamp-3 overflow-hidden">
                      <MarkdownContent
                        source={r.summary}
                        className="!text-xs !text-slate-500"
                      />
                    </div>
                  )}
                  {r.highlights.length > 0 && (
                    <p className="mt-0.5 text-[10px] text-[#1D4ED8]">
                      关联 {r.highlights.length} 个数据点
                    </p>
                  )}
                  {r.kind === "decision" &&
                    (r.decisionHighlights || r.decisionSummary) && (
                      <p className="mt-0.5 text-[10px] text-slate-400">
                        含决策梳理记录
                      </p>
                    )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
