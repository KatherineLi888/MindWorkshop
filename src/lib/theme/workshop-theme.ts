import { loadLocal, saveLocal } from "@/lib/local-store";

export const WORKSHOP_THEME_CHANGED = "workshop-theme-changed";

export const THEME_STORAGE_KEY = "workshop-theme-prefs";

export type WorkshopThemePrefs = {
  /** 预设 id，custom 表示用户自行改色 */
  presetId: string;
  primary: string;
  accent: string;
  background: string;
  surface: string;
  border: string;
  foreground: string;
};

export type ThemePreset = {
  id: string;
  label: string;
  primary: string;
  accent: string;
};

export const THEME_PRESETS: ThemePreset[] = [
  { id: "sky", label: "浅蓝", primary: "#38BDF8", accent: "#FBBF24" },
  { id: "cyan", label: "青绿", primary: "#2DD4BF", accent: "#FB7185" },
  { id: "ocean", label: "海蓝", primary: "#3B82F6", accent: "#FDE047" },
  { id: "mint", label: "薄荷", primary: "#34D399", accent: "#F472B6" },
  { id: "lavender", label: "薰衣", primary: "#A78BFA", accent: "#34D399" },
  { id: "coral", label: "珊瑚", primary: "#FB923C", accent: "#22D3EE" },
  { id: "blossom", label: "樱粉", primary: "#F472B6", accent: "#38BDF8" },
];

const LEGACY_PRESET_IDS: Record<string, string> = {
  blue: "ocean",
  teal: "cyan",
  violet: "lavender",
  rose: "blossom",
  amber: "coral",
  emerald: "mint",
  slate: "ocean",
};

export function getThemePresetLabel(presetId: string): string {
  if (presetId === "custom") return "自定义";
  const preset = THEME_PRESETS.find((p) => p.id === presetId);
  return preset?.label ?? "自定义";
}

const DEFAULT_NEUTRALS = {
  background: "#FFFFFF",
  surface: "#F8FAFC",
  border: "#E2E8F0",
  foreground: "#1E293B",
};

export const DEFAULT_WORKSHOP_THEME: WorkshopThemePrefs = {
  presetId: "sky",
  primary: THEME_PRESETS[0].primary,
  accent: THEME_PRESETS[0].accent,
  ...DEFAULT_NEUTRALS,
};

function parseHex(hex: string): [number, number, number] | null {
  const raw = hex.trim().replace(/^#/, "");
  if (raw.length === 3) {
    const r = parseInt(raw[0] + raw[0], 16);
    const g = parseInt(raw[1] + raw[1], 16);
    const b = parseInt(raw[2] + raw[2], 16);
    if ([r, g, b].some((n) => Number.isNaN(n))) return null;
    return [r, g, b];
  }
  if (raw.length === 6) {
    const r = parseInt(raw.slice(0, 2), 16);
    const g = parseInt(raw.slice(2, 4), 16);
    const b = parseInt(raw.slice(4, 6), 16);
    if ([r, g, b].some((n) => Number.isNaN(n))) return null;
    return [r, g, b];
  }
  return null;
}

function toHex(r: number, g: number, b: number): string {
  const c = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`.toUpperCase();
}

function normalizeHex(input: string, fallback: string): string {
  const rgb = parseHex(input);
  if (!rgb) return fallback;
  return toHex(...rgb);
}

function mixWithWhite(hex: string, whiteRatio: number): string {
  const rgb = parseHex(hex);
  if (!rgb) return hex;
  const [r, g, b] = rgb;
  return toHex(
    r + (255 - r) * whiteRatio,
    g + (255 - g) * whiteRatio,
    b + (255 - b) * whiteRatio
  );
}

function adjustBrightness(hex: string, factor: number): string {
  const rgb = parseHex(hex);
  if (!rgb) return hex;
  return toHex(rgb[0] * factor, rgb[1] * factor, rgb[2] * factor);
}

function hexToRgba(hex: string, alpha: number): string {
  const rgb = parseHex(hex);
  if (!rgb) return `rgba(59, 130, 246, ${alpha})`;
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

export function normalizeThemePrefs(
  raw: Partial<WorkshopThemePrefs> | undefined
): WorkshopThemePrefs {
  const base = DEFAULT_WORKSHOP_THEME;
  if (!raw) return { ...base };
  return {
    presetId: raw.presetId ?? base.presetId,
    primary: normalizeHex(raw.primary ?? base.primary, base.primary),
    accent: normalizeHex(raw.accent ?? base.accent, base.accent),
    background: normalizeHex(raw.background ?? base.background, base.background),
    surface: normalizeHex(raw.surface ?? base.surface, base.surface),
    border: normalizeHex(raw.border ?? base.border, base.border),
    foreground: normalizeHex(raw.foreground ?? base.foreground, base.foreground),
  };
}

export function themeFromPreset(presetId: string): WorkshopThemePrefs {
  const resolved = LEGACY_PRESET_IDS[presetId] ?? presetId;
  const preset = THEME_PRESETS.find((p) => p.id === resolved);
  if (!preset) return { ...DEFAULT_WORKSHOP_THEME, presetId: "custom" };
  return {
    presetId: preset.id,
    primary: preset.primary,
    accent: preset.accent,
    ...DEFAULT_NEUTRALS,
  };
}

export function loadWorkshopTheme(): WorkshopThemePrefs {
  return normalizeThemePrefs(
    loadLocal<Partial<WorkshopThemePrefs>>(THEME_STORAGE_KEY, DEFAULT_WORKSHOP_THEME)
  );
}

export function saveWorkshopTheme(prefs: WorkshopThemePrefs) {
  const next = normalizeThemePrefs(prefs);
  saveLocal(THEME_STORAGE_KEY, next);
  applyWorkshopTheme(next);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(WORKSHOP_THEME_CHANGED, { detail: next }));
  }
  return next;
}

export function applyWorkshopTheme(prefs: WorkshopThemePrefs) {
  if (typeof document === "undefined") return;
  const p = normalizeThemePrefs(prefs);
  const root = document.documentElement;
  root.style.setProperty("--background", p.background);
  root.style.setProperty("--foreground", p.foreground);
  root.style.setProperty("--surface", p.surface);
  root.style.setProperty("--border", p.border);
  root.style.setProperty("--primary", p.primary);
  root.style.setProperty("--primary-hover", adjustBrightness(p.primary, 0.88));
  root.style.setProperty("--primary-soft", mixWithWhite(p.primary, 0.92));
  root.style.setProperty("--primary-muted", mixWithWhite(p.primary, 0.85));
  root.style.setProperty("--primary-ring", hexToRgba(p.primary, 0.35));
  root.style.setProperty("--primary-ring-soft", hexToRgba(p.primary, 0.15));
  root.style.setProperty("--accent", p.accent);
  root.style.setProperty("--accent-soft", mixWithWhite(p.accent, 0.9));
  root.dataset.themePreset = p.presetId;
}

export function resetWorkshopTheme(): WorkshopThemePrefs {
  return saveWorkshopTheme({ ...DEFAULT_WORKSHOP_THEME });
}
