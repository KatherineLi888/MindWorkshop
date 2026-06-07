"use client";

import { MarkdownWordEditor } from "./markdown";
import type { WordData } from "./types";

type Props = {
  data: WordData;
  onChange: (data: WordData) => void;
};

export function PaneWord({ data, onChange }: Props) {
  return (
    <MarkdownWordEditor
      value={data.markdown}
      onChange={(markdown) => onChange({ markdown })}
      placeholder="开始写作… 支持 # 标题、**粗体**、- 列表、> 引用"
    />
  );
}
