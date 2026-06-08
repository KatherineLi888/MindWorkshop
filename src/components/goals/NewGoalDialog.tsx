"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  open: boolean;
  title: string;
  onTitleChange: (v: string) => void;
  onNear: () => void;
  onLong: () => void;
  onClose: () => void;
};

export function NewGoalDialog({
  open,
  title,
  onTitleChange,
  onNear,
  onLong,
  onClose,
}: Props) {
  const [step, setStep] = useState<1 | 2>(1);

  useEffect(() => {
    if (open) setStep(1);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 p-4 pt-16">
      <div
        className="w-full max-w-sm rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-800">
            新建目标
            <span className="ml-2 text-[10px] font-normal text-slate-400">
              步骤 {step}/2
            </span>
          </h3>
          <button
            type="button"
            className="text-slate-400 hover:text-slate-600"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {step === 1 ? (
          <>
            <label className="mt-3 block text-xs text-slate-500">
              目标名称
              <Input
                className="mt-1"
                placeholder="输入目标名称"
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                autoFocus
              />
            </label>
            <div className="mt-4 flex justify-end">
              <Button
                size="sm"
                variant="primary"
                disabled={!title.trim()}
                onClick={() => setStep(2)}
              >
                下一步
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="mt-3 text-xs text-slate-600">
              「{title.trim()}」属于哪类目标？
            </p>
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                variant="primary"
                className="flex-1"
                onClick={onNear}
              >
                短期目标
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="flex-1"
                onClick={onLong}
              >
                长期目标
              </Button>
            </div>
            <div className="mt-3 flex justify-between">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setStep(1)}
              >
                上一步
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
