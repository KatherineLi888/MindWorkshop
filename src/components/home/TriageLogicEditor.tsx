"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { TriageLogicPreview } from "@/components/home/TriageLogicPreview";
import { PageHeader } from "@/components/layout/PageHeader";
import { ExportExcelButton } from "@/components/shared/ExportExcelButton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import {
  DEFAULT_TRIAGE_WIZARD,
  TRIAGE_DESTINATION_LABELS,
  wizardToExportRows,
  type TriageWizardStep,
} from "@/lib/triage/logic";
import {
  loadTriageWizard,
  resetTriageWizard,
  saveTriageWizard,
} from "@/lib/triage/logic-storage";

function cloneSteps(steps: TriageWizardStep[]): TriageWizardStep[] {
  return steps.map((s) => ({
    ...s,
    options: s.options.map((o) => ({ ...o })),
  }));
}

export function TriageLogicEditor() {
  const [editing, setEditing] = useState(false);
  const [steps, setSteps] = useState<TriageWizardStep[]>(() =>
    cloneSteps(loadTriageWizard())
  );
  const [draft, setDraft] = useState<TriageWizardStep[] | null>(null);
  const [saved, setSaved] = useState(false);

  const displaySteps = editing && draft ? draft : steps;

  const startEdit = () => {
    setDraft(cloneSteps(steps));
    setEditing(true);
    setSaved(false);
  };

  const cancelEdit = () => {
    setDraft(null);
    setEditing(false);
  };

  const updateDraftStepTitle = (stepId: string, title: string) => {
    if (!draft) return;
    setDraft(
      draft.map((s) => (s.id === stepId ? { ...s, title } : s))
    );
    setSaved(false);
  };

  const updateDraftStepCondition = (stepId: string, condition: string) => {
    if (!draft) return;
    setDraft(
      draft.map((s) =>
        s.id === stepId ? { ...s, condition: condition || undefined } : s
      )
    );
    setSaved(false);
  };

  const updateDraftOption = (
    stepId: string,
    optionId: string,
    patch: { label?: string; hint?: string }
  ) => {
    if (!draft) return;
    setDraft(
      draft.map((s) =>
        s.id !== stepId
          ? s
          : {
              ...s,
              options: s.options.map((o) =>
                o.id === optionId ? { ...o, ...patch } : o
              ),
            }
      )
    );
    setSaved(false);
  };

  const handleSave = useCallback(() => {
    if (!draft) return;
    saveTriageWizard(draft);
    setSteps(cloneSteps(draft));
    setEditing(false);
    setDraft(null);
    setSaved(true);
  }, [draft]);

  const handleReset = () => {
    if (!confirm("恢复为系统默认决策逻辑？你的修改将丢失。")) return;
    resetTriageWizard();
    const defaults = cloneSteps(DEFAULT_TRIAGE_WIZARD);
    setSteps(defaults);
    setDraft(editing ? cloneSteps(defaults) : null);
    setSaved(false);
  };

  const exportRows = wizardToExportRows(displaySteps);

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 lg:p-6">
        <PageHeader
          title="决策逻辑"
          description={
            editing
              ? "编辑各步骤标题与选项文案，保存后首页定位立即生效。"
              : "首页定位的完整分支预览。确认无误后再点「编辑」修改文案。"
          }
          secondaryLink={{ label: "← 返回首页", href: "/home" }}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/home/funnel"
                className="text-xs text-[#3B82F6] hover:underline"
              >
                流程漏斗
              </Link>
              <ExportExcelButton
                rows={exportRows}
                fileName="triage-logic.xlsx"
                sheetName="决策逻辑"
              />
              {editing ? (
                <>
                  <Button size="sm" variant="ghost" onClick={cancelEdit}>
                    取消
                  </Button>
                  <Button size="sm" variant="primary" onClick={handleSave}>
                    保存
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" variant="ghost" onClick={handleReset}>
                    恢复默认
                  </Button>
                  <Button size="sm" variant="primary" onClick={startEdit}>
                    编辑
                  </Button>
                </>
              )}
            </div>
          }
        />

        {saved && !editing && (
          <p className="text-xs text-emerald-600">已保存，首页定位将使用此逻辑。</p>
        )}

        {!editing ? (
          <TriageLogicPreview steps={displaySteps} />
        ) : (
          <div className="space-y-4">
            <Card className="border-amber-200 bg-amber-50/60 p-3 text-[11px] text-amber-800">
              分支结构暂不可改，只能调整标题与选项文案。左侧数字与去向为只读参考。
            </Card>

            {draft?.map((step, stepIndex) => (
              <Card key={step.id} className="overflow-hidden bg-white">
                <div className="border-b border-[#EEF1F5] bg-[#FAFBFC] px-4 py-3">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                    步骤 {stepIndex + 1}
                  </p>
                  <label className="mt-2 block text-xs font-medium text-slate-600">
                    步骤标题
                  </label>
                  <Input
                    className="mt-1"
                    value={step.title}
                    onChange={(e) =>
                      updateDraftStepTitle(step.id, e.target.value)
                    }
                  />
                  <label className="mt-2 block text-xs font-medium text-slate-600">
                    显示条件（可选）
                  </label>
                  <Input
                    className="mt-1"
                    value={step.condition ?? ""}
                    onChange={(e) =>
                      updateDraftStepCondition(step.id, e.target.value)
                    }
                  />
                </div>

                <ul className="divide-y divide-[#F1F5F9]">
                  {step.options.map((opt, optIndex) => (
                    <li key={opt.id} className="px-4 py-3">
                      <div className="mb-2 flex items-center gap-2 text-[10px] text-slate-400">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EEF2FF] text-[#4338CA]">
                          {optIndex + 1}
                        </span>
                        <span>
                          去向：
                          {opt.destination
                            ? TRIAGE_DESTINATION_LABELS[opt.destination]
                            : "→ 下一步"}
                        </span>
                      </div>
                      <label className="text-xs font-medium text-slate-600">
                        选项文案
                      </label>
                      <Input
                        className="mt-1"
                        value={opt.label}
                        onChange={(e) =>
                          updateDraftOption(step.id, opt.id, {
                            label: e.target.value,
                          })
                        }
                      />
                      <label className="mt-2 block text-xs font-medium text-slate-600">
                        小字提示（可选）
                      </label>
                      <Textarea
                        rows={2}
                        className="mt-1 text-sm"
                        value={opt.hint ?? ""}
                        onChange={(e) =>
                          updateDraftOption(step.id, opt.id, {
                            hint: e.target.value,
                          })
                        }
                      />
                    </li>
                  ))}
                </ul>
              </Card>
            ))}

            <div className="flex flex-wrap gap-2 pb-6">
              <Button variant="primary" onClick={handleSave}>
                保存
              </Button>
              <Button variant="ghost" onClick={cancelEdit}>
                取消
              </Button>
            </div>
          </div>
        )}
    </div>
  );
}
