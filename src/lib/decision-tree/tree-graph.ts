import type { FlowAnswers } from "./flow";
import { ABANDON_TERMINAL_IDS, getTreeNodeLabel, isAbandonTerminal } from "./flow";

export { isAbandonTerminal };

export type TreeNodeDef = {
  id: string;
  label: string;
  x: number;
  y: number;
  w?: number;
  trunk?: "active" | "passive" | "neutral";
};

export type TreeEdgeDef = {
  from: string;
  to: string;
  trunk?: "active" | "passive" | "neutral";
};

/** 主流程布局（确认节点单独放最右侧，不与终点连线） */
function treeLabel(id: string): string {
  return getTreeNodeLabel(id);
}

export const TREE_NODES: TreeNodeDef[] = [
  { id: "origin", label: treeLabel("origin"), x: 8, y: 98, w: 56, trunk: "neutral" },
  { id: "active_value", label: treeLabel("active_value"), x: 100, y: 38, w: 56, trunk: "active" },
  { id: "passive_exchange", label: treeLabel("passive_exchange"), x: 100, y: 158, w: 56, trunk: "passive" },
  { id: "end_no_value_active", label: treeLabel("end_no_value_active"), x: 196, y: 38, w: 44, trunk: "active" },
  { id: "end_no_exchange", label: treeLabel("end_no_exchange"), x: 196, y: 158, w: 44, trunk: "passive" },
  { id: "exec_mode", label: treeLabel("exec_mode"), x: 256, y: 98, w: 52, trunk: "neutral" },
  { id: "cycle", label: treeLabel("cycle"), x: 352, y: 38, w: 56, trunk: "active" },
  { id: "altruism", label: treeLabel("altruism"), x: 352, y: 158, w: 48, trunk: "passive" },
  { id: "short_convert", label: treeLabel("short_convert"), x: 448, y: 22, w: 52, trunk: "active" },
  { id: "long_type", label: treeLabel("long_type"), x: 448, y: 54, w: 52, trunk: "active" },
  { id: "end_short_once", label: treeLabel("end_short_once"), x: 540, y: 22, w: 44, trunk: "active" },
  { id: "end_growth", label: treeLabel("end_growth"), x: 540, y: 54, w: 44, trunk: "active" },
  { id: "project_loop", label: treeLabel("project_loop"), x: 540, y: 86, w: 48, trunk: "active" },
  { id: "project_eval", label: treeLabel("project_eval"), x: 628, y: 86, w: 52, trunk: "active" },
  { id: "end_project_good", label: treeLabel("end_project_good"), x: 628, y: 118, w: 44, trunk: "active" },
  { id: "end_altruism", label: treeLabel("end_altruism"), x: 448, y: 132, w: 44, trunk: "passive" },
  { id: "not_altruism", label: treeLabel("not_altruism"), x: 448, y: 164, w: 56, trunk: "passive" },
  { id: "end_drop", label: treeLabel("end_drop"), x: 540, y: 148, w: 44, trunk: "passive" },
  { id: "end_redesign", label: treeLabel("end_redesign"), x: 540, y: 180, w: 52, trunk: "passive" },
];

/** 内心确认：固定在最右侧，逻辑上接在终点之后，图上不画连线 */
export const FLOW_CONFIRM_NODE: TreeNodeDef = {
  id: "flow_confirm",
  label: treeLabel("flow_confirm"),
  x: 748,
  y: 98,
  w: 48,
  trunk: "neutral",
};

export const TREE_EDGES: TreeEdgeDef[] = [
  { from: "origin", to: "active_value", trunk: "active" },
  { from: "origin", to: "passive_exchange", trunk: "passive" },
  { from: "active_value", to: "end_no_value_active", trunk: "active" },
  { from: "active_value", to: "exec_mode", trunk: "active" },
  { from: "passive_exchange", to: "end_no_exchange", trunk: "passive" },
  { from: "passive_exchange", to: "exec_mode", trunk: "passive" },
  { from: "exec_mode", to: "cycle", trunk: "active" },
  { from: "exec_mode", to: "altruism", trunk: "passive" },
  { from: "cycle", to: "short_convert", trunk: "active" },
  { from: "cycle", to: "long_type", trunk: "active" },
  { from: "short_convert", to: "end_short_once", trunk: "active" },
  { from: "short_convert", to: "long_type", trunk: "active" },
  { from: "long_type", to: "end_growth", trunk: "active" },
  { from: "long_type", to: "project_loop", trunk: "active" },
  { from: "project_loop", to: "project_eval", trunk: "active" },
  { from: "project_eval", to: "end_project_good", trunk: "active" },
  { from: "project_eval", to: "project_loop", trunk: "active" },
  { from: "altruism", to: "end_altruism", trunk: "passive" },
  { from: "altruism", to: "not_altruism", trunk: "passive" },
  { from: "not_altruism", to: "end_drop", trunk: "passive" },
  { from: "not_altruism", to: "end_redesign", trunk: "passive" },
];

