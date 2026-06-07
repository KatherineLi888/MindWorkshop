"use client";

import Link from "next/link";
import { useThinkingMethods } from "@/components/thinking/ThinkingMethodsContext";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function ThinkingMethodLibraryDialog({ open, onClose }: Props) {
  const { methods } = useThinkingMethods();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[85] flex items-center justify-center bg-black/30 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[88vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-[#EEF1F5] px-4 py-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">思考方法库</h2>
              <p className="mt-0.5 text-[10px] text-slate-500">
                简要说明各方法；右侧可进入方法库编辑
              </p>
            </div>
            <button
              type="button"
              className="text-slate-400 hover:text-slate-600"
              onClick={onClose}
            >
              ✕
            </button>
          </div>
        </div>

        <ul className="min-h-0 flex-1 overflow-y-auto p-2">
          {methods.map((m) => (
            <li
              key={m.id}
              className="mb-2 flex items-start gap-3 rounded-lg border border-[#EEF1F5] bg-[#FAFBFC] p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-800">
                  {m.label}
                  <span className="ml-1.5 font-normal text-slate-400">
                    {m.short}
                  </span>
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                  {m.description}
                </p>
              </div>
              <Link
                href={`/thinking/methods?selected=${encodeURIComponent(m.id)}`}
                onClick={onClose}
              >
                <Button size="sm" variant="secondary" type="button">
                  编辑
                </Button>
              </Link>
            </li>
          ))}
        </ul>

        <div className="shrink-0 border-t border-[#EEF1F5] px-4 py-3 text-right">
          <Link href="/thinking/methods" onClick={onClose}>
            <Button size="sm" variant="ghost" type="button">
              打开方法库管理 →
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
