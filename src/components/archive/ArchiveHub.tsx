"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { ArchivedSeedsPanel } from "@/components/archive/ArchivedSeedsPanel";
import { DecisionsClient } from "@/components/decision/DecisionsClient";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "decisions" as const, label: "决策" },
  { id: "goals" as const, label: "目标" },
  { id: "inbox" as const, label: "收集箱" },
  { id: "seeds" as const, label: "种子" },
];

export function ArchiveHub() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("decisions");

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t === "decisions" || t === "goals" || t === "inbox" || t === "seeds") {
      setTab(t);
    }
  }, [searchParams]);

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <PageHeader
        title="总归档箱"
        description="各栏目的已归档内容集中在此，便于统一查看与恢复。"
        secondaryLink={{ label: "返回工作台 →", href: "/decisions" }}
      />

      <div className="flex gap-1 border-b border-[#E2E8F0]">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "border-b-2 px-4 py-2 text-sm transition-colors",
              tab === t.id
                ? "border-[#3B82F6] font-medium text-[#3B82F6]"
                : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "decisions" && (
        <DecisionsClient archiveBox embeddedInArchive />
      )}
      {tab === "goals" && (
        <p className="rounded-xl border border-dashed border-[#E2E8F0] py-16 text-center text-sm text-slate-400">
          目标归档即将支持
        </p>
      )}
      {tab === "inbox" && (
        <p className="rounded-xl border border-dashed border-[#E2E8F0] py-16 text-center text-sm text-slate-400">
          收集箱归档即将支持
        </p>
      )}
      {tab === "seeds" && <ArchivedSeedsPanel />}
    </div>
  );
}