export const TREE_VIEW_W = 820;
export const TREE_VIEW_H = 228;

export function edgeKey(from: string, to: string) {
  return `${from}->${to}`;
}

export function getNodeById(id: string) {
  if (id === "flow_confirm") return FLOW_CONFIRM_NODE;
  return TREE_NODES.find((n) => n.id === id);
}

/** 逻辑路径（含 → 确认），用于节点高亮 */
export function getChosenEdges(
  _answers: FlowAnswers,
  history: string[]
): Set<string> {
  const chosen = new Set<string>();
  for (let i = 0; i < history.length - 1; i++) {
    chosen.add(edgeKey(history[i], history[i + 1]));
  }
  return chosen;
}

/** 图上可绘制的连线：不画任何指向「确认」的线 */
export function isDrawableEdge(from: string, to: string): boolean {
  if (to === "flow_confirm" || from === "flow_confirm") return false;
  return true;
}

export function isAbandonNodeOnPath(nodeId: string, history: string[]): boolean {
  return (
    (ABANDON_TERMINAL_IDS as readonly string[]).includes(nodeId) &&
    history.includes(nodeId)
  );
}

export function getNodeState(
  nodeId: string,
  currentStepId: string,
  history: string[],
  chosenEdges: Set<string>
): "current" | "visited" | "on-path" | "dim" {
  if (nodeId === currentStepId) return "current";
  if (history.includes(nodeId)) return "visited";

  const drawableEdges = TREE_EDGES.filter((e) => isDrawableEdge(e.from, e.to));
  const onPath = drawableEdges.some(
    (e) =>
      (e.to === nodeId || e.from === nodeId) &&
      chosenEdges.has(edgeKey(e.from, e.to))
  );
  if (onPath) return "on-path";

  if (nodeId === "flow_confirm" && history.includes("flow_confirm")) {
    return "visited";
  }

  return "dim";
}

export const TREE_THEME = {
  canvas: "#FAFBFC",
  edgeIdle: "#E4E8EF",
  edgeIdleOpacity: 0.7,
  neutral: {
    stroke: "#B8C2CE",
    fill: "#FFFFFF",
    fillDim: "#F3F5F8",
    text: "#64748B",
    textOnPath: "#475569",
    current: "#6B7B8C",
  },
  active: {
    stroke: "#7B8FD4",
    fill: "#FFFFFF",
    fillDim: "#F5F6FC",
    text: "#8B95B8",
    textOnPath: "#434D7A",
    current: "#6B7FD6",
    edge: "#9AA8E0",
  },
  passive: {
    stroke: "#D4A88C",
    fill: "#FFFFFF",
    fillDim: "#FBF7F4",
    text: "#B8A090",
    textOnPath: "#7A5C48",
    current: "#C49272",
    edge: "#DDB9A3",
  },
} as const;

export type TrunkKind = "active" | "passive" | "neutral";

export function getTrunkPalette(trunk?: TrunkKind) {
  if (trunk === "active") return TREE_THEME.active;
  if (trunk === "passive") return TREE_THEME.passive;
  return TREE_THEME.neutral;
}

export function trunkColor(trunk?: TrunkKind) {
  return getTrunkPalette(trunk).stroke;
}

export const TREE_BOX_H = 24;

export function nodeCenter(node: TreeNodeDef): { x: number; y: number } {
  const w = node.w ?? 52;
  return { x: node.x + w / 2, y: node.y + TREE_BOX_H / 2 };
}

export function treeLinkPath(
  from: TreeNodeDef,
  to: TreeNodeDef
): string {
  const a = nodeCenter(from);
  const b = nodeCenter(to);
  return `M ${a.x} ${a.y} L ${b.x} ${b.y}`;
}

export function buildNodeLayout(history: string[]): Map<string, TreeNodeDef> {
  const map = new Map<string, TreeNodeDef>();
  for (const n of TREE_NODES) map.set(n.id, n);
  if (history.includes("flow_confirm")) {
    map.set("flow_confirm", FLOW_CONFIRM_NODE);
  }
  return map;
}
