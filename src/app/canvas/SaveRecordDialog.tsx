"use client";

import { useEffect, useState } from "react";

type Props = {
  open: boolean;
  frameworkName: string;
  onConfirm: (scenario: string, note: string) => void;
  onCancel: () => void;
};

export function SaveRecordDialog({
  open,
  frameworkName,
  onConfirm,
  onCancel,
}: Props) {
  const [scenario, setScenario] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) {
      setScenario("");
      setNote("");
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30"
      onClick={onCancel}
    >
      <div
        className="mx-4 w-full max-w-sm rounded-lg border border-[#E2E8F0] bg-white p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-medium text-slate-800">保存到记录库</h3>
        <p className="mt-1 text-xs text-slate-400">
          快照将归入「{frameworkName}」记录库
        </p>
        <label className="mt-3 block text-xs text-slate-500">
          使用场景 *
          <input
            autoFocus
            className="mt-1 w-full rounded border border-[#E2E8F0] px-2 py-1.5 text-sm outline-none focus:border-[#3B82F6]"
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            placeholder="例如：Q2 产品迭代复盘"
            onKeyDown={(e) => {
              if (e.key === "Enter" && scenario.trim()) {
                onConfirm(scenario.trim(), note.trim());
              }
            }}
          />
        </label>
        <label className="mt-2 block text-xs text-slate-500">
          备注（可选）
          <input
            className="mt-1 w-full rounded border border-[#E2E8F0] px-2 py-1.5 text-sm outline-none focus:border-[#3B82F6]"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-[#E2E8F0] px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            取消
          </button>
          <button
            type="button"
            disabled={!scenario.trim()}
            onClick={() => onConfirm(scenario.trim(), note.trim())}
            className="rounded bg-blue-500 px-3 py-1.5 text-sm text-white hover:bg-blue-600 disabled:opacity-40"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
