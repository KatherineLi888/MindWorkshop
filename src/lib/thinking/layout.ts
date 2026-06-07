import { THINK_LAYOUT_GAP_DEFAULT } from "./layout-prefs";
import {
  THINK_COL_W,
  THINK_PAD_X,
  THINK_PAD_Y,
  estimateNodeHeight,
  estimateNodeWidth,
  nodeCenterY,
} from "./node-metrics";
import type { ThoughtNode } from "./types";

export type ThoughtLayoutOptions = {
  siblingGap?: number;
  childOrder?: Record<string, string[]>;
};

type LayoutCtx = {
  siblingGap: number;
  childOrder?: Record<string, string[]>;
};

export type GraphContentBounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

const GRAPH_MIN_H = 320;

export type NodeLayout = {
  col: number;
  x: number;
  y: number;
  w: number;
  h: number;
};

type Bounds = { top: number; bottom: number };

function buildChildrenMap(nodes: ThoughtNode[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const n of nodes) {
    for (const p of n.parentIds) {
      if (!map.has(p)) map.set(p, []);
      map.get(p)!.push(n.id);
    }
  }
  return map;
}

function computeColumns(
  nodes: ThoughtNode[],
  byId: Map<string, ThoughtNode>
): Map<string, number> {
  const col = new Map<string, number>();

  function depth(id: string, visiting = new Set<string>()): number {
    if (col.has(id)) return col.get(id)!;
    if (visiting.has(id)) return 0;
    visiting.add(id);
    const node = byId.get(id);
    if (!node || node.parentIds.length === 0) {
      col.set(id, 0);
      return 0;
    }
    const d =
      Math.max(...node.parentIds.map((p) => depth(p, visiting))) + 1;
    col.set(id, d);
    return d;
  }

  for (const n of nodes) depth(n.id);
  return col;
}

function sortKids(
  kids: string[],
  byId: Map<string, ThoughtNode>,
  parentId: string,
  childOrder?: Record<string, string[]>
): string[] {
  const order = childOrder?.[parentId];
  if (order?.length) {
    const set = new Set(kids);
    const sorted: string[] = [];
    for (const id of order) {
      if (set.has(id)) sorted.push(id);
    }
    for (const id of kids) {
      if (!sorted.includes(id)) sorted.push(id);
    }
    return sorted;
  }
  return [...kids].sort((a, b) =>
    (byId.get(a)?.createdAt ?? "").localeCompare(
      byId.get(b)?.createdAt ?? ""
    )
  );
}

function isDeferredMerge(node: ThoughtNode | undefined): boolean {
  return (
    (node?.type === "merge" || node?.type === "conclusion") &&
    (node.parentIds.length ?? 0) > 1
  );
}

function layoutKids(
  id: string,
  byId: Map<string, ThoughtNode>,
  children: Map<string, string[]>,
  ctx: LayoutCtx
): string[] {
  return sortKids(
    (children.get(id) ?? []).filter(
      (k) => byId.has(k) && !isDeferredMerge(byId.get(k))
    ),
    byId,
    id,
    ctx.childOrder
  );
}

function setNodeY(
  id: string,
  centerY: number,
  byId: Map<string, ThoughtNode>,
  yPos: Map<string, number>
) {
  const node = byId.get(id);
  if (!node) return;
  const h = estimateNodeHeight(node);
  yPos.set(id, centerY - h / 2);
}

function shiftAllY(yPos: Map<string, number>, delta: number) {
  for (const [id, y] of yPos) {
    yPos.set(id, y + delta);
  }
}

function shiftSubtree(
  id: string,
  delta: number,
  byId: Map<string, ThoughtNode>,
  children: Map<string, string[]>,
  yPos: Map<string, number>,
  visiting = new Set<string>()
) {
  if (visiting.has(id)) return;
  visiting.add(id);
  if (yPos.has(id)) {
    yPos.set(id, yPos.get(id)! + delta);
  }
  for (const k of children.get(id) ?? []) {
    if (byId.has(k)) shiftSubtree(k, delta, byId, children, yPos, visiting);
  }
}

/**
 * 子树在竖向上占用的总高度（XMind：按子树真实高度堆叠，不单放节点中心）。
 * - 0 子：本节点高
 * - 1 子：与子树同高（主轴水平延伸，不额外占高）
 * - ≥2 子：各子树高之和 + 兄弟间距
 */
function measureSubtreeSpan(
  id: string,
  byId: Map<string, ThoughtNode>,
  children: Map<string, string[]>,
  memo: Map<string, number>,
  ctx: LayoutCtx
): number {
  if (memo.has(id)) return memo.get(id)!;
  const node = byId.get(id);
  if (!node) return 0;

  const kids = layoutKids(id, byId, children, ctx);
  const selfH = estimateNodeHeight(node);

  if (kids.length === 0) {
    memo.set(id, selfH);
    return selfH;
  }
  if (kids.length === 1) {
    const span = measureSubtreeSpan(kids[0], byId, children, memo, ctx);
    memo.set(id, span);
    return span;
  }

  let total = 0;
  kids.forEach((k, i) => {
    total += measureSubtreeSpan(k, byId, children, memo, ctx);
    if (i > 0) total += ctx.siblingGap;
  });
  memo.set(id, total);
  return total;
}

