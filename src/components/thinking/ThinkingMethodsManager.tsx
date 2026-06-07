"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useThinkingMethods } from "@/components/thinking/ThinkingMethodsContext";
import { MethodUsageFlowRow } from "@/components/thinking/MethodUsageFlowRow";
import {
  MethodFormActions,
  MethodFormFields,
  MethodPreviewStrip,
} from "@/components/thinking/method-library-shared";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import {
  addInspiration,
  getInspirationsForMethod,
  getUsageAnnotation,
  loadMethodMeta,
  removeInspiration,
  sortUsagesWithMeta,
  toggleInspirationPin,
  toggleUsageFlag,
  type MethodMetaStore,
} from "@/lib/thinking/method-meta";
import { countMethodUsages, collectMethodUsages } from "@/lib/thinking/method-usage";
import { createCustomMethod } from "@/lib/thinking/method-store";
import { loadThoughtSessions } from "@/lib/thinking/storage";
import type { StoredThinkingMethod } from "@/lib/thinking/methods";
import { formatDate } from "@/lib/utils";

export function ThinkingMethodsManager() {
  const searchParams = useSearchParams();
  const paramSelected = searchParams.get("selected");
  const {
    stored,
    updateMethod,
    addMethod,
    deleteMethod,
    resetDefaults,
  } = useThinkingMethods();

  const [selectedId, setSelectedId] = useState(
    paramSelected && stored.some((m) => m.id === paramSelected)
      ? paramSelected
      : stored[0]?.id ?? ""
  );
  const [draft, setDraft] = useState<StoredThinkingMethod | null>(null);
  const [meta, setMeta] = useState<MethodMetaStore>(() => loadMethodMeta());
  const [tab, setTab] = useState<"usages" | "inspirations">("usages");
  const [inspirationDraft, setInspirationDraft] = useState("");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);
  const [newDraft, setNewDraft] = useState(() =>
    createCustomMethod({
      label: "",
      short: "",
      description: "",
      promptPattern: "关于「{anchor}」？",
    })
  );

  const sessions = useMemo(() => loadThoughtSessions(), [meta, stored]);

  const selected = stored.find((m) => m.id === selectedId) ?? stored[0];

  useEffect(() => {
    if (paramSelected && stored.some((m) => m.id === paramSelected)) {
      setSelectedId(paramSelected);
    }
  }, [paramSelected, stored]);

  useEffect(() => {
    if (selected) setDraft({ ...selected });
    setEditing(false);
  }, [selectedId, selected]);

  const usages = useMemo(() => {
    if (!selected) return [];
    return sortUsagesWithMeta(
      collectMethodUsages(selected.id, selected.short, sessions),
      meta
    );
  }, [selected, sessions, meta]);

  const inspirations = useMemo(() => {
    if (!selected) return [];
    return getInspirationsForMethod(selected.id, meta);
  }, [selected, meta]);

  const refreshMeta = () => setMeta(loadMethodMeta());

  const saveSelected = () => {
    if (!draft) return;
    updateMethod(draft);
    setEditing(false);
  };

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setTab("usages");
  };

  const submitNew = () => {
    if (!newDraft.label.trim() || !newDraft.short.trim()) return;
    const created = addMethod({
      label: newDraft.label.trim(),
      short: newDraft.short.trim(),
      description: newDraft.description.trim() || "自定义思考方法",
      promptPattern: newDraft.promptPattern.trim() || "关于「{anchor}」？",
      color: newDraft.color,
      railBg: newDraft.railBg,
      contentBg: newDraft.contentBg,
    });
    setSelectedId(created.id);
    setAdding(false);
    setNewDraft(
      createCustomMethod({
        label: "",
        short: "",
        description: "",
        promptPattern: "关于「{anchor}」？",
      })
    );
  };

  if (!selected || !draft) {
    return (
      <div className="p-6">
        <p className="text-sm text-slate-500">暂无方法，请先添加。</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col p-4 lg:p-6">
      <PageHeader
        title="方法库"
        description="管理思考方法、查看使用记录与灵感备忘。"
        secondaryLink={{ label: "← 返回思考", href: "/thinking" }}
        actions={
          <>
            <Button size="sm" variant="secondary" onClick={() => setAdding(true)}>
              + 添加方法
            </Button>
            <Button size="sm" variant="ghost" onClick={resetDefaults}>
              恢复默认
            </Button>
          </>
        }
      />

      <div className="mt-4 grid min-h-0 flex-1 gap-3 lg:grid-cols-[220px_1fr]">
        <Card className="flex max-h-[70vh] flex-col overflow-hidden bg-white lg:max-h-none">
          <p className="border-b border-[#EEF1F5] px-3 py-2 text-xs font-medium text-slate-600">
            全部方法
          </p>
          <ul className="min-h-0 flex-1 overflow-y-auto p-2">
            {stored.map((m) => {
              const count = countMethodUsages(m.id, m.short, sessions);
              const active = m.id === selectedId;
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(m.id)}
                    className={`mb-1 w-full rounded-lg px-2.5 py-2 text-left transition-colors ${
                      active
                        ? "bg-[#EEF2FF] text-[#4338CA]"
                        : "hover:bg-[#FAFBFC] text-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-medium">{m.label}</span>
                      <span className="text-[10px] tabular-nums text-slate-400">
                        {count} 次
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-[10px] text-slate-400">
                      {m.description}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>

        <div className="min-h-0 space-y-3 overflow-y-auto">
          {adding && (
            <Card className="space-y-2 border-dashed bg-[#FAFBFC] p-3">
              <p className="text-xs font-medium text-slate-700">新建方法</p>
              <MethodFormFields
                draft={newDraft}
                onChange={setNewDraft}
                showPreview
              />
              <MethodFormActions
                onSave={submitNew}
                onCancel={() => setAdding(false)}
                saveLabel="创建"
              />
            </Card>
          )}

          <Card className="bg-white p-3">
            {!editing ? (
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">
                      {draft.label}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-500">
                      {draft.description}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    type="button"
                    onClick={() => setEditing(true)}
                  >
                    编辑
                  </Button>
                </div>
                <MethodPreviewStrip method={draft} />
              </div>
            ) : (
              <div className="space-y-3">
                <MethodFormFields draft={draft} onChange={setDraft} />
                <MethodFormActions
                  onSave={saveSelected}
                  onCancel={() => {
                    setDraft({ ...selected });
                    setEditing(false);
                  }}
                  showDelete
                  onDelete={() => {
                    deleteMethod(draft.id);
                    const next = stored.find((m) => m.id !== draft.id);
                    if (next) handleSelect(next.id);
                    setEditing(false);
                  }}
                />
              </div>
            )}
          </Card>

          <Card className="overflow-hidden bg-white">
            <div className="flex border-b border-[#EEF1F5]">
              <button
                type="button"
                className={`flex-1 px-3 py-2 text-xs font-medium ${
                  tab === "usages"
                    ? "border-b-2 border-[#6366F1] text-[#4338CA]"
                    : "text-slate-500"
                }`}
                onClick={() => setTab("usages")}
              >
                使用记录（{usages.length}）
              </button>
              <button
                type="button"
                className={`flex-1 px-3 py-2 text-xs font-medium ${
                  tab === "inspirations"
                    ? "border-b-2 border-[#6366F1] text-[#4338CA]"
                    : "text-slate-500"
                }`}
                onClick={() => setTab("inspirations")}
              >
                启发收录（{inspirations.length}）
              </button>
            </div>

            {tab === "usages" && (
              <div className="max-h-[50vh] space-y-2 overflow-y-auto p-3">
                {usages.length === 0 ? (
                  <p className="py-8 text-center text-xs text-slate-400">
                    还没有在任何思考中使用过「{selected.label}」
                  </p>
                ) : (
                  usages.map((u) => (
                    <MethodUsageFlowRow
                      key={`${u.sessionId}-${u.nodeId}`}
                      usage={u}
                      method={selected}
                      annotation={getUsageAnnotation(
                        u.sessionId,
                        u.nodeId,
                        meta
                      )}
                      onTogglePin={() => {
                        toggleUsageFlag(u.sessionId, u.nodeId, "pinned");
                        refreshMeta();
                      }}
                      onToggleStar={() => {
                        toggleUsageFlag(u.sessionId, u.nodeId, "starred");
                        refreshMeta();
                      }}
                    />
                  ))
                )}
              </div>
            )}

            {tab === "inspirations" && (
              <div className="space-y-2 p-3">
                <p className="text-[10px] leading-relaxed text-slate-500">
                  收录你觉得有启发的追问/思路，对照下方「使用记录」找可借鉴的破局点。
                </p>
                <Textarea
                  className="text-xs"
                  rows={3}
                  placeholder="例如：不追问「要不要」，而追问「什么条件下值得」…"
                  value={inspirationDraft}
                  onChange={(e) => setInspirationDraft(e.target.value)}
                />
                <Button
                  size="sm"
                  variant="primary"
                  disabled={!inspirationDraft.trim()}
                  onClick={() => {
                    addInspiration(selected.id, inspirationDraft);
                    setInspirationDraft("");
                    refreshMeta();
                  }}
                >
                  收录启发
                </Button>
                <div className="max-h-[40vh] space-y-2 overflow-y-auto pt-1">
                  {inspirations.length === 0 ? (
                    <p className="py-6 text-center text-xs text-slate-400">
                      暂无启发条目
                    </p>
                  ) : (
                    inspirations.map((ins) => (
                      <div
                        key={ins.id}
                        className="rounded-lg border border-[#EEF1F5] bg-white p-2.5"
                      >
                        <div className="flex items-start gap-2">
                          <p className="flex-1 whitespace-pre-wrap text-xs text-slate-700">
                            {ins.content}
                          </p>
                          <div className="flex shrink-0 flex-col gap-1">
                            <button
                              type="button"
                              className={`text-[10px] ${
                                ins.pinned ? "text-[#4338CA]" : "text-slate-400"
                              }`}
                              onClick={() => {
                                toggleInspirationPin(ins.id);
                                refreshMeta();
                              }}
                            >
                              置顶
                            </button>
                            <button
                              type="button"
                              className="text-[10px] text-red-500"
                              onClick={() => {
                                removeInspiration(ins.id);
                                refreshMeta();
                              }}
                            >
                              删
                            </button>
                          </div>
                        </div>
                        <p className="mt-1 text-[10px] text-slate-400">
                          {formatDate(ins.createdAt)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
