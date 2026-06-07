import type { ThinkingMethodId } from "./methods";
import type { ThoughtNodeEmphasis } from "./node-appearance";

export type ThoughtNodeType =
  | "topic"
  | "question"
  | "answer"
  | "merge"
  | "conclusion";

export type ThoughtNode = {
  id: string;
  type: ThoughtNodeType;
  content: string;
  method?: ThinkingMethodId;
  parentIds: string[];
  marksProgress: boolean;
  /** 用户自定义强调：红字或浅色底 */
  emphasis?: ThoughtNodeEmphasis;
  createdAt: string;
};

export type ThinkingEditorView = "split" | "text" | "tree";

/** 文字板块下某节点的子块排列 */
export type TextChildLayout = "vertical" | "split";

export type ThoughtSession = {
  id: string;
  title: string;
  nodes: ThoughtNode[];
  createdAt: string;
  updatedAt: string;
  /** 编辑器视图：画布+文字 / 纯文字 */
  editorView?: ThinkingEditorView;
  /** 节点 id → 其子节点在文字板块中的排列 */
  textChildLayout?: Record<string, TextChildLayout>;
  /** 父节点 id → 子节点 id 的显示顺序 */
  childOrder?: Record<string, string[]>;
  /** 来自首页闪念定位记录 */
  sourceTriageId?: string;
};