/**
 * XMind 逻辑图（向右）：从 topY 起向下排子树；单子节点与父同高；
 * 多子节点按子树高度顺次堆叠，父节点垂直居中于子节点块。
 */
function layoutSubtree(
  id: string,
  topY: number,
  byId: Map<string, ThoughtNode>,
  children: Map<string, string[]>,
  spanMemo: Map<string, number>,
  yPos: Map<string, number>,
  placed: Set<string>,
  ctx: LayoutCtx
): Bounds {
  if (placed.has(id)) {
    const node = byId.get(id)!;
    const y = yPos.get(id)!;
    const h = estimateNodeHeight(node);
    return { top: y, bottom: y + h };
  }

  const node = byId.get(id)!;
  const nodeH = estimateNodeHeight(node);
  const kids = layoutKids(id, byId, children, ctx);

  if (kids.length === 0) {
    setNodeY(id, topY + nodeH / 2, byId, yPos);
    placed.add(id);
    return { top: topY, bottom: topY + nodeH };
  }

  if (kids.length === 1) {
    const span = measureSubtreeSpan(kids[0], byId, children, spanMemo, ctx);
    const centerY = topY + span / 2;
    const childB = layoutSubtree(
      kids[0],
      topY,
      byId,
      children,
      spanMemo,
      yPos,
      placed,
      ctx
    );
    setNodeY(id, centerY, byId, yPos);
    placed.add(id);
    return { top: topY, bottom: Math.max(topY + span, childB.bottom) };
  }

  let cursor = topY;
  let blockTop = topY;
  let blockBottom = topY;

  for (let i = 0; i < kids.length; i++) {
    const b = layoutSubtree(
      kids[i],
      cursor,
      byId,
      children,
      spanMemo,
      yPos,
      placed,
      ctx
    );
    if (i === 0) blockTop = b.top;
    blockBottom = b.bottom;
    cursor = b.bottom + ctx.siblingGap;
  }

  const parentCenter = (blockTop + blockBottom) / 2;
  setNodeY(id, parentCenter, byId, yPos);
  placed.add(id);
  return { top: blockTop, bottom: blockBottom };
}

function contentBounds(
  nodes: ThoughtNode[],
  yPos: Map<string, number>
): { minY: number; maxY: number } {
  let minY = Infinity;
  let maxY = -Infinity;
  for (const n of nodes) {
    const y = yPos.get(n.id) ?? 0;
    const h = estimateNodeHeight(n);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y + h);
  }
  if (!Number.isFinite(minY)) return { minY: 0, maxY: GRAPH_MIN_H };
  return { minY, maxY };
}

/** 合并节点固定在全局主轴；子节点按 XMind 规则在其周围展开 */
function layoutMergeSubtree(
  mergeId: string,
  spineY: number,
  byId: Map<string, ThoughtNode>,
  children: Map<string, string[]>,
  spanMemo: Map<string, number>,
  yPos: Map<string, number>,
  placed: Set<string>,
  ctx: LayoutCtx
) {
  const kids = layoutKids(mergeId, byId, children, ctx);

  setNodeY(mergeId, spineY, byId, yPos);
  placed.add(mergeId);

  if (kids.length === 0) return;

  if (kids.length === 1) {
    const span = measureSubtreeSpan(kids[0], byId, children, spanMemo, ctx);
    layoutSubtree(
      kids[0],
      spineY - span / 2,
      byId,
      children,
      spanMemo,
      yPos,
      placed,
      ctx
    );
    return;
  }

  let total = 0;
  kids.forEach((k, i) => {
    total += measureSubtreeSpan(k, byId, children, spanMemo, ctx);
    if (i > 0) total += ctx.siblingGap;
  });

  let cursor = spineY - total / 2;
  for (const kid of kids) {
    const b = layoutSubtree(
      kid,
      cursor,
      byId,
      children,
      spanMemo,
      yPos,
      placed,
      ctx
    );
    cursor = b.bottom + ctx.siblingGap;
  }

  setNodeY(mergeId, spineY, byId, yPos);
}

function placeMergeNodes(
  nodes: ThoughtNode[],
  globalSpineY: number,
  byId: Map<string, ThoughtNode>,
  children: Map<string, string[]>,
  spanMemo: Map<string, number>,
  yPos: Map<string, number>,
  placed: Set<string>,
  ctx: LayoutCtx
) {
  for (const n of nodes) {
    if (!isDeferredMerge(n)) continue;

    if (placed.has(n.id)) {
      const prevCenter = nodeCenterY(yPos.get(n.id)!, n);
      const delta = globalSpineY - prevCenter;
      if (Math.abs(delta) > 0.5) {
        shiftSubtree(n.id, delta, byId, children, yPos);
        setNodeY(n.id, globalSpineY, byId, yPos);
      }
      continue;
    }

    layoutMergeSubtree(
      n.id,
      globalSpineY,
      byId,
      children,
      spanMemo,
      yPos,
      placed,
      ctx
    );
  }
}

