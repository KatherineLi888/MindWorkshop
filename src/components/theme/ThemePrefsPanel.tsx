"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DEFAULT_WORKSHOP_THEME,
  THEME_PRESETS,
  applyWorkshopTheme,
  loadWorkshopTheme,
  resetWorkshopTheme,
  saveWorkshopTheme,
  themeFromPreset,
  type WorkshopThemePrefs,
} from "@/lib/theme/workshop-theme";
import { cn } from "@/lib/utils";

function ColorField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const swatch =
    value.startsWith("#") && value.length >= 7 ? value.slice(0, 7) : "#3B82F6";

  return (
    <label className="block space-y-1 text-xs text-slate-600">
      <span>{label}</span>
      {hint && <span className="block text-[10px] text-slate-400">{hint}</span>}
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={swatch}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-11 cursor-pointer rounded border border-[var(--border)] bg-white"
        />
        <Input
          className="min-w-0 flex-1 font-mono text-[11px]"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </label>
  );
}

export function ThemePrefsPanel() {
  const [prefs, setPrefs] = useState<WorkshopThemePrefs>(DEFAULT_WORKSHOP_THEME);
  const [saved, setSaved] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    setPrefs(loadWorkshopTheme());
  }, []);

  const patch = (next: Partial<WorkshopThemePrefs>) => {
    setPrefs((prev) => {
      const merged = { ...prev, ...next, presetId: "custom" };
      applyWorkshopTheme(merged);
      return merged;
    });
  };

  const pickPreset = (presetId: string) => {
    const next = themeFromPreset(presetId);
    setPrefs(next);
    applyWorkshopTheme(next);
  };

  const save = () => {
    saveWorkshopTheme(prefs);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const reset = () => {
    const next = resetWorkshopTheme();
    setPrefs(next);
    setShowAdvanced(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-slate-600">主题色预设</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {THEME_PRESETS.map((preset) => {
            const active = prefs.presetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                title={preset.label}
                onClick={() => pickPreset(preset.id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition",
                  active
                    ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)] ring-1 ring-[var(--primary-ring-soft)]"
                    : "border-[var(--border)] bg-white text-slate-600 hover:border-[var(--primary)]/40"
                )}
              >
                <span
                  className="h-4 w-4 shrink-0 rounded-full border border-black/10"
                  style={{ background: preset.primary }}
                />
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="rounded-lg border border-[var(--border)] p-3"
        style={{ background: prefs.surface }}
      >
        <p className="text-xs font-medium" style={{ color: prefs.foreground }}>
          预览
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span
            className="rounded-lg px-3 py-1.5 text-xs text-white"
            style={{ background: prefs.primary }}
          >
            主按钮
          </span>
          <span
            className="rounded-lg border px-3 py-1.5 text-xs"
            style={{
              borderColor: prefs.border,
              color: prefs.primary,
              background: prefs.background,
            }}
          >
            链接 / 选中
          </span>
          <span
            className="rounded-lg px-2 py-1 text-[10px] text-white"
            style={{ background: prefs.accent }}
          >
            强调
          </span>
        </div>
      </div>

      <button
        type="button"
        className="text-xs text-[var(--primary)] hover:underline"
        onClick={() => setShowAdvanced((v) => !v)}
      >
        {showAdvanced ? "收起自定义颜色" : "展开自定义颜色"}
      </button>

      {showAdvanced && (
        <div className="grid gap-3 sm:grid-cols-2">
          <ColorField
            label="主题色"
            hint="按钮、导航选中、链接等"
            value={prefs.primary}
            onChange={(primary) => patch({ primary })}
          />
          <ColorField
            label="强调色"
            hint="徽章、次要高亮"
            value={prefs.accent}
            onChange={(accent) => patch({ accent })}
          />
          <ColorField
            label="页面背景"
            value={prefs.background}
            onChange={(background) => patch({ background })}
          />
          <ColorField
            label="卡片 / 侧栏背景"
            value={prefs.surface}
            onChange={(surface) => patch({ surface })}
          />
          <ColorField
            label="边框色"
            value={prefs.border}
            onChange={(border) => patch({ border })}
          />
          <ColorField
            label="正文色"
            value={prefs.foreground}
            onChange={(foreground) => patch({ foreground })}
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="primary" onClick={save}>
          保存主题
        </Button>
        <Button size="sm" variant="ghost" onClick={reset}>
          恢复默认
        </Button>
        {saved && <span className="text-xs text-green-600">已保存</span>}
      </div>
    </div>
  );
}
