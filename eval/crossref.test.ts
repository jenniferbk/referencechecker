import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { fetchSample, doiExists } from './crossref.js';

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

test('fetchSample returns message.items', async () => {
  globalThis.fetch = (async () => ({
    ok: true, status: 200,
    json: async () => ({ message: { items: [{ DOI: '10.1/x', title: ['T'] }] } }),
  })) as any;
  const items = await fetchSample(1);
  assert.equal(items.length, 1);
  assert.equal(items[0].DOI, '10.1/x');
});

test('fetchSample throws on non-ok response', async () => {
  globalThis.fetch = (async () => ({ ok: false, status: 500, json: async () => ({}) })) as any;
  await assert.rejects(() => fetchSample(1), /CrossRef 500/);
});

test('doiExists is true for 200 and false for 404', async () => {
  globalThis.fetch = (async () => ({ ok: true, status: 200 })) as any;
  assert.equal(await doiExists('10.1/real'), true);
  globalThis.fetch = (async () => ({ ok: false, status: 404 })) as any;
  assert.equal(await doiExists('10.9999/fake'), false);
});
