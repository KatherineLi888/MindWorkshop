"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { SeedLinkPanel } from "@/components/seeds/SeedLinkPanel";
import { PageHeader } from "@/components/layout/PageHeader";
import { ExportExcelButton } from "@/components/shared/ExportExcelButton";
import { Card } from "@/components/ui/card";
import {
  getRecordFocusLabel,
  getRecordOriginLabel,
  TRIAGE_DESTINATION_LABELS,
} from "@/lib/triage/logic";
import { triageRecordsToExportRows } from "@/lib/triage/record-export";
import { loadTriageRecords } from "@/lib/triage/storage";
import type { TriageRecord } from "@/lib/triage/types";
import { formatDate } from "@/lib/utils";

function entityHref(record: TriageRecord): string | null {
  if (!record.targetEntityId) return null;
  switch (record.targetEntityType) {
    case "inbox":
      return `/inbox?triage=${record.id}`;
    case "thinking_session":
      return `/thinking?session=${record.targetEntityId}&triage=${record.id}`;
    case "decision":
      return `/decisions?triage=${record.id}`;
    default:
      return null;
  }
}

export function TriageRecordsClient() {
  const [records, setRecords] = useState<TriageRecord[]>([]);

  const refresh = useCallback(() => {
    setRecords(loadTriageRecords());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const exportRows = triageRecordsToExportRows(records);

  return (
    <div className="space-y-5 p-4 lg:p-6">
      <PageHeader
        title="闪念记录"
        description="每次首页定位与梳理的完整记录，便于回溯当时想了什么、去了哪里。"
        secondaryLink={{ label: "← 返回首页", href: "/home" }}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/home/funnel"
              className="text-xs text-[#3B82F6] hover:underline"
            >
              流程漏斗 →
            </Link>
            <ExportExcelButton
              rows={exportRows}
              fileName="triage-records.xlsx"
              sheetName="闪念记录"
            />
          </div>
        }
      />

      {records.length === 0 ? (
        <Card className="bg-white py-16 text-center">
          <p className="text-sm text-slate-500">还没有闪念记录</p>
          <p className="mt-1 text-xs text-slate-400">
            在首页完成定位并进入流程后，记录会出现在这里
          </p>
          <Link
            href="/home"
            className="mt-4 inline-block text-sm text-[#3B82F6] hover:underline"
          >
            去首页写闪念
          </Link>
        </Card>
      ) : (
        <ul className="space-y-3">
          {records.map((r) => {
            const href = entityHref(r);
            return (
              <li key={r.id}>
                <Card className="bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800">
                        {r.summary}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        {formatDate(r.createdAt)} · {getRecordOriginLabel(r)}
                        {getRecordFocusLabel(r)
                          ? ` · ${getRecordFocusLabel(r)}`
                          : ""}{" "}
                        · → {TRIAGE_DESTINATION_LABELS[r.destination]}
                      </p>
                      <SeedLinkPanel
                        entityType="triage"
                        entityId={r.id}
                        title={r.summary || r.rawText}
                        stage="home"
                        compact
                        className="mt-1.5"
                      />
                    </div>
                    {href && (
                      <Link
                        href={href}
                        className="shrink-0 text-xs text-[#3B82F6] hover:underline"
                      >
                        打开关联
                      </Link>
                    )}
                  </div>

                  {r.worryPoints.length > 0 && (
                    <ul className="mt-3 space-y-0.5 text-[11px] text-slate-500">
                      {r.worryPoints.map((w, i) => (
                        <li key={i} className="flex gap-1.5">
                          <span className="shrink-0 text-slate-300">·</span>
                          <span>{w}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <details className="mt-3">
                    <summary className="cursor-pointer text-[10px] text-slate-400 hover:text-slate-600">
                      原始闪念
                    </summary>
                    <p className="mt-1 whitespace-pre-wrap text-[11px] leading-relaxed text-slate-500">
                      {r.rawText}
                    </p>
                  </details>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
