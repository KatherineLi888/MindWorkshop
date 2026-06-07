"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import type { SmartFields } from "@/types/database";

const FIELDS: { key: keyof SmartFields; label: string; hint: string }[] = [
  { key: "specific", label: "S · 具体", hint: "要完成什么？越具体越好" },
  { key: "measurable", label: "M · 可衡量", hint: "如何知道达成了？" },
  { key: "achievable", label: "A · 可达成", hint: "现实吗？资源够吗？" },
  { key: "relevant", label: "R · 相关", hint: "与长期方向一致吗？" },
  { key: "timeBound", label: "T · 有时限", hint: "明确的截止日期或节点" },
];

type Props = {
  title: string;
  goalType: "near" | "long";
  onComplete: (smart: SmartFields, versions: SmartFields[]) => void;
  onCancel: () => void;
};

export function SmartWizard({ title, goalType, onComplete, onCancel }: Props) {
  const [step, setStep] = useState(0);
  const [smart, setSmart] = useState<SmartFields>({
    specific: "",
    measurable: "",
    achievable: "",
    relevant: "",
    timeBound: "",
  });
  const [showReview, setShowReview] = useState(false);
  const [versions, setVersions] = useState<SmartFields[]>([]);

  const field = FIELDS[step];

  const next = () => {
    if (step < FIELDS.length - 1) setStep((s) => s + 1);
    else setShowReview(true);
  };

  const confirmReview = () => {
    setVersions((v) => [...v, { ...smart }]);
    onComplete(smart, [...versions, smart]);
  };

  if (showReview) {
    return (
      <Card className="mx-auto max-w-lg bg-white">
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
        <div className="mt-4 flex gap-2">
          <Button variant="primary" onClick={confirmReview}>
            确认并创建目标
          </Button>
          <Button variant="ghost" onClick={() => setShowReview(false)}>
            返回修改
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-lg bg-white">
      <p className="text-xs text-slate-400">
        {goalType === "near" ? "近期目标" : "长期目标"} · {title}
      </p>
      <p className="mt-1 text-xs text-slate-400">
        步骤 {step + 1} / {FIELDS.length}
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
      <div className="mt-4 flex gap-2">
        {step > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setStep((s) => s - 1)}>
            上一步
          </Button>
        )}
        <Button
          variant="primary"
          size="sm"
          className="ml-auto"
          disabled={!smart[field.key].trim()}
          onClick={next}
        >
          {step < FIELDS.length - 1 ? "下一步" : "检查 SMART"}
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          取消
        </Button>
      </div>
    </Card>
  );
}
