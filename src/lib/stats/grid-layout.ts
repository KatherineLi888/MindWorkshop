import {
  ALL_WIDGET_SIZES,
  SIZE_PREVIEW_SPAN,
  type WidgetInstance,
  type WidgetSize,
} from "./dashboard-config";

export const GRID_COLS = 4;

export type GridAnchor = { row: number; col: number };

export function sizeToSpan(size: WidgetSize): {
  colSpan: number;
  rowSpan: number;
} {
  const p = SIZE_PREVIEW_SPAN[size];
  return { colSpan: p.col, rowSpan: p.row };
}

function ensureRow(occ: boolean[][], row: number) {
  while (occ.length <= row) occ.push(Array(GRID_COLS).fill(false));
}

function markOccupied(
  occ: boolean[][],
  inst: Pick<WidgetInstance, "row" | "col" | "size">
) {
  const { colSpan, rowSpan } = sizeToSpan(inst.size);
  for (let r = inst.row; r < inst.row + rowSpan; r++) {
    ensureRow(occ, r);
    for (let c = inst.col; c < inst.col + colSpan; c++) {
      if (c < GRID_COLS) occ[r][c] = true;
    }
  }
}

export function buildOccupancy(
  instances: WidgetInstance[],
  excludeId?: string
): boolean[][] {
  const occ: boolean[][] = [];
  for (const inst of instances) {
    if (excludeId && inst.instanceId === excludeId) continue;
    if (inst.row == null || inst.col == null) continue;
    markOccupied(occ, inst);
  }
  return occ;
}

export function canPlaceAt(
  occ: boolean[][],
  row: number,
  col: number,
  size: WidgetSize
): boolean {
  const { colSpan, rowSpan } = sizeToSpan(size);
  if (col + colSpan > GRID_COLS) return false;
  for (let r = row; r < row + rowSpan; r++) {
    ensureRow(occ, r);
    for (let c = col; c < col + colSpan; c++) {
      if (occ[r][c]) return false;
    }
  }
  return true;
}

export function findFirstFit(
  occ: boolean[][],
  size: WidgetSize,
  startRow = 0
): GridAnchor {
  const { colSpan } = sizeToSpan(size);
  for (let row = startRow; row < startRow + 48; row++) {
    for (let col = 0; col <= GRID_COLS - colSpan; col++) {
      if (canPlaceAt(occ, row, col, size)) return { row, col };
    }
  }
  return { row: startRow, col: 0 };
}

export function autoPlaceInstances(
  instances: WidgetInstance[]
): WidgetInstance[] {
  const occ: boolean[][] = [];
  const result: WidgetInstance[] = [];

  for (const inst of instances) {
    if (
      typeof inst.row === "number" &&
      typeof inst.col === "number" &&
      canPlaceAt(occ, inst.row, inst.col, inst.size)
    ) {
      result.push(inst);
      markOccupied(occ, inst);
      continue;
    }
    const pos = findFirstFit(occ, inst.size);
    const placed = { ...inst, row: pos.row, col: pos.col };
    result.push(placed);
    markOccupied(occ, placed);
  }
  return result;
}

/** 删除后收起整行空行，下方组件自动上移 */
export function compactEmptyRows(
  instances: WidgetInstance[]
): WidgetInstance[] {
  if (!instances.length) return [];
  let placed = [...instances];
  for (let guard = 0; guard < 64; guard++) {
    const maxRow = maxOccupiedRow(placed);
    const occ = buildOccupancy(placed);
    let emptyRow = -1;
    for (let r = 0; r < maxRow; r++) {
      ensureRow(occ, r);
      if (!occ[r].some(Boolean)) {
        emptyRow = r;
        break;
      }
    }
    if (emptyRow < 0) break;
    placed = placed.map((inst) => ({
      ...inst,
      row: inst.row > emptyRow ? inst.row - 1 : inst.row,
    }));
  }
  return placed;
}

export function availableSizesAt(
  occ: boolean[][],
  anchor: GridAnchor
): WidgetSize[] {
  return ALL_WIDGET_SIZES.filter((s) =>
    canPlaceAt(occ, anchor.row, anchor.col, s)
  );
}

export function maxOccupiedRow(instances: WidgetInstance[]): number {
  let max = 0;
  for (const inst of instances) {
    if (inst.row == null) continue;
    const { rowSpan } = sizeToSpan(inst.size);
    max = Math.max(max, inst.row + rowSpan);
  }
  return max;
}

export type GridRenderCell =
  | { kind: "slot"; row: number; col: number }
  | { kind: "widget"; instance: WidgetInstance };

export function buildGridCells(
  instances: WidgetInstance[],
  editing: boolean,
  extraEmptyRows = 2
): GridRenderCell[] {
  const placed = compactEmptyRows(autoPlaceInstances(instances));
  const occ = buildOccupancy(placed);
  const cells: GridRenderCell[] = placed.map((instance) => ({
    kind: "widget",
    instance,
  }));

  if (!editing) return cells;

  const totalRows = Math.max(maxOccupiedRow(placed) + extraEmptyRows, 2);
  for (let row = 0; row < totalRows; row++) {
    ensureRow(occ, row);
    for (let col = 0; col < GRID_COLS; col++) {
      if (!occ[row][col]) {
        cells.push({ kind: "slot", row, col });
      }
    }
  }
  return cells;
}

export function moveWidgetTo(
  instances: WidgetInstance[],
  instanceId: string,
  anchor: GridAnchor
): WidgetInstance[] | null {
  const target = instances.find((i) => i.instanceId === instanceId);
  if (!target) return null;
  const occ = buildOccupancy(instances, instanceId);
  if (!canPlaceAt(occ, anchor.row, anchor.col, target.size)) return null;
  return compactEmptyRows(
    instances.map((i) =>
      i.instanceId === instanceId
        ? { ...i, row: anchor.row, col: anchor.col }
        : i
    )
  );
}

export function insertInstanceAt(
  instances: WidgetInstance[],
  instance: WidgetInstance,
  anchor: GridAnchor
): WidgetInstance[] | null {
  const occ = buildOccupancy(instances);
  if (!canPlaceAt(occ, anchor.row, anchor.col, instance.size)) return null;
  return compactEmptyRows([
    ...instances,
    { ...instance, row: anchor.row, col: anchor.col },
  ]);
}

export function gridItemStyle(
  row: number,
  col: number,
  size: WidgetSize
): { gridColumn: string; gridRow: string } {
  const { colSpan, rowSpan } = sizeToSpan(size);
  return {
    gridColumn: `${col + 1} / span ${colSpan}`,
    gridRow: `${row + 1} / span ${rowSpan}`,
  };
}
