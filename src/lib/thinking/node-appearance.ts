import type { ThinkingMethodDef } from "./methods";
import { THINK_FONT_FAMILY } from "./methods";
import type { ThoughtNode } from "./types";

export const THINK_METHOD_RAIL_W = 36;

export const THINK_BORDER = "#B8C5D6";
export const THINK_BORDER_TOPIC = "#6B7A8F";
export const THINK_BORDER_MERGE = "#A8B4C4";

export const THINK_FILL_ANSWER = "#F7FCF9";
export const THINK_FILL_TOPIC = "#FFFFFF";
export const THINK_FILL_MERGE = "#FAFBFC";

export const THINK_TEXT = "#475569";
export const THINK_TEXT_TOPIC = "#0F172A";
export const THINK_EDGE = "#D1DCE8";

export type ThoughtNodeEmphasis =
  | "text-red"
  | "text-blue"
  | "text-amber"
  | "bg-amber"
  | "bg-sky"
  | "bg-rose"
  | "bg-violet";

export type EmphasisPreset = {
  id: ThoughtNodeEmphasis | "none";
  label: string;
  kind: "text" | "bg";
  color: string;
};

export const EMPHASIS_PRESETS: EmphasisPreset[] = [
  { id: "none", label: "默认样式", kind: "text", color: THINK_TEXT },
  { id: "text-red", label: "红字强调", kind: "text", color: "#DC2626" },
  { id: "text-blue", label: "蓝字强调", kind: "text", color: "#2563EB" },
  { id: "text-amber", label: "橙字强调", kind: "text", color: "#D97706" },
  { id: "bg-amber", label: "琥珀底", kind: "bg", color: "#FFFBEB" },
  { id: "bg-sky", label: "天蓝底", kind: "bg", color: "#F0F9FF" },
  { id: "bg-rose", label: "玫瑰底", kind: "bg", color: "#FFF1F2" },
  { id: "bg-violet", label: "淡紫底", kind: "bg", color: "#F5F3FF" },
];

export type MethodRailStyle = {
  width: number;
  railBg: string;
  contentBg: string;
  color: string;
  label: string;
};

export type ResolvedNodeAppearance = {
  fill: string;
  stroke: string;
  text: string;
  strokeWidth: number;
  fontSize: number;
  fontWeight: number;
  fontFamily: string;
  isTopic: boolean;
  isMethodQuestion: boolean;
  methodRail: MethodRailStyle | null;
  showBadge: boolean;
  badge: string | null;
};

export function isMethodQuestion(node: ThoughtNode): boolean {
  return node.type === "question" && Boolean(node.method);
}

export function isTopicNode(node: ThoughtNode): boolean {
  return node.type === "topic";
}

export function resolveNodeAppearance(
  node: ThoughtNode,
  getMethod: (id: string) => ThinkingMethodDef
): ResolvedNodeAppearance {
  let fill = "#FFFFFF";
  let stroke = THINK_BORDER;
  let text = THINK_TEXT;
  let strokeWidth = 1;
  let fontSize = 11;
  let fontWeight = 400;
  let methodRail: MethodRailStyle | null = null;
  let showBadge = false;
  let badge: string | null = null;
  const methodQ = isMethodQuestion(node);
  const isTopic = isTopicNode(node);

  if (isTopic) {
    fill = THINK_FILL_TOPIC;
    stroke = THINK_BORDER_TOPIC;
    text = THINK_TEXT_TOPIC;
    strokeWidth = 2;
    fontSize = 16;
    fontWeight = 700;
  } else if (node.type === "conclusion") {
    fill = THINK_FILL_TOPIC;
    stroke = THINK_BORDER;
    strokeWidth = 2;
    fontSize = 13;
    fontWeight = 600;
    text = "#334155";
    showBadge = true;
    badge = "结论";
  } else if (node.type === "merge") {
    fill = THINK_FILL_MERGE;
    stroke = THINK_BORDER_MERGE;
    showBadge = true;
    badge = "合并";
  } else if (node.type === "answer") {
    fill = THINK_FILL_ANSWER;
    stroke = THINK_BORDER;
    fontSize = 12;
    fontWeight = 500;
  } else if (methodQ && node.method) {
    const m = getMethod(node.method);
    fill = m.contentBg;
    stroke = THINK_BORDER;
    strokeWidth = 2;
    fontSize = 13;
    fontWeight = 600;
    text = "#334155";
    methodRail = {
      width: THINK_METHOD_RAIL_W,
      railBg: m.railBg,
      contentBg: m.contentBg,
      color: m.color,
      label: m.short,
    };
  }

  const preset = node.emphasis
    ? EMPHASIS_PRESETS.find((p) => p.id === node.emphasis)
    : undefined;

  if (preset && preset.id !== "none") {
    if (preset.kind === "text") {
      text = preset.color;
    } else if (!methodQ) {
      fill = preset.color;
    }
  }

  return {
    fill,
    stroke,
    text,
    strokeWidth,
    fontSize,
    fontWeight,
    fontFamily: THINK_FONT_FAMILY,
    isTopic,
    isMethodQuestion: methodQ,
    methodRail,
    showBadge,
    badge,
  };
}
