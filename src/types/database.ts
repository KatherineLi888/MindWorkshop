export type EntityType =
  | "decision"
  | "goal"
  | "graph_node"
  | "thinking_session"
  | "model_application"
  | "canvas_document"
  | "thinking_model"
  | "self_check"
  | "canvas_node"
  | "inbox";

export type SmartFields = {
  specific: string;
  measurable: string;
  achievable: string;
  relevant: string;
  timeBound: string;
};

export type DecisionExecutorTag = "self" | "delegate";
export type DecisionHorizonTag = "short" | "long";
export type DecisionOutcomeTag = "proceed" | "abandon";

export type DecisionRow = {
  id: string;
  user_id: string;
  title: string;
  source: "active" | "passive";
  path_summary: string;
  final_action: string;
  flow_state: Record<string, unknown>;
  background: string | null;
  constraints: string | null;
  personal_notes: string | null;
  flow_confirmed: boolean;
  tag_executor: DecisionExecutorTag | null;
  tag_horizon: DecisionHorizonTag | null;
  tag_outcome: DecisionOutcomeTag;
  /** 手动填写的决策结论 */
  manual_conclusion: string | null;
  /** 手动填写的决策目标 */
  manual_goal: string | null;
  /** 详情页追加的备忘（可勾选展示在展示区） */
  decision_notes?: {
    id: string;
    content: string;
    created_at: string;
    show_in_display: boolean;
  }[];
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

/** 目标执行区（OKR / 量化），存于 goals.execution */
export type GoalExecutionFields = {
  start_date?: string | null;
  due_date: string | null;
  target_quantity: number | null;
  current_quantity: number;
  quantity_unit: string;
  progressMode?: "auto" | "manual";
  key_results: {
    id: string;
    title: string;
    target: number;
    current: number;
    unit: string;
    weight?: number;
    /** @deprecated use recordMode */
    trackMode?: "auto" | "manual";
    manualProgress?: number;
    recordMode?: "set" | "accumulate" | "count" | "consume" | "amount" | "checkin";
    start_date?: string | null;
    due_date?: string | null;
    baseline?: number | null;
    valueDirection?: "up" | "down";
    allowExceed?: boolean;
    calendarKeyword?: string;
  }[];
};

export type GoalRow = {
  id: string;
  user_id: string;
  title: string;
  goal_type: "near" | "long" | "pending";
  progress: number;
  smart_current: SmartFields;
  execution?: GoalExecutionFields;
  created_at: string;
  updated_at: string;
};

export type TrackLoopbackTarget = "thinking" | "decisions" | "goals";

export type GraphNodeRow = {
  id: string;
  user_id: string;
  node_type: "problem" | "idea" | "practice" | "related";
  title: string;
  background: string;
  /** 问题导向：当前卡点或待解问题 */
  problem_focus?: string;
  /** 解决思路 */
  solution_approach?: string;
  /** 锚定来源：目标或决策（新建必填） */
  anchor_type?: "goal" | "decision" | "goal_kr" | null;
  anchor_id?: string | null;
  /** 已解决且不影响整体进程 */
  resolved?: boolean;
  /** 未解决时需回转的阶段；resolved 时忽略 */
  loopback_target?: TrackLoopbackTarget | null;
  status: "tracking" | "paused" | "abandoned" | "ongoing";
  position_x: number;
  position_y: number;
  created_at: string;
  updated_at: string;
};

export type ThinkingModelRow = {
  id: string;
  user_id: string;
  name: string;
  description: string;
  model_type: "quadrant" | "stage";
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type EntityLinkRow = {
  id: string;
  user_id: string;
  from_type: string;
  from_id: string;
  to_type: string;
  to_id: string;
  created_at: string;
};
