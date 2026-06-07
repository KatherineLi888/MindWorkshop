"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FlowListContextMenu } from "@/components/flow/FlowListContextMenu";
import { registerFlowEntry } from "@/lib/flow/pipeline-storage";
import { SeedLinkPanel } from "@/components/seeds/SeedLinkPanel";
import { OriginFlashPanel } from "@/components/shared/OriginFlashPanel";
import { PageHeader } from "@/components/layout/PageHeader";
import { ExportExcelButton } from "@/components/shared/ExportExcelButton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { buildPendingGoal, persistNewGoal } from "@/lib/goals/storage";
import {
  addInboxItem,
  loadAllInboxItems,
  removeInboxItem,
  type InboxListItem,
} from "@/lib/inbox/storage";
import { cn, formatDate } from "@/lib/utils";

const FILTERS = [
  { id: "all", label: "全部" },
  { id: "待定", label: "待定目标" },
  { id: "未归类", label: "未归类" },
] as const;


export function InboxClient() {
  const searchParams = useSearchParams();
  const triageId = searchParams.get("triage");
  const [items, setItems] = useState<InboxListItem[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    item: InboxListItem;
    x: number;
    y: number;
  } | null>(null);

  const refresh = useCallback(async () => {
    setItems(await loadAllInboxItems());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((i) => i.itemType.includes(filter));
  }, [items, filter]);

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    setAdding(true);
    const next = await addInboxItem(newTitle.trim());
    const added = next.find(
      (i) => i.source === "inbox" && i.title === newTitle.trim()
    );
    if (added) registerFlowEntry("inbox_manual", added.id, "inbox");
    setItems(next);
    setNewTitle("");
    setAdding(false);
  };

  const handleRemove = async (item: InboxListItem) => {
    if (item.source === "goal") return;
    setItems(await removeInboxItem(item.id));
  };

  const handleQuickPending = async (title: string) => {
    await persistNewGoal(buildPendingGoal(title));
    const manual = items.find(
      (i) => i.source === "inbox" && i.title === title
    );
    if (manual) {
      setItems(await removeInboxItem(manual.id));
    } else {
      await refresh();
    }
  };

  const exportRows = filtered.map((i) => ({
    标题: i.title,
    类型: i.itemType,
    来源: i.source === "goal" ? "待定目标" : "收集箱",
    时间: formatDate(i.createdAt),
  }));

  return (
    <div
      className="mx-auto max-w-2xl space-y-5 p-4 lg:p-6"
      onClick={() => setContextMenu(null)}
    >
      <PageHeader
        title="收集箱"
        description="集中展示待定目标与未归类事项。可从条目一键发起决策或设立目标。"
        secondaryLink={{ label: "决策树 →", href: "/decisions" }}
        actions={
          <ExportExcelButton rows={exportRows} fileName="inbox.xlsx" sheetName="收集箱" />
        }
      />

      {triageId && <OriginFlashPanel triageId={triageId} />}

      <Card className="bg-white">
        <label className="text-xs font-medium text-slate-600">快速收录</label>
        <div className="mt-2 flex flex-wrap gap-2">
          <Input
            className="min-w-[200px] flex-1"
            placeholder="脑子里冒出来的事，先记下来"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <Button
            variant="primary"
            size="sm"
            disabled={!newTitle.trim() || adding}
            onClick={handleAdd}
          >
            收入收集箱
          </Button>
        </div>
      </Card>

      <div className="flex gap-1 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-xs transition",
              filter === f.id
                ? "bg-[#3B82F6] text-white"
                : "bg-[#F8FAFC] text-slate-600 hover:bg-slate-100"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <ul className="space-y-2">
        {filtered.map((item) => (
          <li
            key={item.id}
            className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3"
          >
            <div
              onContextMenu={(e) => {
                if (item.source !== "inbox") return;
                e.preventDefault();
                setContextMenu({ item, x: e.clientX, y: e.clientY });
              }}
            >
              <p className="text-sm font-medium text-slate-800">{item.title}</p>
              <p className="mt-0.5 text-[10px] text-slate-400">
                {item.itemType} · {formatDate(item.createdAt)}
              </p>
              <SeedLinkPanel
                entityType={item.source === "goal" ? "goal" : "inbox_manual"}
                entityId={
                  item.source === "goal" ? item.goalId ?? item.id : item.id
                }
                title={item.title}
                stage={item.source === "goal" ? "goals" : "inbox"}
                compact
                className="mt-1.5"
              />
            </div>
            {item.goalId && item.source === "goal" && (
              <div className="mt-2">
                <Link href={`/goals?detail=${item.goalId}`}>
                  <Button size="sm" variant="secondary">
                    查看目标
                  </Button>
                </Link>
              </div>
            )}
            {item.source === "goal" && (
              <Button
                size="sm"
                variant="ghost"
                className="mt-2"
                onClick={() => handleQuickPending(item.title)}
              >
                快速收录为待定
              </Button>
            )}
          </li>
        ))}
        {filtered.length === 0 && (
          <p className="rounded-xl border border-dashed border-[#E2E8F0] py-16 text-center text-sm text-slate-400">
            收集箱为空，把待处理的事先记下来吧
          </p>
        )}
      </ul>

      <p className="text-center text-[10px] text-slate-400">
        右键可删除或跳入下一环节
      </p>

      {contextMenu && contextMenu.item.source === "inbox" && (
        <FlowListContextMenu
          fromStage="inbox"
          title={contextMenu.item.title}
          entityId={contextMenu.item.id}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          extraItems={[
            {
              type: "action",
              label: "删除",
              danger: true,
              onClick: () => handleRemove(contextMenu.item),
            },
          ]}
        />
      )}
    </div>
  );
}
