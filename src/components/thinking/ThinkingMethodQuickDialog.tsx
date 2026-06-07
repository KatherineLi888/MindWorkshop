"use client";

import { useState } from "react";
import { useThinkingMethods } from "@/components/thinking/ThinkingMethodsContext";
import {
  MethodFormActions,
  MethodFormFields,
} from "@/components/thinking/method-library-shared";
import { Button } from "@/components/ui/button";
import { createCustomMethod } from "@/lib/thinking/method-store";
import Link from "next/link";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function ThinkingMethodQuickDialog({ open, onClose }: Props) {
  const { addMethod } = useThinkingMethods();
  const [draft, setDraft] = useState(() =>
    createCustomMethod({
      label: "",
      short: "",
      description: "",
      promptPattern: "关于「{anchor}」？",
    })
  );

  if (!open) return null;

  const submit = () => {
    if (!draft.label.trim() || !draft.short.trim()) return;
    addMethod({
      label: draft.label.trim(),
      short: draft.short.trim(),
      description: draft.description.trim() || "自定义思考方法",
      promptPattern: draft.promptPattern.trim() || "关于「{anchor}」？",
      color: draft.color,
      railBg: draft.railBg,
      contentBg: draft.contentBg,
    });
    onClose();
    setDraft(
      createCustomMethod({
        label: "",
        short: "",
        description: "",
        promptPattern: "关于「{anchor}」？",
      })
    );
  };

  return (
    <div
      className="fixed inset-0 z-[85] flex items-center justify-center bg-black/30 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">快速添加方法</h2>
            <p className="mt-0.5 text-[10px] text-slate-400">
              在当前思考中即可使用；完整管理请进入方法库页面
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

        <div className="mt-3">
          <MethodFormFields draft={draft} onChange={setDraft} compact />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <MethodFormActions onSave={submit} onCancel={onClose} saveLabel="添加" />
          <Link href="/thinking/methods" onClick={onClose}>
            <Button size="sm" variant="secondary" type="button">
              打开方法库管理 →
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
