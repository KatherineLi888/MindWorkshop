import { loadAllInboxItems } from "@/lib/inbox/storage";
import {
  countStrictJump,
  loadFlowEntries,
  loadFlowJumps,
} from "./pipeline-storage";
import {
  FLOW_STAGE_LABELS,
  FLOW_STAGE_HREFS,
  FLOW_STAGE_ORDER,
  flowEntityKey,
  type FlowStage,
  type FullFunnelAnalytics,
  type FunnelDeepAnalytics,
  type JumpEntryInsight,
  type JumpMatrixData,
  type LinearFunnelStep,
  type StageLeakStat,
  type TrackLoopbackData,
} from "./types";

/** 主漏斗：严格链路（不含收集箱暂存） */
const MAIN_FUNNEL_STAGES: FlowStage[] = [
  "thinking",
  "decisions",
  "goals",
  "track",
];

/** 跳入矩阵横轴（不含收集箱） */
const MATRIX_ENTRY_COLUMNS: FlowStage[] = [
  "thinking",
  "decisions",
  "goals",
];

const MATRIX_ROWS: FlowStage[] = [
  "thinking",
  "decisions",
  "goals",
  "track",
];

function traceReachedStages(
  entityType: string,
  entityId: string
): Set<FlowStage> {
  const reached = new Set<FlowStage>();
  const visited = new Set<string>();
  const queue: { type: string; id: string }[] = [
    { type: entityType, id: entityId },
  ];

  const entry = loadFlowEntries().find(
    (e) => e.entityType === entityType && e.entityId === entityId
  );
  if (entry) reached.add(entry.entryStage);

  while (queue.length > 0) {
    const { type, id } = queue.shift()!;
    const key = flowEntityKey(type, id);
    if (visited.has(key)) continue;
    visited.add(key);

    for (const j of loadFlowJumps()) {
      if (j.fromEntityType === type && j.fromEntityId === id) {
        reached.add(j.toStage);
        queue.push({ type: j.toEntityType, id: j.toEntityId });
      }
    }
  }

  return reached;
}

const TRACK_LOOPBACK_TARGETS: FlowStage[] = ["thinking", "decisions", "goals"];

function buildTrackLoopback(): TrackLoopbackData {
  const trackJumps = loadFlowJumps().filter((j) => j.fromStage === "track");
  const trackTotal = loadFlowEntries().filter((e) => e.entryStage === "track")
    .length;
  const loopbackTotal = new Set(
    trackJumps.map((j) => `${j.fromEntityId}:${j.toStage}`)
  ).size;

  const steps = TRACK_LOOPBACK_TARGETS.map((stage) => {
    const ids = new Set(
      trackJumps.filter((j) => j.toStage === stage).map((j) => j.fromEntityId)
    );
    const count = ids.size;
    return {
      toStage: stage,
      label: FLOW_STAGE_LABELS[stage],
      count,
      rate: trackTotal > 0 ? Math.round((count / trackTotal) * 100) : 0,
    };
  });

  return { trackTotal, loopbackTotal, steps };
}

function buildJumpMatrix(): JumpMatrixData {
  const entries = loadFlowEntries().filter((e) => e.entryStage !== "inbox");
  const columns = MATRIX_ENTRY_COLUMNS.map((stage) => ({
    stage,
    label: `从${FLOW_STAGE_LABELS[stage]}跳入`,
  }));
  const rows = MATRIX_ROWS.map((stage) => ({
    stage,
    label: FLOW_STAGE_LABELS[stage],
  }));

  const cells: number[][] = rows.map(() => columns.map(() => 0));

  for (const entry of entries) {
    const colIdx = columns.findIndex((c) => c.stage === entry.entryStage);
    if (colIdx < 0) continue;
    const reached = traceReachedStages(entry.entityType, entry.entityId);
    rows.forEach((row, rowIdx) => {
      if (stageIndex(row.stage) < stageIndex(entry.entryStage)) return;
      if (reached.has(row.stage)) {
        cells[rowIdx][colIdx]++;
      }
    });
  }

  const columnTotals = columns.map((_, colIdx) =>
    entries.filter((e) => e.entryStage === columns[colIdx].stage).length
  );

  const columnFunnels = columns.map((_, colIdx) => {
    const total = columnTotals[colIdx];
    return rows.map((row, rowIdx) => {
      const count = cells[rowIdx][colIdx];
      return {
        stage: row.stage,
        label: row.label,
        count,
        rate: total > 0 ? Math.round((count / total) * 100) : 0,
      };
    });
  });

  return { columns, rows, cells, columnTotals, columnFunnels };
}

