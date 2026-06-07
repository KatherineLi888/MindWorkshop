"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useModels } from "@/components/models/ModelsContext";
import { ModelPreview } from "@/components/models/ModelPreview";
import {
  ModelFormActions,
  ModelFormFields,
  ModelNotesPreview,
} from "@/components/models/model-library-shared";
import { SeedLinkPanel } from "@/components/seeds/SeedLinkPanel";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatTags, parseTagsInput } from "@/lib/models/helpers";
import { MODEL_KIND_LABELS, type ModelKind, type StoredModel } from "@/lib/models/types";

const KIND_FILTER: (ModelKind | "all")[] = [
  "all",
  "quadrant",
  "stage",
  "funnel",
  "grid",
];

export function ModelsLibraryManager() {
  const { models, saveModel, deleteModel, resetBuiltinDefaults, getApplyCount } =
    useModels();
  const searchParams = useSearchParams();
  const paramSelected = searchParams.get("selected");

  const [selectedId, setSelectedId] = useState(
    paramSelected && models.some((m) => m.id === paramSelected)
      ? paramSelected
      : models[0]?.id ?? ""
  );
  const [draft, setDraft] = useState<StoredModel | null>(null);
  const [tagsInput, setTagsInput] = useState("");
  const [editing, setEditing] = useState(false);
  const [kindFilter, setKindFilter] = useState<ModelKind | "all">("all");

  const filtered =
    kindFilter === "all"
      ? models
      : models.filter((m) => m.kind === kindFilter);

  const selected =
    models.find((m) => m.id === selectedId) ?? filtered[0] ?? models[0];

  useEffect(() => {
    if (selected) {
      setDraft({ ...selected });
      setTagsInput(formatTags(selected.tags));
    }
    setEditing(false);
  }, [selectedId, selected]);

  useEffect(() => {
    if (!filtered.some((m) => m.id === selectedId) && filtered[0]) {
      setSelectedId(filtered[0].id);
    }
  }, [kindFilter, filtered, selectedId]);

  const saveSelected = () => {
    if (!draft) return;
    saveModel({
      ...draft,
      tags: parseTagsInput(tagsInput),
    });
    setEditing(false);
  };

  if (!selected || !draft) {
    return (
      <div className="p-6">
        <p className="text-sm text-slate-500">暂无模型。</p>
        <Link href="/models/new">
          <Button className="mt-2" size="sm">
            + 新建模型
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col p-4 lg:p-6">
      <PageHeader
        title="模型库"
        description="内置模板与用户自建模型统一管理，可编辑、打标签并查看套用次数。"
        subModule={{ label: "理论库", href: "/theories" }}
        secondaryLink={{ label: "← 返回套用", href: "/models" }}
        actions={
          <>
            <Link href="/models/new">
              <Button size="sm" variant="secondary">
                + 新建模型
              </Button>
            </Link>
            <Button size="sm" variant="ghost" onClick={resetBuiltinDefaults}>
              恢复内置
            </Button>
          </>
        }
      />

      <div className="mt-3 flex flex-wrap gap-1">
        {KIND_FILTER.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKindFilter(k)}
            className={`rounded-lg px-2.5 py-1 text-[10px] ${
              kindFilter === k
                ? "bg-[#EEF2FF] text-[#4338CA]"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {k === "all" ? "全部" : MODEL_KIND_LABELS[k]}
          </button>
        ))}
      </div>

      <div className="mt-4 grid min-h-0 flex-1 gap-3 lg:grid-cols-[220px_1fr]">
        <Card className="flex max-h-[70vh] flex-col overflow-hidden bg-white lg:max-h-none">
          <p className="border-b border-[#EEF1F5] px-3 py-2 text-xs font-medium text-slate-600">
            全部模型（{filtered.length}）
          </p>
          <ul className="min-h-0 flex-1 overflow-y-auto p-2">
            {filtered.map((m) => {
              const active = m.id === selectedId;
              const count = getApplyCount(m.id);
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(m.id)}
                    className={`mb-1 w-full rounded-lg px-2.5 py-2 text-left transition-colors ${
                      active
                        ? "bg-[#EEF2FF] text-[#4338CA]"
                        : "hover:bg-[#FAFBFC] text-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-medium">{m.name}</span>
                      {m.builtin && (
                        <span className="text-[9px] text-slate-400">内置</span>
                      )}
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-[10px] text-slate-400">
                      {MODEL_KIND_LABELS[m.kind]}
                      {count > 0 ? ` · ${count} 次套用` : ""}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>

        <div className="min-h-0 space-y-3 overflow-y-auto">
          {!draft.builtin && (
            <SeedLinkPanel
              entityType="thinking_model"
              entityId={draft.id}
              title={draft.name}
              stage="model"
            />
          )}

          <Card className="bg-white p-3">
            {!editing ? (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800">
                        {draft.name}
                      </p>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                        {MODEL_KIND_LABELS[draft.kind]}
                      </span>
                    </div>
                    {draft.description && (
                      <p className="mt-0.5 text-[10px] text-slate-500">
                        {draft.description}
                      </p>
                    )}
                    {draft.tags.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {draft.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded bg-[#EEF2FF] px-1.5 py-0.5 text-[10px] text-[#4338CA]"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                    {draft.source && (
                      <p className="mt-1 text-[10px] text-slate-400">
                        来源：{draft.source}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Link href={`/models/apply?model=${draft.id}`}>
                      <Button size="sm" variant="primary">
                        套用
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="secondary"
                      type="button"
                      onClick={() => setEditing(true)}
                    >
                      编辑
                    </Button>
                  </div>
                </div>
                <ModelPreview model={draft} />
                <ModelNotesPreview model={draft} />
              </div>
            ) : (
              <div className="space-y-3">
                <label className="block text-[10px] text-slate-500">
                  标签
                  <Input
                    className="mt-0.5 h-8 text-xs"
                    value={tagsInput}
                    placeholder="逗号分隔"
                    onChange={(e) => setTagsInput(e.target.value)}
                  />
                </label>
                <label className="block text-[10px] text-slate-500">
                  来源
                  <Input
                    className="mt-0.5 h-8 text-xs"
                    value={draft.source}
                    onChange={(e) =>
                      setDraft({ ...draft, source: e.target.value })
                    }
                  />
                </label>
                <ModelFormFields draft={draft} onChange={setDraft} />
                <ModelFormActions
                  onSave={saveSelected}
                  onCancel={() => {
                    setDraft({ ...selected });
                    setTagsInput(formatTags(selected.tags));
                    setEditing(false);
                  }}
                  showDelete={!draft.builtin}
                  onDelete={() => {
                    deleteModel(draft.id);
                    const next = models.find((m) => m.id !== draft.id);
                    if (next) setSelectedId(next.id);
                    setEditing(false);
                  }}
                />
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
