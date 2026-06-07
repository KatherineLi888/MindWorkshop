import type { ThinkingMethodDef, ThinkingMethodId } from "@/lib/thinking/methods";
import {
  buildEditablePromptDraft,
  dualQuestionDrafts,
  multilineQuestionLines,
  type AddQuestionMeta,
} from "@/lib/thinking/prompt-draft";

export type AddQuestionFn = (
  parentId: string,
  methodId: ThinkingMethodId,
  draft: string,
  meta?: AddQuestionMeta
) => void;

/** 选择方法后立即生成问题草稿并提交 */
export function applyMethodPick(
  parentId: string,
  methodId: ThinkingMethodId,
  method: ThinkingMethodDef,
  onAdd: AddQuestionFn
) {
  if (method.inputKind === "dual") {
    const [a, b] = dualQuestionDrafts();
    onAdd(parentId, methodId, a.text, {
      selectStart: a.selectStart,
      selectEnd: a.selectEnd,
    });
    onAdd(parentId, methodId, b.text, { skipFocus: true });
    return;
  }

  if (method.inputKind === "multiline") {
    const lines = multilineQuestionLines(method);
    lines.forEach((line, i) => {
      onAdd(
        parentId,
        methodId,
        line,
        i === 0
          ? { selectStart: 0, selectEnd: line.length }
          : { skipFocus: true }
      );
    });
    return;
  }

  const { text, selectStart, selectEnd } = buildEditablePromptDraft(
    method.promptPattern
  );
  onAdd(parentId, methodId, text, { selectStart, selectEnd });
}
