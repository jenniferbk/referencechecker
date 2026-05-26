import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildFakeApa, makeFake } from './fake.js';

test('buildFakeApa produces a structured citation with a fake DOI', () => {
  const f = buildFakeApa(3);
  assert.match(f.reference, /\(20\d\d\)\./);
  assert.match(f.reference, /https:\/\/doi\.org\/10\.9999\//);
  assert.equal(f.reference.includes(f.doi), true);
});

test('makeFake accepts a DOI that 404s (does not exist)', async () => {
  const f = await makeFake(1, async () => false); // checker says "not found"
  assert.match(f.doi, /^10\.9999\//);
});

test('makeFake rejects when every candidate DOI resolves', async () => {
  await assert.rejects(() => makeFake(1, async () => true), /confirmed-fake/);
});
