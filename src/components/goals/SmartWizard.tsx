"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { clearDraft, DRAFT_KEYS, loadDraft, saveDraft } from "@/lib/drafts/storage";
import type { SmartFields } from "@/types/database";

const FIELDS: { key: keyof SmartFields; label: string; hint: string }[] = [
  { key: "specific", label: "S · 具体", hint: "要完成什么？越具体越好" },
  { key: "measurable", label: "M · 可衡量", hint: "如何知道达成了？" },
  { key: "achievable", label: "A · 可达成", hint: "现实吗？资源够吗？" },
  { key: "relevant", label: "R · 相关", hint: "与长期方向一致吗？" },
  { key: "timeBound", label: "T · 有时限", hint: "明确的截止日期或节点" },
];

type SmartDraft = {
  title: string;
  goalType: "near" | "long";
  step: number;
  smart: SmartFields;
  showReview: boolean;
};

type Props = {
  title: string;
  goalType: "near" | "long";
  onComplete: (smart: SmartFields, versions: SmartFields[]) => void | Promise<void>;
  onCancel: () => void;
};

export function SmartWizard({ title, goalType, onComplete, onCancel }: Props) {
  const restored = loadDraft<SmartDraft>(DRAFT_KEYS.goalSmart);
  const match =
    restored &&
    restored.title === title &&
    restored.goalType === goalType
      ? restored
      : null;

  const [step, setStep] = useState(match?.step ?? 0);
  const [smart, setSmart] = useState<SmartFields>(
    match?.smart ?? {
      specific: "",
      measurable: "",
      achievable: "",
      relevant: "",
      timeBound: "",
    }
  );
  const [showReview, setShowReview] = useState(match?.showReview ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    saveDraft<SmartDraft>(DRAFT_KEYS.goalSmart, {
      title,
      goalType,
      step,
      smart,
      showReview,
    });
  }, [title, goalType, step, smart, showReview]);

  const field = FIELDS[step]!;

  const next = () => {
    if (step < FIELDS.length - 1) setStep((s) => s + 1);
    else setShowReview(true);
  };

  const handleCancel = () => {
    clearDraft(DRAFT_KEYS.goalSmart);
    onCancel();
  };

  const confirmReview = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const snapshot = { ...smart };
      await onComplete(snapshot, [snapshot]);
      clearDraft(DRAFT_KEYS.goalSmart);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "保存失败，请检查登录状态后重试"
      );
    } finally {
      setSaving(false);
    }
  };

  if (showReview) {
    return (
      <Card className="mx-auto max-w-lg bg-white pb-2">
        <h3 className="font-medium">检查 SMART</h3>
        <p className="mt-2 text-sm text-slate-600">
          请再次审视：S 是否足够具体？M 是否真的可测量？A 是否现实？R 是否与长期方向一致？T
          是否有明确节点？
        </p>
        <div className="mt-4 space-y-2 text-xs">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <label className="text-slate-500">{f.label}</label>
              <Input
                className="mt-0.5"
                value={smart[f.key]}
                onChange={(e) =>
                  setSmart((s) => ({ ...s, [f.key]: e.target.value }))
                }
              />
            </div>
          ))}
        </div>
        {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="primary"
            disabled={saving}
            onClick={() => void confirmReview()}
          >
            {saving ? "保存中…" : "确认并创建目标"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={saving}
            onClick={() => setShowReview(false)}
          >
            返回修改
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-lg bg-white pb-2">
      <p className="text-xs text-slate-400">
        {goalType === "near" ? "短期目标" : "长期目标"} · {title}
      </p>
      <p className="mt-1 text-xs text-slate-400">
        步骤 {step + 1} / {FIELDS.length} · 进度已自动保存
      </p>
      <h3 className="mt-3 font-medium">{field.label}</h3>
      <p className="text-sm text-slate-500">{field.hint}</p>
      <Textarea
        className="mt-3"
        rows={3}
        value={smart[field.key]}
        onChange={(e) =>
          setSmart((s) => ({ ...s, [field.key]: e.target.value }))
        }
      />
      <div className="mt-4 flex flex-wrap gap-2">
        {step > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setStep((s) => s - 1)}
          >
            上一步
          </Button>
        )}
        <Button
          type="button"
          variant="primary"
          size="sm"
          className="ml-auto"
          onClick={next}
        >
          {step < FIELDS.length - 1 ? "下一步" : "检查 SMART"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={handleCancel}>
          取消
        </Button>
      </div>
    </Card>
  );
}
