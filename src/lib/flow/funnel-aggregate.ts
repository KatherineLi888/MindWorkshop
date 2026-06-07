import { loadAllDecisions } from "@/lib/decisions/storage";
import { loadAllGoals } from "@/lib/goals/storage";
import { loadAllInboxItems } from "@/lib/inbox/storage";
import { loadLocal, LOCAL_KEYS } from "@/lib/local-store";
import { loadThoughtSessions } from "@/lib/thinking/storage";
import type { EntityLinkRow, EntityType, GraphNodeRow } from "@/types/database";
import { loadFlowBlockMetaMap } from "./progress-storage";
import {
  FLOW_STAGE_HREFS,
  FLOW_STAGE_LABELS,
  FLOW_STAGE_ORDER,
  flowEntityKey,
  type FlowEntityRef,
  type FlowStage,
  type FunnelItemView,
  type FunnelSnapshot,
  type FunnelStageView,
} from "./types";

const NEXT_TYPES: Record<FlowStage, EntityType[]> = {
  inbox: ["thinking_session", "decision", "goal"],
  thinking: ["decision", "goal"],
  decisions: ["goal", "graph_node"],
  goals: ["graph_node"],
  track: [],
};

const STAGE_ENTITY: Record<
  FlowStage,
  EntityType | "inbox_manual" | "goal_pending"
> = {
  inbox: "inbox_manual",
  thinking: "thinking_session",
  decisions: "decision",
  goals: "goal",
  track: "graph_node",
};

function loadLocalLinks(): EntityLinkRow[] {
  return loadLocal<EntityLinkRow[]>(LOCAL_KEYS.entityLinks, []);
}

function hasDownstreamLink(
  links: EntityLinkRow[],
  fromType: EntityType | string,
  fromId: string,
  stage: FlowStage
): boolean {
  const targets = NEXT_TYPES[stage];
  return links.some(
    (l) =>
      l.from_type === fromType &&
      l.from_id === fromId &&
      targets.includes(l.to_type)
  );
}

function isProgressed(
  ref: FlowEntityRef,
  links: EntityLinkRow[],
  decisions: Awaited<ReturnType<typeof loadAllDecisions>>,
  goals: Awaited<ReturnType<typeof loadAllGoals>>
): boolean {
  const mapType =
    ref.entityType === "inbox_manual" ? "inbox" : ref.entityType;
  if (hasDownstreamLink(links, mapType, ref.entityId, ref.stage)) {
    return true;
  }
  if (ref.entityType === "inbox_manual") {
    if (
      hasDownstreamLink(links, "inbox", ref.entityId, ref.stage) ||
      links.some(
        (l) =>
          l.from_id === ref.entityId &&
          NEXT_TYPES.inbox.includes(l.to_type)
      )
    ) {
      return true;
    }
  }
  if (ref.stage === "decisions") {
    const d = decisions.find((x) => x.id === ref.entityId);
    if (d?.manual_goal?.trim() || d?.tag_outcome === "proceed") {
      const goalLink = links.some(
        (l) =>
          l.from_type === "decision" &&
          l.from_id === ref.entityId &&
          l.to_type === "goal"
      );
      if (goalLink || d.manual_goal?.trim()) return true;
    }
  }
  if (ref.stage === "goals") {
    const g = goals.find((x) => x.id === ref.entityId);
    if (g && g.progress > 0) {
      return hasDownstreamLink(links, "goal", ref.entityId, "goals");
    }
  }
  return false;
}

