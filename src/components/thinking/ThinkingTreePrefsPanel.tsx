"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DEFAULT_THINKING_LAYOUT_PREFS,
  DEFAULT_TREE_NODE_PREFS,
  loadThinkingLayoutPrefs,
  saveThinkingLayoutPrefs,
  type ThinkingLayoutPrefs,
  type ThinkingTreeNodePrefs,
} from "@/lib/thinking/layout-prefs";

function NumField({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <label className="block text-xs text-slate-600">
      {label}
      <Input
        type="number"
        className="mt-1"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
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
    <label className="flex items-center gap-2 text-xs text-slate-600">
      <span className="min-w-[5.5rem]">{label}</span>
      <input
        type="color"
        value={value.startsWith("#") && value.length >= 7 ? value.slice(0, 7) : "#000000"}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-10 cursor-pointer rounded border border-slate-200"
      />
      <Input
        className="min-w-0 flex-1 font-mono text-[11px]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export function ThinkingTreePrefsPanel() {
  const [prefs, setPrefs] = useState<ThinkingLayoutPrefs>(
    DEFAULT_THINKING_LAYOUT_PREFS
  );
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setPrefs(loadThinkingLayoutPrefs());
  }, []);

  const patchTree = (patch: Partial<ThinkingTreeNodePrefs>) => {
    setPrefs((p) => ({ ...p, tree: { ...p.tree, ...patch } }));
  };

  const save = () => {
    saveThinkingLayoutPrefs(prefs);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const reset = () => {
    const next = {
      ...prefs,
      tree: { ...DEFAULT_TREE_NODE_PREFS },
    };
    setPrefs(next);
    saveThinkingLayoutPrefs(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const t = prefs.tree;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-medium text-slate-700">问题 / 回答配色</h3>
        <div className="mt-2 space-y-2">
          <ColorField
            label="问题文字"
            value={t.questionTextColor}
            onChange={(v) => patchTree({ questionTextColor: v })}
          />
          <ColorField
            label="回答文字"
            value={t.answerTextColor}
            onChange={(v) => patchTree({ answerTextColor: v })}
          />
          <ColorField
            label="问题标签底"
            value={t.questionBadgeBg}
            onChange={(v) => patchTree({ questionBadgeBg: v })}
          />
          <ColorField
            label="问题标签边"
            value={t.questionBadgeBorder}
            onChange={(v) => patchTree({ questionBadgeBorder: v })}
          />
          <ColorField
            label="问题标签字"
            value={t.questionBadgeText}
            onChange={(v) => patchTree({ questionBadgeText: v })}
          />
          <ColorField
            label="回答标签底"
            value={t.answerBadgeBg}
            onChange={(v) => patchTree({ answerBadgeBg: v })}
          />
          <ColorField
            label="回答标签边"
            value={t.answerBadgeBorder}
            onChange={(v) => patchTree({ answerBadgeBorder: v })}
          />
          <ColorField
            label="回答标签字"
            value={t.answerBadgeText}
            onChange={(v) => patchTree({ answerBadgeText: v })}
          />
        </div>
      </div>

      <div>
        <h3 className="text-xs font-medium text-slate-700">尺寸与间距</h3>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <NumField
            label="单字宽度 px"
            value={t.charWidthPx}
            min={10}
            max={24}
            onChange={(n) => patchTree({ charWidthPx: n })}
          />
          <NumField
            label="节点最小高度 px"
            value={t.unitMinHeightPx}
            min={0}
            max={120}
            onChange={(n) => patchTree({ unitMinHeightPx: n })}
          />
          <NumField
            label="左右内边距 px"
            value={t.paddingX}
            min={0}
            max={24}
            onChange={(n) => patchTree({ paddingX: n })}
          />
          <NumField
            label="上下内边距 px"
            value={t.paddingY}
            min={0}
            max={20}
            onChange={(n) => patchTree({ paddingY: n })}
          />
          <NumField
            label="单行行高 px"
            value={t.lineHeightPx}
            min={14}
            max={32}
            onChange={(n) => patchTree({ lineHeightPx: n })}
          />
          <NumField
            label="问/答间距 px"
            value={t.qaInnerGap}
            min={0}
            max={16}
            onChange={(n) => patchTree({ qaInnerGap: n })}
          />
          <NumField
            label="方法标签留白 px"
            value={t.methodTopPad}
            min={4}
            max={24}
            onChange={(n) => patchTree({ methodTopPad: n })}
          />
          <NumField
            label="分支横向间距 px"
            value={t.branchGap}
            min={8}
            max={48}
            onChange={(n) => patchTree({ branchGap: n })}
          />
          <NumField
            label="层级纵向间距 px"
            value={t.childVerticalGap}
            min={12}
            max={80}
            onChange={(n) => patchTree({ childVerticalGap: n })}
          />
          <NumField
            label="宽度上限（字）"
            value={t.maxChars}
            min={12}
            max={40}
            onChange={(n) => patchTree({ maxChars: n })}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="primary" onClick={save}>
          保存并应用
        </Button>
        <Button size="sm" variant="ghost" onClick={reset}>
          恢复默认
        </Button>
        {saved && <span className="self-center text-xs text-green-600">已保存</span>}
      </div>
      <p className="text-[10px] leading-relaxed text-slate-400">
        保存后纵向导图立即生效；若已打开思考页，切换回该视图即可看到更新。
      </p>
    </div>
  );
}
