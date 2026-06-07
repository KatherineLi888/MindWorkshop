"use client";

import {
  TRIAGE_DESTINATION_LABELS,
  type TriageWizardStep,
} from "@/lib/triage/logic";

type Props = {
  steps: TriageWizardStep[];
};

export function TriageLogicPreview({ steps }: Props) {
  return (
    <div className="space-y-5">
      {steps.map((step, stepIndex) => (
        <section
          key={step.id}
          className="rounded-xl border border-[#E2E8F0] bg-white overflow-hidden"
        >
          <header className="border-b border-[#EEF1F5] bg-[#FAFBFC] px-4 py-3">
            <p className="text-sm font-medium text-slate-800">{step.title}</p>
            {step.condition && (
              <p className="mt-0.5 text-[11px] text-slate-400">
                {step.condition}
              </p>
            )}
          </header>

          <ol className="divide-y divide-[#F1F5F9]">
            {step.options.map((opt, optIndex) => (
              <li key={opt.id} className="px-4 py-3">
                <div className="flex gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#EEF2FF] text-[10px] font-medium text-[#4338CA]">
                    {optIndex + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-700">{opt.label}</p>
                    {opt.hint && (
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                        {opt.hint}
                      </p>
                    )}
                    <p className="mt-2 text-xs font-medium">
                      {opt.destination ? (
                        <span className="text-[#3B82F6]">
                          → {TRIAGE_DESTINATION_LABELS[opt.destination]}
                        </span>
                      ) : opt.nextStepId ? (
                        <span className="text-slate-500">
                          →{" "}
                          {steps.find((s) => s.id === opt.nextStepId)?.title ??
                            "下一步"}
                        </span>
                      ) : null}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ol>

          {stepIndex < steps.length - 1 && (
            <div className="flex justify-center border-t border-[#F1F5F9] py-2">
              <span className="text-[10px] text-slate-300">▼</span>
            </div>
          )}
        </section>
      ))}

      <p className="rounded-lg border border-dashed border-[#E2E8F0] bg-[#FAFBFC] px-3 py-2 text-[11px] leading-relaxed text-slate-400">
        进入任一板块前会经过「梳理」：一句话主题 + 可选核心要点，并写入闪念记录。
      </p>
    </div>
  );
}
