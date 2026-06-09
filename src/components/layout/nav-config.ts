export const HOME_NAV = {
  href: "/home",
  label: "首页",
  icon: "⌂",
} as const;

export const STATS_NAV = {
  href: "/stats",
  label: "统计",
  icon: "📊",
} as const;

export const AI_NAV = {
  href: "/ai",
  label: "AI 助手",
  icon: "✨",
} as const;

export const SEEDS_NAV = {
  href: "/seeds",
  label: "种子",
  icon: "◌",
} as const;

/** 根源：一切想法最原始的出发位置 */
export const ROOT_NAV_GROUP: NavGroup = {
  label: "根源",
  items: [SEEDS_NAV],
};

export type NavItem = {
  href: string;
  label: string;
  icon: string;
};

export type NavGroup = {
  label: string;
  items: readonly NavItem[];
};

/** 思考入口（便于 active 判断） */
export const THINKING_NAV = {
  href: "/thinking",
  label: "思考",
  icon: "◉",
} as const;

/** 时间轴流程：收录 → 探索 → 收敛 → 承诺 → 复盘 */
export const FLOW_NAV_ITEMS: readonly NavItem[] = [
  { href: "/inbox", label: "收集箱", icon: "▤" },
  { href: "/thinking", label: "思考", icon: "◉" },
  { href: "/decisions", label: "决策", icon: "◇" },
  { href: "/goals", label: "目标", icon: "◎" },
  { href: "/graph", label: "追踪", icon: "◈" },
  { href: "/review", label: "复盘", icon: "↺" },
] as const;

/** 知识库：理论、模型与画布 */
export const KNOWLEDGE_NAV_GROUP: NavGroup = {
  label: "知识库",
  items: [
    { href: "/theories", label: "理论", icon: "◈" },
    { href: "/models", label: "模型", icon: "▣" },
    { href: "/canvas", label: "画布", icon: "◫" },
  ],
};

/** 移动端底栏扁平列表（根源 + 流程 + 知识库） */
export const NAV_ITEMS: readonly NavItem[] = [
  ...ROOT_NAV_GROUP.items,
  ...FLOW_NAV_ITEMS,
  ...KNOWLEDGE_NAV_GROUP.items,
];

export const ARCHIVE_NAV = {
  href: "/archive",
  label: "总归档箱",
  icon: "▦",
} as const;

export function isHomeNavActive(pathname: string): boolean {
  return pathname === HOME_NAV.href;
}

export function isAiNavActive(pathname: string): boolean {
  return pathname === AI_NAV.href || pathname.startsWith("/ai/");
}

export function isStatsNavActive(pathname: string): boolean {
  return pathname === STATS_NAV.href;
}

export function isSeedsNavActive(pathname: string): boolean {
  return pathname === SEEDS_NAV.href || pathname.startsWith(`${SEEDS_NAV.href}/`);
}

export function isThinkingNavActive(pathname: string): boolean {
  return (
    pathname === THINKING_NAV.href ||
    pathname.startsWith(`${THINKING_NAV.href}/`)
  );
}

export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/decisions") return pathname === "/decisions";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isInboxNavActive(pathname: string): boolean {
  return pathname === "/inbox" || pathname.startsWith("/inbox/");
}

export function isArchiveNavActive(pathname: string): boolean {
  return pathname === ARCHIVE_NAV.href || pathname.startsWith("/archive/");
}
