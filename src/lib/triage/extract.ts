/** 从杂乱线性文字中提取主要担心点 */
export function extractWorryPoints(raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  const byLine = trimmed
    .split(/\n+/)
    .map((s) => s.replace(/^[\s\-•*\d.)、]+/, "").trim())
    .filter((s) => s.length >= 2);

  if (byLine.length > 1) {
    return [...new Set(byLine)].slice(0, 8);
  }

  const byClause = trimmed
    .split(/[；;。！!？?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 4);

  if (byClause.length > 1) {
    return [...new Set(byClause)].slice(0, 6);
  }

  return [trimmed.length > 80 ? `${trimmed.slice(0, 80)}…` : trimmed];
}

/** 建议用一句话概括主题 */
export function suggestSummary(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  const firstLine = trimmed.split(/\n/)[0]?.trim() || trimmed;
  const firstSentence =
    firstLine.split(/[。！!？?；;]/)[0]?.trim() || firstLine;

  if (firstSentence.length <= 56) return firstSentence;
  return `${firstSentence.slice(0, 56)}…`;
}
