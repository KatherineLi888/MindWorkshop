import { loadAllDecisions } from "@/lib/decisions/storage";
import { loadAllGoals } from "@/lib/goals/storage";
import { loadThoughtSessions } from "@/lib/thinking/storage";
import { loadLocal, LOCAL_KEYS } from "@/lib/local-store";
import type { SeedLifeEvent } from "./types";

export type EntityContentBlock = {
  heading: string;
  lines: string[];
};

function clip(text: string, max = 400): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

export async function loadEntityBirthContent(
  event: SeedLifeEvent
): Promise<string> {
  const blocks = await loadEntityFullContent(event);
  if (!blocks.length) return event.label?.trim() || "—";
  return blocks
    .flatMap((b) => b.lines)
    .filter(Boolean)
    .slice(0, 3)
    .join("\n");
}

export async function loadEntityFullContent(
  event: SeedLifeEvent
): Promise<EntityContentBlock[]> {
  const { entityType, entityId } = event;

  if (entityType === "thinking_session") {
    const session = loadThoughtSessions().find((s) => s.id === entityId);
    if (!session) return [];
    const qa: string[] = [];
    for (const node of session.nodes) {
      if (!node.content?.trim()) continue;
      const kind =
        node.type === "topic"
          ? "主题"
          : node.type === "question"
            ? "问"
            : "答";
      qa.push(`${kind}：${clip(node.content, 200)}`);
    }
    return [{ heading: "思考记录", lines: qa.length ? qa : [session.title] }];
  }

  if (entityType === "decision") {
    const decisions = await loadAllDecisions();
    const d = decisions.find((x) => x.id === entityId);
    if (!d) return [];
    const lines = [d.title];
    if (d.background?.trim()) lines.push(`背景：${clip(d.background)}`);
    if (d.manual_conclusion?.trim())
      lines.push(`结论：${clip(d.manual_conclusion)}`);
    return [{ heading: "决策内容", lines }];
  }

  if (entityType === "goal") {
    const goals = await loadAllGoals();
    const g = goals.find((x) => x.id === entityId);
    if (!g) return [];
    const lines = [g.title];
    const s = g.smart_current?.specific?.trim();
    if (s) lines.push(`具体：${clip(s)}`);
    return [{ heading: "目标内容", lines }];
  }

  if (entityType === "theory") {
    const theories = loadLocal<{ id: string; title: string; summary?: string }[]>(
      LOCAL_KEYS.theories,
      []
    );
    const t = theories.find((x) => x.id === entityId);
    if (!t) return [];
    return [
      {
        heading: "理论",
        lines: [t.title, t.summary ? clip(t.summary) : ""].filter(Boolean),
      },
    ];
  }

  if (event.summary?.trim()) {
    return [{ heading: "记录", lines: [event.summary.trim()] }];
  }

  return event.label?.trim()
    ? [{ heading: "记录", lines: [event.label.trim()] }]
    : [];
}
