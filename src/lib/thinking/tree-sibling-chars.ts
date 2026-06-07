/** 同级分支数量越多，单节点可用字数越少，避免一行挤满 */
export function maxCharsForBranchCount(
  siblingCount: number,
  baseMax = 30
): number {
  const n = Math.max(1, siblingCount);
  if (n === 1) return Math.min(42, Math.round(baseMax * 1.35));
  if (n === 2) return Math.min(32, Math.round(baseMax * 0.88));
  if (n === 3) return Math.min(24, Math.round(baseMax * 0.72));
  return Math.min(20, Math.round(baseMax * 0.55));
}
