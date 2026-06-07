import { THINK_METHOD_RAIL_W, isMethodQuestion } from "./node-appearance";
import type { ThoughtNode } from "./types";

export const THINK_NODE_CONTENT_W = 176;
export const THINK_NODE_W = 184;
export const THINK_NODE_W_METHOD = THINK_METHOD_RAIL_W + THINK_NODE_CONTENT_W;
export const THINK_NODE_MIN_H = 56;
export const THINK_NODE_MIN_H_METHOD = 72;
export const THINK_COL_W = 228;
export const THINK_PAD_X = 40;
export const THINK_PAD_Y = 28;

export const THINK_BRANCH_OFFSET = 32;

const CHARS_PER_LINE = 13;
const CHARS_PER_LINE_METHOD = 9;
const LINE_PX = 15;
const LINE_PX_METHOD = 17;
const BADGE_H = 18;
const PAD_INNER = 20;
const PAD_INNER_METHOD = 24;

export function estimateNodeWidth(node: ThoughtNode): number {
  if (isMethodQuestion(node)) return THINK_NODE_W_METHOD;
  return THINK_NODE_W;
}

export function estimateNodeHeight(node: ThoughtNode): number {
  const methodQ = isMethodQuestion(node);
  const charsPerLine = methodQ ? CHARS_PER_LINE_METHOD : CHARS_PER_LINE;
  const linePx = methodQ ? LINE_PX_METHOD : LINE_PX;
  const lines = Math.max(
    1,
    Math.ceil(node.content.trim().length / charsPerLine)
  );
  const body = lines * linePx;
  const extra =
    node.type === "merge" || node.type === "conclusion" ? BADGE_H : 8;
  const pad = methodQ ? PAD_INNER_METHOD : PAD_INNER;
  const minH = methodQ ? THINK_NODE_MIN_H_METHOD : THINK_NODE_MIN_H;
  return Math.max(minH, pad + extra + body);
}

export function nodeCenterY(y: number, node: ThoughtNode): number {
  return y + estimateNodeHeight(node) / 2;
}
