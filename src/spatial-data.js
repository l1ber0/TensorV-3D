export const VOLUME_EDGE = 12;

export function spatialMode(shape) {
  if (shape.length === 1 && shape[0] === 3) return 'vectors';
  if (shape.length === 2 && (shape[1] === 3 || shape[0] === 3)) return 'vectors';
  return shape.length >= 3 ? 'volume' : null;
}

export function realValue(value) {
  if (typeof value === 'boolean') return Number(value);
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

// Fetch bounded windows through the existing snapshot API. Coordinates retain
// their original tensor indices, including non-contiguous views and batches.
export async function spatialData(tensor, mode, starts, request) {
  if (!tensor.available) throw new Error(tensor.warning || '张量数值不可用。');
  const shape = tensor.shape, rank = shape.length;
  if (shape.some(size => size === 0)) return { items: [], skipped: 0, description: '空张量' };
  const indices = shape.map((size, axis) => Math.max(0, Math.min(size - 1, Math.trunc(starts[axis] || 0))));
  const items = [];
  let skipped = 0;
  if (mode === 'vectors') {
    if (spatialMode(shape) !== 'vectors') throw new Error('向量需要形状 [3]、[N, 3] 或 [3, N]；其他形状可先 reshape。');
    const single = rank === 1;
    const component = single ? 0 : shape[1] === 3 ? 1 : 0;
    const batch = single ? null : 1 - component;
    const slice = await request('slice', { id: tensor.id, row_axis: batch, col_axis: component,
      indices: Array(rank).fill(0), row_start: batch === null ? 0 : indices[batch], col_start: 0 });
    slice.values.forEach((row, i) => {
      const vector = row.map(realValue);
      if (vector.length === 3 && vector.every(v => v !== null)) items.push({ vector, index: single ? null : indices[batch] + i });
      else skipped++;
    });
    return { items, skipped, description: single ? '[x, y, z]' : `每${component === 1 ? '行' : '列'}一个向量 · 当前 ${items.length} / ${shape[batch]} 个（每页最多 24）` };
  }
  if (rank < 3) throw new Error('立体张量需要至少 3 个维度。');
  const depthAxis = rank - 3, rowAxis = rank - 2, colAxis = rank - 1;
  const end = Math.min(shape[depthAxis], indices[depthAxis] + VOLUME_EDGE);
  // Sequential requests respect the VS Code bridge queue and snapshot lifetime.
  for (let depth = indices[depthAxis]; depth < end; depth++) {
    const fixed = [...indices]; fixed[depthAxis] = depth;
    const slice = await request('slice', { id: tensor.id, row_axis: rowAxis, col_axis: colAxis,
      indices: fixed, row_start: indices[rowAxis], col_start: indices[colAxis] });
    slice.values.slice(0, VOLUME_EDGE).forEach((row, i) => row.slice(0, VOLUME_EDGE).forEach((value, j) => {
      const number = realValue(value);
      const coord = slice.coords[i][j];
      if (number === null) skipped++;
      else items.push({ value: number, coord, position: [coord[colAxis] - indices[colAxis], coord[rowAxis] - indices[rowAxis], depth - indices[depthAxis]] });
    }));
  }
  return { items, skipped, description: `X = d${colAxis} · Y = d${rowAxis} · Z = d${depthAxis} · 窗口最多 12 × 12 × 12（起点可调整）` };
}
