/** 简易 Excel 公式：=A1+B1、=SUM(A1:A5)、=AVG(B1:B3) 等 */

function colIndex(col: string): number {
  let n = 0;
  for (const ch of col.toUpperCase()) {
    n = n * 26 + (ch.charCodeAt(0) - 64);
  }
  return n - 1;
}

function parseRef(ref: string): [number, number] | null {
  const m = /^([A-Za-z]+)(\d+)$/.exec(ref.trim());
  if (!m) return null;
  return [Number(m[2]) - 1, colIndex(m[1])];
}

function cellRaw(cells: string[][], r: number, c: number): string {
  return cells[r]?.[c] ?? "";
}

function cellDisplay(
  cells: string[][],
  r: number,
  c: number,
  visiting = new Set<string>()
): string {
  const key = `${r},${c}`;
  if (visiting.has(key)) return "#CIRC!";
  visiting.add(key);

  const raw = cellRaw(cells, r, c).trim();
  if (!raw.startsWith("=")) {
    visiting.delete(key);
    return raw;
  }

  try {
    const result = evalExpr(raw.slice(1), cells, visiting);
    visiting.delete(key);
    return result;
  } catch {
    visiting.delete(key);
    return "#ERR!";
  }
}

function numVal(cells: string[][], ref: string, visiting: Set<string>): number {
  const pos = parseRef(ref);
  if (!pos) throw new Error("bad ref");
  const [r, c] = pos;
  const v = cellDisplay(cells, r, c, visiting);
  const n = Number(v);
  if (Number.isNaN(n)) throw new Error("nan");
  return n;
}

function evalRange(
  cells: string[][],
  a: string,
  b: string,
  visiting: Set<string>,
  fn: (nums: number[]) => number
): number {
  const p1 = parseRef(a);
  const p2 = parseRef(b);
  if (!p1 || !p2) throw new Error("bad range");
  const [r1, c1] = p1;
  const [r2, c2] = p2;
  const nums: number[] = [];
  for (let r = Math.min(r1, r2); r <= Math.max(r1, r2); r++) {
    for (let c = Math.min(c1, c2); c <= Math.max(c1, c2); c++) {
      const v = cellDisplay(cells, r, c, visiting);
      const n = Number(v);
      if (!Number.isNaN(n)) nums.push(n);
    }
  }
  return fn(nums);
}

function evalExpr(expr: string, cells: string[][], visiting: Set<string>): string {
  const e = expr.trim();

  const fnMatch = /^(\w+)\(([^)]+)\)$/i.exec(e);
  if (fnMatch) {
    const fn = fnMatch[1].toUpperCase();
    const arg = fnMatch[2].trim();
    const range = arg.split(":").map((s) => s.trim());
    if (range.length === 2) {
      const ops: Record<string, (n: number[]) => number> = {
        SUM: (n) => n.reduce((a, b) => a + b, 0),
        AVG: (n) => (n.length ? n.reduce((a, b) => a + b, 0) / n.length : 0),
        MIN: (n) => (n.length ? Math.min(...n) : 0),
        MAX: (n) => (n.length ? Math.max(...n) : 0),
        COUNT: (n) => n.length,
      };
      if (ops[fn]) {
        const val = evalRange(cells, range[0], range[1], visiting, ops[fn]);
        return String(Math.round(val * 10000) / 10000);
      }
    }
  }

  let replaced = e.replace(/([A-Za-z]+\d+)/g, (ref) => {
    return String(numVal(cells, ref, visiting));
  });

  if (!/^[\d\s+\-*/().]+$/.test(replaced)) throw new Error("unsafe");
  // eslint-disable-next-line no-new-func
  const val = Function(`"use strict"; return (${replaced});`)() as number;
  if (typeof val !== "number" || Number.isNaN(val)) throw new Error("nan");
  return String(Math.round(val * 10000) / 10000);
}

export function getCellDisplay(cells: string[][], r: number, c: number): string {
  return cellDisplay(cells, r, c);
}

export function colName(c: number): string {
  return String.fromCharCode(65 + c);
}
