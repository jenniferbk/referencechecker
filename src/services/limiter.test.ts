import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLimiter } from './limiter.js';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

test('limiter never runs more than maxConcurrent tasks at once', async () => {
  const limiter = createLimiter({ maxConcurrent: () => 3, minGapMs: () => 0 });
  let running = 0;
  let peak = 0;
  const task = async () => {
    running++;
    peak = Math.max(peak, running);
    await sleep(20);
    running--;
  };
  await Promise.all(Array.from({ length: 10 }, () => limiter.run(task)));
  assert.equal(peak, 3);
  assert.equal(limiter.active(), 0);
});

test('limiter runs tasks in parallel, not one after another', async () => {
  const limiter = createLimiter({ maxConcurrent: () => 5, minGapMs: () => 0 });
  const started = Date.now();
  await Promise.all(Array.from({ length: 5 }, () => limiter.run(() => sleep(50))));
  assert.ok(Date.now() - started < 150, 'five 50ms tasks should overlap');
});

test('limiter spaces task starts by minGapMs', async () => {
  const limiter = createLimiter({ maxConcurrent: () => 10, minGapMs: () => 30 });
  const starts: number[] = [];
  await Promise.all(Array.from({ length: 3 }, () => limiter.run(async () => { starts.push(Date.now()); })));
  assert.ok(starts[1] - starts[0] >= 25);
  assert.ok(starts[2] - starts[1] >= 25);
});

test('limiter releases its slot when a task throws', async () => {
  const limiter = createLimiter({ maxConcurrent: () => 1, minGapMs: () => 0 });
  await assert.rejects(limiter.run(async () => { throw new Error('boom'); }), /boom/);
  assert.equal(await limiter.run(async () => 'ok'), 'ok');
});

test('limiter returns each task its own result', async () => {
  const limiter = createLimiter({ maxConcurrent: () => 2, minGapMs: () => 0 });
  const out = await Promise.all([1, 2, 3, 4].map(n => limiter.run(async () => { await sleep(5 * (5 - n)); return n * 10; })));
  assert.deepEqual(out, [10, 20, 30, 40]);
});
