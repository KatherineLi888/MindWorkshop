"use client";

import { useMemo, useState } from "react";

/** 轻量 Markdown 预览 */
export function MarkdownPreview({ source, className = "" }: { source: string; className?: string }) {
  const html = useMemo(() => markdownToHtml(source), [source]);
  if (!source.trim()) {
    return <p className={`text-sm text-slate-400 ${className}`}>（空）</p>;
  }
  return (
    <div
      className={`markdown-preview prose-sm max-w-none text-sm leading-relaxed text-slate-700 ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

type TextareaProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

/** 纯 Markdown 输入框（无分屏/预览，适合小区域） */
export function MarkdownTextarea({
  value,
  onChange,
  placeholder = "支持 Markdown：# 标题、**粗体**、- 列表",
  className = "",
}: TextareaProps) {
  return (
    <textarea
      className={`h-full min-h-[4rem] w-full resize-none border-0 bg-transparent p-2 text-sm leading-relaxed text-slate-800 outline-none placeholder:text-slate-400 ${className}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      spellCheck={false}
    />
  );
}

type WordEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

/** Word 全栏编辑：编辑 / 预览切换（不做分屏） */
export function MarkdownWordEditor({
  value,
  onChange,
  placeholder = "开始写作…",
}: WordEditorProps) {
  const [preview, setPreview] = useState(false);

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="flex shrink-0 items-center gap-2 border-b border-[#E2E8F0] px-3 py-1.5">
        <span className="text-[10px] text-slate-400">Markdown</span>
        <button
          type="button"
          onClick={() => setPreview((v) => !v)}
          className="rounded border border-[#E2E8F0] bg-white px-2 py-0.5 text-[10px] text-slate-600 hover:bg-slate-50"
        >
          {preview ? "返回编辑" : "预览渲染"}
        </button>
      </div>
      {preview ? (
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <MarkdownPreview source={value} />
        </div>
      ) : (
        <textarea
          className="min-h-0 flex-1 w-full resize-none border-0 p-4 text-sm leading-relaxed text-slate-800 outline-none placeholder:text-slate-400"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          spellCheck={false}
        />
      )}
    </div>
  );
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isTableRow(line: string): boolean {
  const t = line.trim();
  return t.startsWith("|") && t.endsWith("|") && t.length > 2;
}

function isTableSeparator(line: string): boolean {
  const t = line.trim();
  return /^\|?[\s|:-]+\|?$/.test(t) && t.includes("-");
}

function parseTableCells(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());
}

function renderTable(headerLine: string, bodyLines: string[]): string {
  const headers = parseTableCells(headerLine);
  const colCount = headers.length;
  const rows = bodyLines.map(parseTableCells);

  const th = headers
    .map(
      (h) =>
        `<th class="border border-slate-200 bg-slate-50 px-2 py-1.5 font-medium text-slate-700">${inlineFormat(escapeHtml(h))}</th>`
    )
    .join("");

  const trs = rows
    .map((row) => {
      const cells = Array.from({ length: colCount }, (_, i) => row[i] ?? "");
      return `<tr>${cells
        .map(
          (c) =>
            `<td class="border border-slate-200 px-2 py-1.5 text-slate-600">${inlineFormat(escapeHtml(c))}</td>`
        )
        .join("")}</tr>`;
    })
    .join("");

  return `<div class="my-2 -mx-1 overflow-x-auto"><table class="w-full min-w-[12rem] border-collapse text-left text-[inherit]"><thead><tr>${th}</tr></thead><tbody>${trs}</tbody></table></div>`;
}

function markdownToHtml(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let inCode = false;
  let codeBuf: string[] = [];
  let listType: "ul" | "ol" | null = null;

  const flushList = () => {
    if (listType) {
      out.push(listType === "ul" ? "</ul>" : "</ol>");
      listType = null;
    }
  };

  for (let li = 0; li < lines.length; li++) {
    const line = lines[li]!;

    if (
      isTableRow(line) &&
      li + 1 < lines.length &&
      isTableSeparator(lines[li + 1]!)
    ) {
      flushList();
      const header = line;
      const body: string[] = [];
      li += 2;
      while (li < lines.length && isTableRow(lines[li]!) && !isTableSeparator(lines[li]!)) {
        body.push(lines[li]!);
        li++;
      }
      li--;
      out.push(renderTable(header, body));
      continue;
    }
    if (line.trimStart().startsWith("```")) {
      flushList();
      if (!inCode) {
        inCode = true;
        codeBuf = [];
      } else {
        inCode = false;
        out.push(
          `<pre class="my-2 overflow-x-auto rounded bg-slate-100 p-2 text-xs"><code>${escapeHtml(codeBuf.join("\n"))}</code></pre>`
        );
      }
      continue;
    }

    if (inCode) {
      codeBuf.push(line);
      continue;
    }

    if (/^---+$|^\*\*\*+$/.test(line.trim())) {
      flushList();
      out.push('<hr class="my-3 border-[#E2E8F0]" />');
      continue;
    }

    const h = line.match(/^(#{1,6})\s+(.+)$/);
    if (h) {
      flushList();
      const level = h[1].length;
      out.push(
        `<h${level} class="font-semibold text-slate-800 mt-3 mb-1">${inlineFormat(escapeHtml(h[2]))}</h${level}>`
      );
      continue;
    }

    const bq = line.match(/^>\s+(.+)$/);
    if (bq) {
      flushList();
      out.push(
        `<blockquote class="border-l-2 border-slate-300 pl-3 my-1 text-slate-600">${inlineFormat(escapeHtml(bq[1]))}</blockquote>`
      );
      continue;
    }

    const ul = line.match(/^[-*+]\s+(.+)$/);
    if (ul) {
      if (listType !== "ul") {
        flushList();
        listType = "ul";
        out.push('<ul class="list-disc pl-5 my-1 space-y-0.5">');
      }
      out.push(`<li>${inlineFormat(escapeHtml(ul[1]))}</li>`);
      continue;
    }

    const ol = line.match(/^\d+\.\s+(.+)$/);
    if (ol) {
      if (listType !== "ol") {
        flushList();
        listType = "ol";
        out.push('<ol class="list-decimal pl-5 my-1 space-y-0.5">');
      }
      out.push(`<li>${inlineFormat(escapeHtml(ol[1]))}</li>`);
      continue;
    }

    flushList();

    if (!line.trim()) {
      continue;
    }

    out.push(`<p class="my-1.5">${inlineFormat(escapeHtml(line))}</p>`);
  }

  flushList();
  if (inCode && codeBuf.length) {
    out.push(
      `<pre class="my-2 overflow-x-auto rounded bg-slate-100 p-2 text-xs"><code>${escapeHtml(codeBuf.join("\n"))}</code></pre>`
    );
  }

  return out.join("") || "<p class='text-slate-400'>（空）</p>";
}

function inlineFormat(s: string): string {
  return s
    .replace(/`([^`]+)`/g, '<code class="rounded bg-slate-100 px-1 text-xs">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/_([^_]+)_/g, "<em>$1</em>")
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" class="text-blue-600 underline" target="_blank" rel="noopener noreferrer">$1</a>'
    );
}

export function stripHtmlToMarkdown(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
