import { loadLocal, saveLocal } from "@/lib/local-store";
import {
  DEFAULT_STORED_METHODS,
  type StoredThinkingMethod,
  type ThinkingMethodDef,
  toRuntimeMethod,
} from "./methods";

const STORAGE_KEY = "workshop-thinking-method-library";

type LegacyStored = StoredThinkingMethod & { bg?: string };

function migrateMethod(raw: LegacyStored): StoredThinkingMethod {
  const fallback = DEFAULT_STORED_METHODS.find((d) => d.id === raw.id);
  return {
    id: raw.id,
    label: raw.label ?? fallback?.label ?? "自定义",
    short: raw.short ?? fallback?.short ?? "法",
    description: raw.description ?? fallback?.description ?? "",
    promptPattern:
      raw.promptPattern ?? fallback?.promptPattern ?? "关于「{anchor}」？",
    inputKind: raw.inputKind ?? fallback?.inputKind,
    multilineDefault: raw.multilineDefault ?? fallback?.multilineDefault,
    color: raw.color ?? fallback?.color ?? "#4338CA",
    railBg: raw.railBg ?? raw.bg ?? fallback?.railBg ?? "#E0E7FF",
    contentBg: raw.contentBg ?? fallback?.contentBg ?? "#F5F7FF",
    builtin: raw.builtin ?? fallback?.builtin,
  };
}

export function loadStoredMethods(): StoredThinkingMethod[] {
  const saved = loadLocal<LegacyStored[] | null>(STORAGE_KEY, null);
  if (!saved?.length) return DEFAULT_STORED_METHODS.map((m) => ({ ...m }));
  return saved.map(migrateMethod);
}

export function saveStoredMethods(methods: StoredThinkingMethod[]) {
  saveLocal(STORAGE_KEY, methods);
}

export function getRuntimeMethods(
  stored = loadStoredMethods()
): ThinkingMethodDef[] {
  return stored.map(toRuntimeMethod);
}

export function getMethodById(
  id: string,
  stored = loadStoredMethods()
): ThinkingMethodDef {
  const runtime = getRuntimeMethods(stored);
  return runtime.find((m) => m.id === id) ?? runtime[0];
}

export function upsertStoredMethod(
  method: StoredThinkingMethod,
  stored = loadStoredMethods()
): StoredThinkingMethod[] {
  const idx = stored.findIndex((m) => m.id === method.id);
  const next = [...stored];
  if (idx >= 0) next[idx] = method;
  else next.push(method);
  saveStoredMethods(next);
  return next;
}

export function removeStoredMethod(
  id: string,
  stored = loadStoredMethods()
): StoredThinkingMethod[] {
  const next = stored.filter((m) => m.id !== id);
  saveStoredMethods(next);
  return next;
}

export function createCustomMethod(
  partial: Pick<
    StoredThinkingMethod,
    "label" | "short" | "description" | "promptPattern"
  > &
    Partial<
      Pick<
        StoredThinkingMethod,
        "color" | "railBg" | "contentBg" | "inputKind" | "multilineDefault"
      >
    >
): StoredThinkingMethod {
  return {
    id: `custom-${crypto.randomUUID()}`,
    label: partial.label,
    short: partial.short,
    description: partial.description,
    promptPattern: partial.promptPattern,
    inputKind: partial.inputKind,
    multilineDefault: partial.multilineDefault,
    color: partial.color ?? "#4338CA",
    railBg: partial.railBg ?? "#E0E7FF",
    contentBg: partial.contentBg ?? "#F5F7FF",
    builtin: false,
  };
}

export function resetMethodLibrary(): StoredThinkingMethod[] {
  const next = DEFAULT_STORED_METHODS.map((m) => ({ ...m }));
  saveStoredMethods(next);
  return next;
}