function buildEntryInsights(matrix: JumpMatrixData): JumpEntryInsight[] {
  return matrix.columns
    .map((col, colIdx) => {
      const funnel = matrix.columnFunnels[colIdx];
      const total = matrix.columnTotals[colIdx];
      let biggestLeak: JumpEntryInsight["biggestLeak"] = null;

      for (let i = 0; i < funnel.length - 1; i++) {
        const from = funnel[i];
        const to = funnel[i + 1];
        if (stageIndex(to.stage) <= stageIndex(from.stage)) continue;
        const drop = from.count - to.count;
        if (drop <= 0) continue;
        const dropRate =
          from.count > 0 ? Math.round((drop / from.count) * 100) : 0;
        if (
          !biggestLeak ||
          drop > biggestLeak.drop ||
          (drop === biggestLeak.drop && dropRate > biggestLeak.dropRate)
        ) {
          biggestLeak = {
            fromLabel: from.label,
            toLabel: to.label,
            drop,
            dropRate,
          };
        }
      }

      return {
        entryStage: col.stage,
        label: col.label,
        total,
        biggestLeak,
      };
    })
    .filter((x) => x.total > 0)
    .sort((a, b) => b.total - a.total);
}

function stageIndex(stage: FlowStage): number {
  return FLOW_STAGE_ORDER.indexOf(stage);
}

function buildStageLeaks(linear: LinearFunnelStep[]): StageLeakStat[] {
  const leaks: StageLeakStat[] = [];
  for (let i = 0; i < linear.length - 1; i++) {
    const from = linear[i];
    const to = linear[i + 1];
    const entered = from.count;
    const progressed = to.count;
    const dropped = Math.max(0, entered - progressed);
    const lossRate =
      entered > 0 ? Math.round((dropped / entered) * 100) : 0;
    const retainRate =
      entered > 0 ? Math.round((progressed / entered) * 100) : 0;
    leaks.push({
      fromStage: from.stage,
      toStage: to.stage,
      fromLabel: from.label,
      toLabel: to.label,
      entered,
      progressed,
      dropped,
      lossRate,
      retainRate,
    });
  }
  return leaks;
}

function buildDeepAnalytics(
  linear: LinearFunnelStep[],
  matrix: JumpMatrixData
): FunnelDeepAnalytics {
  const stageLeaks = buildStageLeaks(linear);

  const worstLeak =
    stageLeaks.length === 0
      ? null
      : [...stageLeaks].sort((a, b) => {
          if (b.lossRate !== a.lossRate) return b.lossRate - a.lossRate;
          return b.dropped - a.dropped;
        })[0];

  const strengthenAt = worstLeak
    ? {
        stage: worstLeak.fromStage,
        label: worstLeak.fromLabel,
        href: FLOW_STAGE_HREFS[worstLeak.fromStage],
        hint: `向「${worstLeak.toLabel}」推进时流失 ${worstLeak.lossRate}%（${worstLeak.dropped} 条），建议加强此环节`,
      }
    : null;

  const allEntries = matrix.columns.map((col, colIdx) => ({
    stage: col.stage,
    label: col.label,
    total: matrix.columnTotals[colIdx],
  }));

  const used = allEntries.filter((e) => e.total > 0);
  const mostUsedEntry =
    used.length > 0
      ? [...used].sort((a, b) => b.total - a.total)[0]
      : null;
  const leastUsedEntry =
    allEntries.length > 0
      ? [...allEntries].sort((a, b) => a.total - b.total)[0]
      : null;

  return {
    stageLeaks,
    worstLeak,
    strengthenAt,
    mostUsedEntry,
    leastUsedEntry,
  };
}

async function countInboxPending(): Promise<number> {
  const items = await loadAllInboxItems();
  const jumpedIds = new Set(
    loadFlowJumps()
      .filter((j) => j.fromStage === "inbox")
      .map((j) => j.fromEntityId)
  );
  return items.filter(
    (i) => i.source === "inbox" && !jumpedIds.has(i.id)
  ).length;
}

