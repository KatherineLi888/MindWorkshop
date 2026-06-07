import type { DecisionRow } from "@/types/database";

export type DecisionNoteEntry = {
  id: string;
  content: string;
  created_at: string;
  show_in_display: boolean;
};

export function getDecisionNotes(row: DecisionRow): DecisionNoteEntry[] {
  const raw = (row as DecisionRow & { decision_notes?: DecisionNoteEntry[] })
    .decision_notes;
  if (!Array.isArray(raw)) return [];
  return raw.filter((n) => n?.id && n.content);
}

export function notesForDisplay(row: DecisionRow): DecisionNoteEntry[] {
  return getDecisionNotes(row)
    .filter((n) => n.show_in_display)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
}
