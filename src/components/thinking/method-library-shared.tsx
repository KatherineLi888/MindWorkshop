"use client";

import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import type { StoredThinkingMethod } from "@/lib/thinking/methods";

export function MethodColorFields({
  draft,
  onChange,
}: {
  draft: StoredThinkingMethod;
  onChange: (next: StoredThinkingMethod) => void;
}) {
  return (
    <div className="grid gap-1.5 sm:grid-cols-3">
      <ColorField
        label="标签字色"
        value={draft.color}
        onChange={(color) => onChange({ ...draft, color })}
      />
      <ColorField
        label="色条底色"
        value={draft.railBg}
        onChange={(railBg) => onChange({ ...draft, railBg })}
      />
      <ColorField
        label="内容区底"
        value={draft.contentBg}
        onChange={(contentBg) => onChange({ ...draft, contentBg })}
      />
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center gap-1.5 text-[10px] text-slate-500">
      <span className="w-14 shrink-0">{label}</span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-6 w-8 cursor-pointer rounded border border-[#E2E8F0] p-0"
      />
      <Input
        className="h-7 flex-1 font-mono text-[10px]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export function MethodPreviewStrip({ method }: { method: StoredThinkingMethod }) {
  return (
    <div className="flex items-stretch gap-2">
      <div
        className="flex w-9 shrink-0 flex-col items-center justify-center gap-px rounded-md border border-[#E8ECF0] py-2"
        style={{ background: method.railBg }}
      >
        {method.short.split("").map((c, i) => (
          <span
            key={i}
            className="text-[11px] font-bold leading-none"
            style={{ color: method.color }}
          >
            {c}
          </span>
        ))}
      </div>
      <div
        className="min-h-[2.5rem] flex-1 rounded-md border border-[#E8ECF0] px-2 py-1.5 text-[11px] text-slate-600"
        style={{ background: method.contentBg }}
      >
        内容区预览
      </div>
    </div>
  );
}

export function MethodFormFields({
  draft,
  onChange,
  compact,
  showPreview = false,
}: {
  draft: StoredThinkingMethod;
  onChange: (next: StoredThinkingMethod) => void;
  compact?: boolean;
  showPreview?: boolean;
}) {
  return (
    <div className="space-y-2">
      {showPreview && <MethodPreviewStrip method={draft} />}
      <div className={compact ? "grid gap-2" : "grid gap-2 sm:grid-cols-2"}>
        <Input
          className="text-xs"
          placeholder="名称"
          value={draft.label}
          onChange={(e) => onChange({ ...draft, label: e.target.value })}
        />
        <Input
          className="text-xs"
          placeholder="竖排简称"
          value={draft.short}
          onChange={(e) => onChange({ ...draft, short: e.target.value })}
        />
      </div>
      {!compact && (
        <Textarea
          className="text-xs"
          rows={2}
          placeholder="用途说明"
          value={draft.description}
          onChange={(e) => onChange({ ...draft, description: e.target.value })}
        />
      )}
      <Input
        className="text-xs"
        placeholder="提问模板，{anchor} 为锚点"
        value={draft.promptPattern}
        onChange={(e) =>
          onChange({ ...draft, promptPattern: e.target.value })
        }
      />
      <MethodColorFields draft={draft} onChange={onChange} />
    </div>
  );
}

export function MethodFormActions({
  onSave,
  onCancel,
  saveLabel = "保存",
  showDelete,
  onDelete,
}: {
  onSave: () => void;
  onCancel?: () => void;
  saveLabel?: string;
  showDelete?: boolean;
  onDelete?: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="primary" onClick={onSave}>
        {saveLabel}
      </Button>
      {onCancel && (
        <Button size="sm" variant="ghost" onClick={onCancel}>
          取消
        </Button>
      )}
      {showDelete && onDelete && (
        <Button
          size="sm"
          variant="ghost"
          className="text-red-600 hover:bg-red-50"
          onClick={onDelete}
        >
          删除
        </Button>
      )}
    </div>
  );
}
