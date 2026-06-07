const ANCHOR_TOKEN = "{anchor}";

export type AddQuestionMeta = {
  selectStart?: number;
  selectEnd?: number;
  skipFocus?: boolean;
};

export type QuestionEditFocus = {
  nodeId: string;
  selectStart: number;
  selectEnd: number;
};

export type EditablePromptDraft = {
  text: string;
  selectStart: number;
  selectEnd: number;
};

/** 由方法模板生成草稿，{anchor} 处留空并返回应聚焦选中的区间 */
export function buildEditablePromptDraft(pattern: string): EditablePromptDraft {
  const idx = pattern.indexOf(ANCHOR_TOKEN);
  if (idx < 0) {
    const end = pattern.length;
    return { text: pattern, selectStart: end, selectEnd: end };
  }

  const before = pattern.slice(0, idx);
  const after = pattern.slice(idx + ANCHOR_TOKEN.length);
  const wrapped =
    before.endsWith("「") && after.startsWith("」");

  if (wrapped) {
    const text = before + after;
    const pos = before.length;
    return { text, selectStart: pos, selectEnd: pos };
  }

  const text = `${before}「」${after}`;
  const pos = before.length + 1;
  return { text, selectStart: pos, selectEnd: pos };
}

export function dualQuestionDrafts(): [EditablePromptDraft, EditablePromptDraft] {
  return [
    buildEditablePromptDraft("利：选择「{anchor}」的好处？"),
    buildEditablePromptDraft("弊：选择「{anchor}」的代价？"),
  ];
}

export function multilineQuestionLines(method: {
  multilineDefault?: string;
  promptPattern: string;
}): string[] {
  const raw =
    method.multilineDefault?.trim() ||
    buildEditablePromptDraft(method.promptPattern).text;
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}
