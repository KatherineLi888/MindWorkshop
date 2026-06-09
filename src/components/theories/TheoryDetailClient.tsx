"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/app/canvas/ConfirmDialog";
import { PageHeader } from "@/components/layout/PageHeader";
import { SeedLinkPanel } from "@/components/seeds/SeedLinkPanel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MarkdownField } from "@/components/shared/MarkdownField";
import { Input, Textarea } from "@/components/ui/input";
import {
  createTheoryEvidence,
  createTheoryStep,
  theoryDisplayTitle,
} from "@/lib/theories/helpers";
import {
  THEORY_EVIDENCE_OUTCOME_LABELS,
  THEORY_INTENT_LABELS,
  THEORY_STATUS_COLORS,
  THEORY_STATUS_LABELS,
} from "@/lib/theories/labels";
import type {
  StoredTheory,
  TheoryEvidenceOutcome,
  TheoryIntent,
  TheoryStatus,
} from "@/lib/theories/types";
import { formatDate } from "@/lib/utils";
import { useTheories } from "./TheoriesContext";

type Props = {
  theoryId: string;
};

const STATUS_OPTIONS: TheoryStatus[] = [
  "captured",
  "verifying",
  "validated",
  "refuted",
  "promoted",
];

export function TheoryDetailClient({ theoryId }: Props) {
  const router = useRouter();
  const { getTheory, saveTheory, deleteTheory, promoteToModel } = useTheories();
  const theory = getTheory(theoryId);
  const [draft, setDraft] = useState<StoredTheory | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [promoteOpen, setPromoteOpen] = useState(false);

  useEffect(() => {
    if (theory) setDraft({ ...theory });
  }, [theory]);

  if (!theory || !draft) {
    return (
      <div className="p-6">
        <p className="text-sm text-slate-500">未找到该理论。</p>
        <Link href="/theories" className="mt-2 inline-block text-xs text-[#4338CA]">
          ← 返回理论库
        </Link>
      </div>
    );
  }

  const patch = <K extends keyof StoredTheory>(key: K, val: StoredTheory[K]) => {
    setDraft((d) => (d ? { ...d, [key]: val } : d));
  };

  const save = () => {
    if (!draft.statement.trim()) {
      alert("核心表述不能为空");
      return;
    }
    saveTheory({
      ...draft,
      title: draft.title.trim() || draft.statement.trim().slice(0, 36),
      statement: draft.statement.trim(),
    });
  };

  const addStep = () => {
    patch("steps", [...draft.steps, createTheoryStep()]);
  };

  const updateStep = (id: string, content: string) => {
    patch(
      "steps",
      draft.steps.map((s) => (s.id === id ? { ...s, content } : s))
    );
  };

  const removeStep = (id: string) => {
    patch(
      "steps",
      draft.steps.filter((s) => s.id !== id)
    );
  };

  const addEvidence = () => {
    patch("evidence", [createTheoryEvidence(), ...draft.evidence]);
  };

  const updateEvidence = (
    id: string,
    patchEv: Partial<Pick<StoredTheory["evidence"][0], "scenario" | "outcome" | "note">>
  ) => {
    patch(
      "evidence",
      draft.evidence.map((e) => (e.id === id ? { ...e, ...patchEv } : e))
    );
  };

  const removeEvidence = (id: string) => {
    patch(
      "evidence",
      draft.evidence.filter((e) => e.id !== id)
    );
  };

  const handlePromote = () => {
    const { model } = promoteToModel(draft);
    setPromoteOpen(false);
    router.push(`/models/library?selected=${model.id}`);
  };

  const handleDelete = () => {
    deleteTheory(theoryId);
    router.push("/theories");
  };

  return (
    <div className="space-y-5 p-4 lg:p-6">
      <PageHeader
        title={theoryDisplayTitle(draft)}
        description="验证边界、记录证据，确认后可升格为模型。"
        secondaryLink={{ label: "← 返回理论库", href: "/theories" }}
        actions={
          <>
            {draft.status !== "promoted" && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setPromoteOpen(true)}
              >
                升格为模型
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => setDeleteOpen(true)}>
              删除
            </Button>
            <Button size="sm" variant="primary" onClick={save}>
              保存
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded px-2 py-0.5 text-[10px] ${THEORY_STATUS_COLORS[draft.status]}`}
        >
          {THEORY_STATUS_LABELS[draft.status]}
        </span>
        <span className="text-[10px] text-slate-400">
          {THEORY_INTENT_LABELS[draft.intent]}
        </span>
        {draft.promotedModelId && (
          <Link
            href={`/models/library?selected=${draft.promotedModelId}`}
            className="text-[10px] text-[#4338CA] hover:underline"
          >
            查看对应模型 →
          </Link>
        )}
      </div>

      <SeedLinkPanel entityType="theory" entityId={theoryId} />

      <Card className="space-y-3 bg-white p-4">
        <p className="text-xs font-medium text-slate-600">基本信息</p>
        <Input
          placeholder="标题"
          value={draft.title}
          onChange={(e) => patch("title", e.target.value)}
        />
        <MarkdownField
          rows={3}
          placeholder="核心表述 *"
          value={draft.statement}
          onChange={(v) => patch("statement", v)}
        />
        <Input
          placeholder="出处"
          value={draft.source}
          onChange={(e) => patch("source", e.target.value)}
        />

        <div>
          <p className="mb-1 text-[10px] text-slate-500">意图</p>
          <div className="flex flex-wrap gap-1">
            {(["observe", "execute"] as TheoryIntent[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => patch("intent", k)}
                className={`rounded-lg px-2.5 py-1 text-[10px] ${
                  draft.intent === k
                    ? "bg-[#EEF2FF] text-[#4338CA]"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {THEORY_INTENT_LABELS[k]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1 text-[10px] text-slate-500">验证状态</p>
          <div className="flex flex-wrap gap-1">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                disabled={draft.status === "promoted" && s !== "promoted"}
                onClick={() => patch("status", s)}
                className={`rounded-lg px-2.5 py-1 text-[10px] disabled:opacity-40 ${
                  draft.status === s
                    ? "bg-[#EEF2FF] text-[#4338CA]"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {THEORY_STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        <Textarea
          rows={2}
          placeholder="适用场景 — 在什么情况下可能成立"
          value={draft.applicableWhen}
          onChange={(e) => patch("applicableWhen", e.target.value)}
        />
        <Textarea
          rows={2}
          placeholder="不适用场景 — 在什么情况下可能不成立"
          value={draft.counterWhen}
          onChange={(e) => patch("counterWhen", e.target.value)}
        />
      </Card>

      <Card className="space-y-3 bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-600">步骤链（SOP 雏形）</p>
            <p className="text-[10px] text-slate-400">
              先 A 再 B 再 C；升格为模型时会转为阶段框架
            </p>
          </div>
          <Button size="sm" variant="ghost" onClick={addStep}>
            + 添加步骤
          </Button>
        </div>
        {draft.steps.length === 0 ? (
          <p className="text-xs text-slate-400">暂无步骤</p>
        ) : (
          <ol className="space-y-2">
            {draft.steps.map((s, i) => (
              <li key={s.id} className="flex items-start gap-2">
                <span className="mt-2 shrink-0 text-[10px] text-slate-400">
                  {i + 1}.
                </span>
                <Input
                  className="flex-1"
                  placeholder="步骤描述"
                  value={s.content}
                  onChange={(e) => updateStep(s.id, e.target.value)}
                />
                <button
                  type="button"
                  className="mt-2 text-xs text-slate-400 hover:text-red-500"
                  onClick={() => removeStep(s.id)}
                >
                  删
                </button>
              </li>
            ))}
          </ol>
        )}
      </Card>

      <Card className="space-y-3 bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-600">验证记录</p>
            <p className="text-[10px] text-slate-400">
              在实际场景中的尝试与结论
            </p>
          </div>
          <Button size="sm" variant="ghost" onClick={addEvidence}>
            + 添加记录
          </Button>
        </div>
        {draft.evidence.length === 0 ? (
          <p className="text-xs text-slate-400">还没有验证记录</p>
        ) : (
          <ul className="space-y-3">
            {draft.evidence.map((ev) => (
              <li
                key={ev.id}
                className="rounded-lg border border-[#EEF1F5] bg-[#FAFBFC] p-3"
              >
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-400">
                    {formatDate(ev.createdAt)}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {(
                      Object.keys(THEORY_EVIDENCE_OUTCOME_LABELS) as TheoryEvidenceOutcome[]
                    ).map((o) => (
                      <button
                        key={o}
                        type="button"
                        onClick={() => updateEvidence(ev.id, { outcome: o })}
                        className={`rounded px-1.5 py-0.5 text-[10px] ${
                          ev.outcome === o
                            ? "bg-[#EEF2FF] text-[#4338CA]"
                            : "bg-white text-slate-500"
                        }`}
                      >
                        {THEORY_EVIDENCE_OUTCOME_LABELS[o]}
                      </button>
                    ))}
                  </div>
                </div>
                <Input
                  className="mb-2 bg-white"
                  placeholder="验证场景"
                  value={ev.scenario}
                  onChange={(e) =>
                    updateEvidence(ev.id, { scenario: e.target.value })
                  }
                />
                <Textarea
                  rows={2}
                  className="bg-white"
                  placeholder="观察与结论"
                  value={ev.note}
                  onChange={(e) => updateEvidence(ev.id, { note: e.target.value })}
                />
                <button
                  type="button"
                  className="mt-2 text-[10px] text-slate-400 hover:text-red-500"
                  onClick={() => removeEvidence(ev.id)}
                >
                  删除此记录
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <ConfirmDialog
        open={deleteOpen}
        title="删除理论"
        message={`确定删除「${theoryDisplayTitle(draft)}」？此操作不可撤销。`}
        confirmLabel="删除"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />

      <ConfirmDialog
        open={promoteOpen}
        title="升格为模型"
        message="将把此理论写入模型库（阶段模型）。理论状态将变为「已升格为模型」。确定继续？"
        confirmLabel="升格"
        onConfirm={handlePromote}
        onCancel={() => setPromoteOpen(false)}
      />
    </div>
  );
}
