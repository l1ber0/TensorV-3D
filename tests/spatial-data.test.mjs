import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spatialMode, spatialData } from '../src/spatial-data.js';

test('distinguishes vectors, tensor volumes, and unsupported shapes', () => {
  assert.equal(spatialMode([3]), 'vectors');
  assert.equal(spatialMode([40, 3]), 'vectors');
  assert.equal(spatialMode([3, 40]), 'vectors');
  assert.equal(spatialMode([4, 5, 6]), 'volume');
  assert.equal(spatialMode([2, 4, 5, 6]), 'volume');
  assert.equal(spatialMode([2]), null);
});

test('column vectors use the correct axes and skip nonfinite/complex values', async () => {
  const t = { available: true, id: 't', shape: [3, 30] };
  const data = await spatialData(t, 'vectors', [0, 24], async (_, payload) => {
    assert.equal(payload.row_axis, 1); assert.equal(payload.col_axis, 0); assert.equal(payload.row_start, 24);
    return { values: [[1, 2, 3], [0, 'NaN', 2], [1, '(1+2j)', 3], [0, 0, 0]] };
  });
  assert.deepEqual(data.items, [{ vector: [1, 2, 3], index: 24 }, { vector: [0, 0, 0], index: 27 }]);
  assert.equal(data.skipped, 2);
});

test('volume windows preserve batch and logical coordinates and remain bounded', async () => {
  const calls = [];
  const t = { available: true, id: 't', shape: [2, 30, 30, 30] };
  const data = await spatialData(t, 'volume', [1, 15, 14, 13], async (_, p) => {
    calls.push(p);
    return { values: Array.from({ length: 16 }, (_, i) => Array.from({ length: 17 }, (_, j) => i * 30 + j)),
      coords: Array.from({ length: 16 }, (_, i) => Array.from({ length: 17 }, (_, j) => [p.indices[0], p.indices[1], p.row_start + i, p.col_start + j])) };
  });
  assert.equal(calls.length, 12); assert.equal(data.items.length, 1728);
  assert.deepEqual(data.items[0], { value: 0, coord: [1, 15, 14, 13], position: [0, 0, 0] });
  assert.deepEqual(data.items.at(-1).coord, [1, 26, 25, 24]);
  assert.ok(calls.every(p => p.row_axis === 2 && p.col_axis === 3));
});

test('empty and unavailable tensors avoid slice requests', async () => {
  const request = () => { throw new Error('unexpected request'); };
  assert.deepEqual((await spatialData({ available: true, shape: [0, 3, 3] }, 'volume', [], request)).items, []);
  await assert.rejects(spatialData({ available: false, warning: 'too large', shape: [3] }, 'vectors', [], request), /too large/);
});
