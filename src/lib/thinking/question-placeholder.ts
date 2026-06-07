import type { ThinkingMethodDef } from "./methods";
import type { ThoughtNode } from "./types";

/** 将方法模板转为灰色占位提示（不含预设正文） */
export function patternToPlaceholderHint(pattern: string): string {
  return pattern
    .replace(/\{anchor\}/g, "…")
    .replace(/「」/g, "「…」");
}

export function dualQuestionPlaceholderHints(): [string, string] {
  return [
    patternToPlaceholderHint("利：选择「{anchor}」的好处？"),
    patternToPlaceholderHint("弊：选择「{anchor}」的代价？"),
  ];
}

export function multilinePlaceholderHints(method: {
  multilineDefault?: string;
  promptPattern: string;
  description: string;
}): string[] {
  const raw = method.multilineDefault?.trim();
  if (raw) {
    const lines = raw
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length) return lines;
  }
  return [
    method.description || patternToPlaceholderHint(method.promptPattern),
  ];
}

export function resolveQuestionPlaceholder(
  node: ThoughtNode,
  getMethod: (id: string) => ThinkingMethodDef
): string {
  if (node.content.trim()) return "输入问题…";
  if (node.placeholderHint) return node.placeholderHint;
  if (node.method) {
    const m = getMethod(node.method);
    return (
      patternToPlaceholderHint(m.promptPattern) ||
      m.description ||
      "输入问题…"
    );
  }
  return "输入问题…";
}
