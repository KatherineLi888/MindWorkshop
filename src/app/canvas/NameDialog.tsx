"use client";

import { useEffect, useState } from "react";

type Props = {
  open: boolean;
  title: string;
  label: string;
  defaultValue?: string;
  onConfirm: (name: string) => void;
  onCancel: () => void;
};

export function NameDialog({
  open,
  title,
  label,
  defaultValue = "",
  onConfirm,
  onCancel,
}: Props) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (open) setValue(defaultValue);
  }, [open, defaultValue]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30"
      onClick={onCancel}
    >
      <div
        className="mx-4 w-full max-w-sm rounded-lg border border-[#E2E8F0] bg-white p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            const n = value.trim();
            if (n) onConfirm(n);
          }
          if (e.key === "Escape") onCancel();
        }}
      >
        <h3 className="text-sm font-medium text-slate-800">{title}</h3>
        <label className="mt-3 block text-xs text-slate-500">
          {label}
          <input
            autoFocus
            className="mt-1 w-full rounded border border-[#E2E8F0] px-2 py-1.5 text-sm outline-none focus:border-[#3B82F6]"
            value={value}
            onChange={(e) => setValue(e.target.value)}
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
            onClick={() => {
              const n = value.trim();
              if (n) onConfirm(n);
            }}
            className="rounded bg-blue-500 px-3 py-1.5 text-sm text-white hover:bg-blue-600"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
}
