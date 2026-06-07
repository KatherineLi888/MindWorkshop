import type { StoredTheory, TheoryEvidence, TheoryStep } from "./types";

export function theoryUid(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

export function createTheoryStep(content = ""): TheoryStep {
  return { id: theoryUid("step"), content };
}

export function createTheoryEvidence(
  partial?: Partial<Pick<TheoryEvidence, "scenario" | "outcome" | "note">>
): TheoryEvidence {
  return {
    id: theoryUid("ev"),
    scenario: partial?.scenario ?? "",
    outcome: partial?.outcome ?? "note",
    note: partial?.note ?? "",
    createdAt: new Date().toISOString(),
  };
}

export function createStoredTheory(
  partial: Pick<StoredTheory, "title" | "statement"> &
    Partial<
      Pick<
        StoredTheory,
        | "source"
        | "intent"
        | "status"
        | "applicableWhen"
        | "counterWhen"
        | "steps"
        | "tags"
      >
    >
): StoredTheory {
  const now = new Date().toISOString();
  return {
    id: `theory-${crypto.randomUUID()}`,
    title: partial.title,
    statement: partial.statement,
    source: partial.source ?? "",
    intent: partial.intent ?? "observe",
    status: partial.status ?? "captured",
    applicableWhen: partial.applicableWhen ?? "",
    counterWhen: partial.counterWhen ?? "",
    steps: partial.steps ?? [],
    evidence: [],
    tags: partial.tags ?? [],
    createdAt: now,
    updatedAt: now,
  };
}

export function theoryDisplayTitle(t: StoredTheory): string {
  return t.title.trim() || t.statement.trim().slice(0, 48) || "未命名理论";
}