function isStuck(
  item: FunnelItemView
): boolean {
  if (item.progressed) return false;
  if (item.blockPending || (item.blockReason && item.blockReason.trim())) {
    return true;
  }
  const ageDays =
    (Date.now() - new Date(item.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
  return ageDays >= 3;
}

async function collectEntities(): Promise<FlowEntityRef[]> {
  const refs: FlowEntityRef[] = [];
  const inbox = await loadAllInboxItems();
  inbox.forEach((item) => {
    refs.push({
      stage: "inbox",
      entityType:
        item.source === "goal" ? "goal_pending" : "inbox_manual",
      entityId: item.source === "goal" ? item.goalId ?? item.id : item.id,
      title: item.title,
      href:
        item.source === "goal" && item.goalId
          ? `/goals?detail=${item.goalId}`
          : "/inbox",
      updatedAt: item.createdAt,
    });
  });

  loadThoughtSessions().forEach((s) => {
    refs.push({
      stage: "thinking",
      entityType: "thinking_session",
      entityId: s.id,
      title: s.title,
      href: `/thinking?session=${s.id}`,
      updatedAt: s.updatedAt,
    });
  });

  const decisions = await loadAllDecisions();
  decisions
    .filter((d) => !d.archived_at)
    .forEach((d) => {
      refs.push({
        stage: "decisions",
        entityType: "decision",
        entityId: d.id,
        title: d.title,
        href: "/decisions",
        updatedAt: d.updated_at,
      });
    });

  const goals = await loadAllGoals();
  goals
    .filter((g) => g.goal_type !== "pending" && g.progress < 100)
    .forEach((g) => {
      refs.push({
        stage: "goals",
        entityType: "goal",
        entityId: g.id,
        title: g.title,
        href: `/goals?detail=${g.id}`,
        updatedAt: g.updated_at,
      });
    });

  const nodes = loadLocal<GraphNodeRow[]>(LOCAL_KEYS.graphNodes, []);
  nodes.forEach((n) => {
    refs.push({
      stage: "track",
      entityType: "graph_node",
      entityId: n.id,
      title: n.title,
      href: "/graph",
      updatedAt: n.updated_at,
    });
  });

  return refs;
}

export async function buildFunnelSnapshot(): Promise<FunnelSnapshot> {
  const [refs, decisions, goals] = await Promise.all([
    collectEntities(),
    loadAllDecisions(),
    loadAllGoals(),
  ]);
  const links = loadLocalLinks();
  const blockMap = loadFlowBlockMetaMap();

  const byStage = new Map<FlowStage, FunnelItemView[]>();
  FLOW_STAGE_ORDER.forEach((s) => byStage.set(s, []));

  for (const ref of refs) {
    const key = flowEntityKey(ref.entityType, ref.entityId);
    const meta = blockMap.get(key);
    const progressed = isProgressed(ref, links, decisions, goals);
    const item: FunnelItemView = {
      ...ref,
      progressed,
      blockReason: meta?.blockReason ?? null,
      blockPending: meta?.blockPending ?? false,
    };
    byStage.get(ref.stage)?.push(item);
  }

  const stages: FunnelStageView[] = FLOW_STAGE_ORDER.map((stage) => {
    const items = byStage.get(stage) ?? [];
    const progressed = items.filter((i) => i.progressed).length;
    const stuck = items.filter((i) => isStuck(i)).length;
    return {
      stage,
      label: FLOW_STAGE_LABELS[stage],
      href: FLOW_STAGE_HREFS[stage],
      total: items.length,
      progressed,
      stuck,
      items,
    };
  });

  return { stages, updatedAt: new Date().toISOString() };
}

export function funnelToExportRows(snapshot: FunnelSnapshot) {
  const rows: Record<string, string | number>[] = [];
  for (const stage of snapshot.stages) {
    rows.push({
      阶段: stage.label,
      总量: stage.total,
      已推进到下一步: stage.progressed,
      卡住: stage.stuck,
      条目: "",
      状态: "汇总",
      未推进原因: "",
    });
    for (const item of stage.items) {
      rows.push({
        阶段: stage.label,
        总量: "",
        已推进到下一步: "",
        卡住: "",
        条目: item.title,
        状态: item.progressed
          ? "已推进"
          : item.blockPending
            ? "待定"
            : item.blockReason
              ? "卡住"
              : "停留中",
        未推进原因: item.blockPending
          ? "待定"
          : item.blockReason ?? "",
      });
    }
  }
  return rows;
}

export { STAGE_ENTITY };