export async function buildFullFunnelAnalytics(): Promise<FullFunnelAnalytics> {
  const inboxPending = await countInboxPending();

  const strictCounts: Record<FlowStage, number> = {
    inbox: inboxPending,
    thinking: countStrictJump("thinking"),
    decisions: countStrictJump("decisions"),
    goals: countStrictJump("goals"),
    track: countStrictJump("track"),
  };

  const linear: LinearFunnelStep[] = MAIN_FUNNEL_STAGES.map((stage, idx) => {
    const count = strictCounts[stage];
    const nextStage = MAIN_FUNNEL_STAGES[idx + 1];
    const leakToNext = nextStage ? strictCounts[nextStage] : 0;
    return {
      stage,
      label: FLOW_STAGE_LABELS[stage],
      href: FLOW_STAGE_HREFS[stage],
      count,
      leakToNext,
      leakRate: count > 0 ? Math.round((leakToNext / count) * 100) : 0,
      dropAtStage: Math.max(0, count - leakToNext),
      stuck: 0,
    };
  });

  const jumpMatrix = buildJumpMatrix();
  const trackLoopback = buildTrackLoopback();
  const entryInsights = buildEntryInsights(jumpMatrix);
  const topEntry = entryInsights[0] ?? null;
  const deep = buildDeepAnalytics(linear, jumpMatrix);

  return {
    inboxPending,
    linear,
    trackLoopback,
    jumpMatrix,
    topEntry,
    entryInsights,
    deep,
    jumpIn: [],
    snapshot: { stages: [], updatedAt: new Date().toISOString() },
    updatedAt: new Date().toISOString(),
  };
}

export function fullFunnelToExportRows(data: FullFunnelAnalytics) {
  const rows: Record<string, string | number>[] = [];

  rows.push({
    模块: "收集箱",
    阶段: "待处理",
    存量: data.inboxPending,
    下漏: "",
    下漏率: "",
  });

  for (const step of data.linear) {
    rows.push({
      模块: "主漏斗",
      阶段: step.label,
      存量: step.count,
      下漏: step.leakToNext,
      下漏率: `${step.leakRate}%`,
    });
  }

  for (const leak of data.deep.stageLeaks) {
    rows.push({
      模块: "数据分析",
      阶段: `${leak.fromLabel}→${leak.toLabel}`,
      存量: leak.entered,
      下漏: leak.dropped,
      下漏率: `流失${leak.lossRate}% / 留存${leak.retainRate}%`,
    });
  }

  if (data.deep.worstLeak) {
    rows.push({
      模块: "数据分析",
      阶段: "漏损最严重",
      存量: data.deep.worstLeak.fromLabel,
      下漏: data.deep.worstLeak.dropped,
      下漏率: `${data.deep.worstLeak.lossRate}%`,
    });
  }

  if (data.deep.mostUsedEntry) {
    rows.push({
      模块: "数据分析",
      阶段: "最常用入口",
      存量: data.deep.mostUsedEntry.total,
      下漏: data.deep.mostUsedEntry.label,
      下漏率: "",
    });
  }

  if (data.deep.leastUsedEntry) {
    rows.push({
      模块: "数据分析",
      阶段: "最少用入口",
      存量: data.deep.leastUsedEntry.total,
      下漏: data.deep.leastUsedEntry.label,
      下漏率: "",
    });
  }

  for (const step of data.trackLoopback.steps) {
    rows.push({
      模块: "追踪回转",
      阶段: `追踪→${step.label}`,
      存量: data.trackLoopback.trackTotal,
      下漏: step.count,
      下漏率: `${step.rate}%`,
    });
  }

  const { jumpMatrix } = data;
  jumpMatrix.columns.forEach((col, colIdx) => {
    jumpMatrix.rows.forEach((row, rowIdx) => {
      rows.push({
        模块: "跳入矩阵",
        入口: col.label,
        到达阶段: row.label,
        数量: jumpMatrix.cells[rowIdx][colIdx],
        入口总量: jumpMatrix.columnTotals[colIdx],
      });
    });
  });

  return rows;
}
