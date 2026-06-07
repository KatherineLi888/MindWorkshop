"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ModelFormActions,
  ModelFormFields,
} from "@/components/models/model-library-shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  defaultConfigForKind,
  formatTags,
  parseTagsInput,
} from "@/lib/models/helpers";
import {
  MODEL_KIND_LABELS,
  type ModelKind,
  type StoredModel,
} from "@/lib/models/types";
import { useModels } from "./ModelsContext";

const KIND_OPTIONS: ModelKind[] = ["quadrant", "stage", "funnel", "grid"];

export function ModelNewForm() {
  const router = useRouter();
  const params = useSearchParams();
  const initialKind = (params.get("kind") as ModelKind) || "quadrant";
  const { addModel } = useModels();

  const initialDraft = useMemo(
    (): StoredModel => ({
      id: "draft",
      name: "",
      description: "",
      kind: KIND_OPTIONS.includes(initialKind) ? initialKind : "quadrant",
      applicableScenarios: "",
      inspirations: "",
      usageNotes: "",
      config: defaultConfigForKind(
        KIND_OPTIONS.includes(initialKind) ? initialKind : "quadrant"
      ),
      tags: [],
      source: "",
      createdAt: "",
      updatedAt: "",
    }),
    [initialKind]
  );

  const [draft, setDraft] = useState(initialDraft);
  const [tagsInput, setTagsInput] = useState("");

  const setKind = (kind: ModelKind) => {
    setDraft({
      ...draft,
      kind,
      config: defaultConfigForKind(kind),
    });
  };

  const save = (andApply: boolean) => {
    if (!draft.name.trim()) return;
    const created = addModel({
      name: draft.name.trim(),
      kind: draft.kind,
      description: draft.description.trim(),
      applicableScenarios: draft.applicableScenarios.trim(),
      inspirations: draft.inspirations.trim(),
      usageNotes: draft.usageNotes.trim(),
      config: draft.config,
      tags: parseTagsInput(tagsInput),
      source: draft.source.trim(),
    });
    if (andApply) {
      router.push(`/models/apply?model=${created.id}`);
    } else {
      router.push("/models/library");
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 lg:p-6">
      <div className="flex items-center gap-2">
        <Link href="/models/library">
          <Button variant="ghost" size="sm">
            ← 模型库
          </Button>
        </Link>
        <div>
          <h1 className="text-lg font-semibold text-slate-900">新建模型</h1>
          <p className="text-xs text-slate-500">
            选择类型并定义结构，保存后并入模型库
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-[#EEF1F5] bg-white p-4 space-y-3">
        <div>
          <p className="text-[10px] font-medium text-slate-500">模型类型</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {KIND_OPTIONS.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={`rounded-lg px-2.5 py-1 text-[10px] ${
                  draft.kind === k
                    ? "bg-[#EEF2FF] text-[#4338CA]"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {MODEL_KIND_LABELS[k]}
              </button>
            ))}
          </div>
        </div>

        <label className="block text-[10px] text-slate-500">
          模型名称 *
          <Input
            className="mt-0.5"
            value={draft.name}
            placeholder="给你的模型起个名字"
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
        </label>
        <label className="block text-[10px] text-slate-500">
          标签
          <Input
            className="mt-0.5"
            value={tagsInput}
            placeholder="用逗号分隔，如：时间管理、决策"
            onChange={(e) => setTagsInput(e.target.value)}
          />
          {tagsInput && (
            <p className="mt-1 text-[10px] text-slate-400">
              将保存为：{formatTags(parseTagsInput(tagsInput))}
            </p>
          )}
        </label>
        <label className="block text-[10px] text-slate-500">
          来源
          <Input
            className="mt-0.5"
            value={draft.source}
            placeholder="从哪里学到这个模型？"
            onChange={(e) => setDraft({ ...draft, source: e.target.value })}
          />
        </label>

        <ModelFormFields draft={draft} onChange={setDraft} showPreview />
      </div>

      <ModelFormActions
        onSave={() => save(false)}
        onCancel={() => router.push("/models/library")}
        saveLabel="保存到模型库"
      />
      <Button
        size="sm"
        variant="secondary"
        disabled={!draft.name.trim()}
        onClick={() => save(true)}
      >
        保存并套用
      </Button>
    </div>
  );
}
