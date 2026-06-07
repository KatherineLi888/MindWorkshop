import type { ThinkingMethodDef, ThinkingMethodId } from "@/lib/thinking/methods";
import type { AddQuestionMeta } from "@/lib/thinking/prompt-draft";
import {
  dualQuestionPlaceholderHints,
  multilinePlaceholderHints,
  patternToPlaceholderHint,
} from "@/lib/thinking/question-placeholder";

export type AddQuestionFn = (
  parentId: string,
  methodId: ThinkingMethodId,
  draft: string,
  meta?: AddQuestionMeta
) => void;

/** 选择方法后创建空问题节点，占位提示由 placeholderHint 提供 */
export function applyMethodPick(
  parentId: string,
  methodId: ThinkingMethodId,
  method: ThinkingMethodDef,
  onAdd: AddQuestionFn
) {
  if (method.inputKind === "dual") {
    dualQuestionPlaceholderHints().forEach((hint, i) => {
      onAdd(parentId, methodId, "", {
        skipFocus: i > 0,
        placeholderHint: hint,
      });
    });
    return;
  }

  if (method.inputKind === "multiline") {
    multilinePlaceholderHints(method).forEach((hint, i) => {
      onAdd(parentId, methodId, "", {
        skipFocus: i > 0,
        placeholderHint: hint,
      });
    });
    return;
  }

  onAdd(parentId, methodId, "", {
    placeholderHint: patternToPlaceholderHint(method.promptPattern),
  });
}