export function layoutThoughtNodes(
  nodes: ThoughtNode[],
  rootId: string,
  options?: ThoughtLayoutOptions
): Map<string, NodeLayout> {
  const ctx: LayoutCtx = {
    siblingGap: options?.siblingGap ?? THINK_LAYOUT_GAP_DEFAULT,
    childOrder: options?.childOrder,
  };
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const children = buildChildrenMap(nodes);
  const col = computeColumns(nodes, byId);
  const spanMemo = new Map<string, number>();
  const yPos = new Map<string, number>();
  const placed = new Set<string>();

  if (byId.has(rootId)) {
    layoutSubtree(rootId, 0, byId, children, spanMemo, yPos, placed, ctx);
  }

  let { minY, maxY } = contentBounds(nodes, yPos);

  if (minY < THINK_PAD_Y) {
    const lift = THINK_PAD_Y - minY;
    shiftAllY(yPos, lift);
    maxY += lift;
    minY = THINK_PAD_Y;
  }

  const contentH = maxY - minY + THINK_PAD_Y;
  const graphH = Math.max(GRAPH_MIN_H, contentH);

  const root = byId.get(rootId);
  if (root && yPos.has(rootId)) {
    const rootCenter = nodeCenterY(yPos.get(rootId)!, root);
    shiftAllY(yPos, graphH / 2 - rootCenter);
  }

  const globalSpineY =
    root && yPos.has(rootId)
      ? nodeCenterY(yPos.get(rootId)!, root)
      : graphH / 2;

  placeMergeNodes(
    nodes,
    globalSpineY,
    byId,
    children,
    spanMemo,
    yPos,
    placed,
    ctx
  );

  for (const n of nodes) {
    if (!yPos.has(n.id)) {
      setNodeY(n.id, globalSpineY, byId, yPos);
    }
  }

  let shiftX = 0;
  if (root && yPos.has(rootId)) {
    const rw = estimateNodeWidth(root);
    const rootCx = THINK_PAD_X + rw / 2;
    let maxX = THINK_PAD_X + rw;
    for (const n of nodes) {
      const c = col.get(n.id) ?? 0;
      maxX = Math.max(
        maxX,
        THINK_PAD_X + c * THINK_COL_W + estimateNodeWidth(n)
      );
    }
    const graphW = Math.max(520, maxX + THINK_PAD_X, rootCx * 2 + THINK_PAD_X);
    shiftX = graphW / 2 - rootCx;
  }

  const pos = new Map<string, NodeLayout>();
  for (const n of nodes) {
    const c = col.get(n.id) ?? 0;
    const h = estimateNodeHeight(n);
    pos.set(n.id, {
      col: c,
      x: THINK_PAD_X + c * THINK_COL_W + shiftX,
      y: yPos.get(n.id) ?? THINK_PAD_Y,
      w: estimateNodeWidth(n),
      h,
    });
  }

  return pos;
}

/** 所有节点占用的内容区域（图坐标） */
export function graphContentBounds(
  pos: Map<string, NodeLayout>
): GraphContentBounds {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of pos.values()) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x + p.w);
    maxY = Math.max(maxY, p.y + p.h);
  }
  if (!Number.isFinite(minX)) {
    return { minX: 0, minY: 0, maxX: 480, maxY: GRAPH_MIN_H };
  }
  return { minX, minY, maxX, maxY };
}

export function computeFitView(
  bounds: GraphContentBounds,
  viewW: number,
  viewH: number,
  opts?: { minZoom?: number; maxZoom?: number; padding?: number }
): { zoom: number; pan: { x: number; y: number } } {
  const pad = opts?.padding ?? 40;
  const minZoom = opts?.minZoom ?? 0.35;
  const maxZoom = opts?.maxZoom ?? 2.5;
  const cw = bounds.maxX - bounds.minX + pad * 2;
  const ch = bounds.maxY - bounds.minY + pad * 2;
  if (cw <= 0 || ch <= 0 || viewW <= 0 || viewH <= 0) {
    return { zoom: 1, pan: { x: pad, y: pad } };
  }
  const fitZoom = Math.min(viewW / cw, viewH / ch);
  const zoom = Math.min(maxZoom, Math.max(minZoom, fitZoom));
  const cx = (bounds.minX + bounds.maxX) / 2;
  const cy = (bounds.minY + bounds.maxY) / 2;
  return {
    zoom,
    pan: {
      x: viewW / 2 - cx * zoom,
      y: viewH / 2 - cy * zoom,
    },
  };
}

export function graphViewportSize(
  pos: Map<string, NodeLayout>
): { w: number; h: number } {
  let maxX = 480;
  let minY = Infinity;
  let maxY = 0;
  for (const p of pos.values()) {
    maxX = Math.max(maxX, p.x + p.w + THINK_PAD_X);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y + p.h);
  }
  const contentH = maxY - minY + THINK_PAD_Y * 2;
  const h = Math.max(GRAPH_MIN_H, contentH);
  return { w: maxX, h };
}

/** 两点斜线直连 */
export function thoughtEdgePath(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): string {
  return `M ${x1} ${y1} L ${x2} ${y2}`;
}
