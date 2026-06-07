export type ThinkingMethodId = string;

export type MethodInputKind = "single" | "multiline" | "dual";

/** 可持久化的方法定义 */
export type StoredThinkingMethod = {
  id: string;
  label: string;
  short: string;
  description: string;
  /** 支持 {anchor} 占位 */
  promptPattern: string;
  inputKind?: MethodInputKind;
  multilineDefault?: string;
  /** 竖排标签文字色 */
  color: string;
  /** 左侧色条底色 */
  railBg: string;
  /** 右侧内容区底色（更浅） */
  contentBg: string;
  builtin?: boolean;
};

export type ThinkingMethodDef = StoredThinkingMethod & {
  promptTemplate: (anchor: string) => string;
  multilineDefaultFn?: (anchor: string) => string;
};

export const THINK_FONT_FAMILY =
  '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", system-ui, sans-serif';

export function applyPromptPattern(pattern: string, anchor: string): string {
  return pattern.replace(/\{anchor\}/g, anchor);
}

export function toRuntimeMethod(stored: StoredThinkingMethod): ThinkingMethodDef {
  return {
    ...stored,
    promptTemplate: (anchor) => applyPromptPattern(stored.promptPattern, anchor),
    multilineDefaultFn: stored.multilineDefault
      ? () => stored.multilineDefault!
      : undefined,
  };
}

export const DEFAULT_STORED_METHODS: StoredThinkingMethod[] = [
  {
    id: "followup",
    label: "追问",
    short: "追问",
    description: "往下挖原因、动机",
    promptPattern: "你为什么{anchor}？",
    color: "#4338CA",
    railBg: "#E0E7FF",
    contentBg: "#F5F7FF",
    builtin: true,
  },
  {
    id: "challenge",
    label: "质疑",
    short: "质疑",
    description: "挑战前提、是否绕远路",
    promptPattern: "{anchor}真的是唯一、最有效的途径吗？有没有在绕远路？",
    color: "#B45309",
    railBg: "#FFEDD5",
    contentBg: "#FFFBEB",
    builtin: true,
  },
  {
    id: "define",
    label: "定义",
    short: "定义",
    description: "澄清关键概念",
    promptPattern: "你怎么定义「{anchor}」？",
    color: "#0F766E",
    railBg: "#CCFBF1",
    contentBg: "#F0FDFA",
    builtin: true,
  },
  {
    id: "decompose",
    label: "拆分拆解",
    short: "拆分",
    description: "大问题拆成多个子问题，并列分支",
    inputKind: "multiline",
    promptPattern: "关于「{anchor}」，需要拆解哪些子问题？",
    multilineDefault: "经济成本\n时间成本\n上岸难度\n收益回报",
    color: "#6D28D9",
    railBg: "#EDE9FE",
    contentBg: "#FAF5FF",
    builtin: true,
  },
  {
    id: "reverse",
    label: "反向推演",
    short: "反推",
    description: "从想要的最终结果倒推前置条件",
    promptPattern:
      "若「{anchor}」是想要的结果，需要满足哪些前置条件？从终点往回倒推。",
    color: "#0369A1",
    railBg: "#E0F2FE",
    contentBg: "#F0F9FF",
    builtin: true,
  },
  {
    id: "pros_cons",
    label: "利弊枚举",
    short: "利弊",
    description: "利好、弊端两条平行分支",
    inputKind: "dual",
    promptPattern: "选择「{anchor}」的利与弊？",
    color: "#BE185D",
    railBg: "#FCE7F3",
    contentBg: "#FDF2F8",
    builtin: true,
  },
  {
    id: "boundary",
    label: "边界限定",
    short: "边界",
    description: "划定范围，避免思绪发散",
    promptPattern: "讨论「{anchor}」时，适用范围是什么？排除哪些无关变量？",
    color: "#57534E",
    railBg: "#E7E5E4",
    contentBg: "#FAFAF9",
    builtin: true,
  },
  {
    id: "analogy",
    label: "类比参照",
    short: "类比",
    description: "对标同类案例、过往经验",
    promptPattern: "有哪些与「{anchor}」类似的情况或他人经验可供参照？",
    color: "#CA8A04",
    railBg: "#FEF9C3",
    contentBg: "#FEFCE8",
    builtin: true,
  },
  {
    id: "tradeoff",
    label: "取舍权衡",
    short: "权衡",
    description: "多方案对比筛选，可汇总后做最终抉择",
    promptPattern: "针对「{anchor}」，有哪些备选方案？如何横向对比优先级？",
    color: "#4338CA",
    railBg: "#E0E7FF",
    contentBg: "#F5F7FF",
    builtin: true,
  },
];

/** @deprecated 使用 method-store 的 getThinkingMethods */
export const THINKING_METHODS = DEFAULT_STORED_METHODS.map(toRuntimeMethod);
