export type ThinkingTreeNodePrefs = {
  /** 问题正文颜色 */
  questionTextColor: string;
  /** 回答正文颜色 */
  answerTextColor: string;
  questionBadgeBg: string;
  questionBadgeBorder: string;
  questionBadgeText: string;
  answerBadgeBg: string;
  answerBadgeBorder: string;
  answerBadgeText: string;
  /** 单字估算宽度（px），影响节点整体宽度 */
  charWidthPx: number;
  /** 节点最小高度（px），0 表示随内容 */
  unitMinHeightPx: number;
  paddingX: number;
  paddingY: number;
  lineHeightPx: number;
  qaInnerGap: number;
  /** 有方法标签时，容器顶部额外留白 */
  methodTopPad: number;
  /** 同级分支横向间距 */
  branchGap: number;
  /** 父节点与子节点层级纵向间距 */
  childVerticalGap: number;
  labelWidth: number;
  maxChars: number;
};

export type ThinkingLayoutPrefs = {
  /** 画布+文字视图的兄弟子树垂直间距（px） */
  siblingGap: number;
  /** 节点变化时自动缩放以尽量完整显示 */
  autoFit: boolean;
  tree: ThinkingTreeNodePrefs;
};

export const THINK_LAYOUT_GAP_MIN = 12;
export const THINK_LAYOUT_GAP_MAX = 80;
export const THINK_LAYOUT_GAP_DEFAULT = 32;

export const THINK_TREE_PREFS_CHANGED = "thinking-layout-prefs-changed";

export const DEFAULT_TREE_NODE_PREFS: ThinkingTreeNodePrefs = {
  questionTextColor: "#000000",
  answerTextColor: "#000000",
  questionBadgeBg: "#38BDF8",
  questionBadgeBorder: "#0EA5E9",
  questionBadgeText: "#0C4A6E",
  answerBadgeBg: "#A3E635",
  answerBadgeBorder: "#65A30D",
  answerBadgeText: "#14532D",
  charWidthPx: 14,
  unitMinHeightPx: 0,
  paddingX: 8,
  paddingY: 4,
  lineHeightPx: 18,
  qaInnerGap: 4,
  methodTopPad: 10,
  branchGap: 12,
  childVerticalGap: 44,
  labelWidth: 26,
  maxChars: 30,
};

export const DEFAULT_THINKING_LAYOUT_PREFS: ThinkingLayoutPrefs = {
  siblingGap: THINK_LAYOUT_GAP_DEFAULT,
  autoFit: true,
  tree: DEFAULT_TREE_NODE_PREFS,
};

const STORAGE_KEY = "workshop-thinking-layout-prefs";

function clamp(n: number, min: number, max: number, fallback: number) {
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

function normalizeTreePrefs(
  raw: Partial<ThinkingTreeNodePrefs> | undefined
): ThinkingTreeNodePrefs {
  const d = DEFAULT_TREE_NODE_PREFS;
  return {
    questionTextColor:
      typeof raw?.questionTextColor === "string"
        ? raw.questionTextColor
        : d.questionTextColor,
    answerTextColor:
      typeof raw?.answerTextColor === "string"
        ? raw.answerTextColor
        : d.answerTextColor,
    questionBadgeBg:
      typeof raw?.questionBadgeBg === "string"
        ? raw.questionBadgeBg
        : d.questionBadgeBg,
    questionBadgeBorder:
      typeof raw?.questionBadgeBorder === "string"
        ? raw.questionBadgeBorder
        : d.questionBadgeBorder,
    questionBadgeText:
      typeof raw?.questionBadgeText === "string"
        ? raw.questionBadgeText
        : d.questionBadgeText,
    answerBadgeBg:
      typeof raw?.answerBadgeBg === "string"
        ? raw.answerBadgeBg
        : d.answerBadgeBg,
    answerBadgeBorder:
      typeof raw?.answerBadgeBorder === "string"
        ? raw.answerBadgeBorder
        : d.answerBadgeBorder,
    answerBadgeText:
      typeof raw?.answerBadgeText === "string"
        ? raw.answerBadgeText
        : d.answerBadgeText,
    charWidthPx: clamp(raw?.charWidthPx ?? d.charWidthPx, 10, 24, d.charWidthPx),
    unitMinHeightPx: clamp(
      raw?.unitMinHeightPx ?? d.unitMinHeightPx,
      0,
      120,
      d.unitMinHeightPx
    ),
    paddingX: clamp(raw?.paddingX ?? d.paddingX, 0, 24, d.paddingX),
    paddingY: clamp(raw?.paddingY ?? d.paddingY, 0, 20, d.paddingY),
    lineHeightPx: clamp(raw?.lineHeightPx ?? d.lineHeightPx, 14, 32, d.lineHeightPx),
    qaInnerGap: clamp(raw?.qaInnerGap ?? d.qaInnerGap, 0, 16, d.qaInnerGap),
    methodTopPad: clamp(raw?.methodTopPad ?? d.methodTopPad, 4, 24, d.methodTopPad),
    branchGap: clamp(raw?.branchGap ?? d.branchGap, 8, 48, d.branchGap),
    childVerticalGap: clamp(
      raw?.childVerticalGap ?? d.childVerticalGap,
      12,
      80,
      d.childVerticalGap
    ),
    labelWidth: clamp(raw?.labelWidth ?? d.labelWidth, 20, 40, d.labelWidth),
    maxChars: clamp(raw?.maxChars ?? d.maxChars, 12, 40, d.maxChars),
  };
}

export function loadThinkingLayoutPrefs(): ThinkingLayoutPrefs {
  if (typeof window === "undefined") return DEFAULT_THINKING_LAYOUT_PREFS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_THINKING_LAYOUT_PREFS;
    const parsed = JSON.parse(raw) as Partial<ThinkingLayoutPrefs>;
    const gap = Number(parsed.siblingGap);
    return {
      siblingGap: Number.isFinite(gap)
        ? Math.min(THINK_LAYOUT_GAP_MAX, Math.max(THINK_LAYOUT_GAP_MIN, gap))
        : THINK_LAYOUT_GAP_DEFAULT,
      autoFit: parsed.autoFit !== false,
      tree: normalizeTreePrefs(parsed.tree),
    };
  } catch {
    return DEFAULT_THINKING_LAYOUT_PREFS;
  }
}

export function saveThinkingLayoutPrefs(prefs: ThinkingLayoutPrefs) {
  if (typeof window === "undefined") return;
  const normalized: ThinkingLayoutPrefs = {
    siblingGap: Math.min(
      THINK_LAYOUT_GAP_MAX,
      Math.max(THINK_LAYOUT_GAP_MIN, prefs.siblingGap)
    ),
    autoFit: prefs.autoFit,
    tree: normalizeTreePrefs(prefs.tree),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent(THINK_TREE_PREFS_CHANGED));
}

export type TreeLayoutConfig = ThinkingTreeNodePrefs;

export function treeLayoutConfig(
  prefs: ThinkingLayoutPrefs = DEFAULT_THINKING_LAYOUT_PREFS
): TreeLayoutConfig {
  return prefs.tree;
}
