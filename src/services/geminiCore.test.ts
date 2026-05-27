import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPrompt, parseVerificationResponse,
  isQuotaError, isRetryableError, isRecitationError,
  runVerification, VERIFICATION_SCHEMA,
} from './geminiCore.js';

test('buildPrompt embeds the reference and APA instruction', () => {
  const p = buildPrompt('Smith, J. (2020). Title. *Journal*, 1(2), 3.');
  assert.match(p, /APA 7th Edition Reference Checker/);
  assert.match(p, /Smith, J\. \(2020\)/);
});

test('parseVerificationResponse handles clean JSON', () => {
  const r = parseVerificationResponse('{"status":"verified","corrected":"X","notes":"ok"}', 'ref');
  assert.equal(r.status, 'verified');
  assert.equal(r.corrected, 'X');
  assert.equal(r.original, 'ref');
});

test('parseVerificationResponse strips markdown fences', () => {
  const r = parseVerificationResponse('```json\n{"status":"corrected"}\n```', 'ref');
  assert.equal(r.status, 'corrected');
});

test('parseVerificationResponse throws on an empty response', () => {
  assert.throws(() => parseVerificationResponse('', 'ref'), /PARSE_ERROR/);
  assert.throws(() => parseVerificationResponse('   ', 'ref'), /PARSE_ERROR/);
});

test('parseVerificationResponse throws on invalid JSON', () => {
  assert.throws(() => parseVerificationResponse('not json', 'ref'), /PARSE_ERROR/);
});

test('error classifiers', () => {
  assert.equal(isQuotaError({ message: 'got 429 RESOURCE_EXHAUSTED' }), true);
  assert.equal(isRecitationError({ message: 'RECITATION blocked' }), true);
  assert.equal(isRetryableError({ message: 'fetch failed' }), true);
  assert.equal(isRetryableError({ message: 'RECITATION' }), false);
  assert.equal(isRetryableError({ message: 'totally fatal' }), false);
  assert.equal(isRetryableError({ message: 'PARSE_ERROR: invalid JSON' }), true);
});

test('runVerification returns result, latency, usage on success', async () => {
  process.env.GEMINI_MIN_DELAY_MS = '0';
  const run = await runVerification({
    apiKey: 'k', model: 'm', reference: 'ref',
    generate: async () => ({ text: '{"status":"verified","notes":"ok"}', usage: { promptTokens: 10, candidatesTokens: 5, totalTokens: 15 } }),
  });
  assert.equal(run.result.status, 'verified');
  assert.equal(run.usage?.totalTokens, 15);
  assert.ok(run.latencyMs >= 0);
});

test('runVerification returns unknown without retry on RECITATION', async () => {
  process.env.GEMINI_MIN_DELAY_MS = '0';
  let calls = 0;
  const run = await runVerification({
    apiKey: 'k', model: 'm', reference: 'ref',
    generate: async () => { calls++; throw new Error('RECITATION'); },
  });
  assert.equal(run.result.status, 'unknown');
  assert.equal(calls, 1);
});

test('runVerification retries a transient error then succeeds', async () => {
  process.env.GEMINI_MIN_DELAY_MS = '0';
  process.env.GEMINI_BACKOFF_MS = '1';
  let calls = 0;
  const run = await runVerification({
    apiKey: 'k', model: 'm', reference: 'ref',
    generate: async () => { calls++; if (calls === 1) throw new Error('fetch failed'); return { text: '{"status":"verified"}' }; },
  });
  assert.equal(run.result.status, 'verified');
  assert.equal(calls, 2);
});

test('runVerification returns quota message after exhausting retries', async () => {
  process.env.GEMINI_MIN_DELAY_MS = '0';
  process.env.GEMINI_BACKOFF_MS = '1';
  const run = await runVerification({
    apiKey: 'k', model: 'm', reference: 'ref',
    generate: async () => { throw new Error('429 quota'); },
  });
  assert.equal(run.result.status, 'unknown');
  assert.match(run.result.notes || '', /quota exhausted/);
});

test('runVerification returns permission-denied message for 403', async () => {
  process.env.GEMINI_MIN_DELAY_MS = '0';
  process.env.GEMINI_BACKOFF_MS = '1';
  const run = await runVerification({
    apiKey: 'k', model: 'm', reference: 'ref',
    generate: async () => { throw new Error('403 PERMISSION_DENIED'); },
  });
  assert.equal(run.result.status, 'unknown');
  assert.match(run.result.notes || '', /permission denied/i);
});

test('VERIFICATION_SCHEMA constrains status to the three real verdicts', () => {
  const props: any = (VERIFICATION_SCHEMA as any).properties;
  assert.deepEqual(props.status.enum, ['verified', 'corrected', 'hallucinated']);
  assert.equal(props.status.format, 'enum');
  assert.deepEqual((VERIFICATION_SCHEMA as any).required, ['status', 'notes']);
});

test('runVerification retries a parse failure then succeeds', async () => {
  process.env.GEMINI_MIN_DELAY_MS = '0';
  process.env.GEMINI_BACKOFF_MS = '1';
  let calls = 0;
  const run = await runVerification({
    apiKey: 'k', model: 'm', reference: 'ref',
    generate: async () => { calls++; if (calls === 1) return { text: 'garbage not json' }; return { text: '{"status":"verified"}' }; },
  });
  assert.equal(run.result.status, 'verified');
  assert.equal(calls, 2);
});

test('runVerification retries an empty response then succeeds', async () => {
  process.env.GEMINI_MIN_DELAY_MS = '0';
  process.env.GEMINI_BACKOFF_MS = '1';
  let calls = 0;
  const run = await runVerification({
    apiKey: 'k', model: 'm', reference: 'ref',
    generate: async () => { calls++; if (calls === 1) return { text: '' }; return { text: '{"status":"verified"}' }; },
  });
  assert.equal(run.result.status, 'verified');
  assert.equal(calls, 2);
});

test('runVerification returns unknown and logs gemini_parse_error after exhausting parse retries', async () => {
  process.env.GEMINI_MIN_DELAY_MS = '0';
  process.env.GEMINI_BACKOFF_MS = '1';
  let logged = '';
  const run = await runVerification({
    apiKey: 'k', model: 'm', reference: 'ref',
    logError: (e) => { logged = e.errorType; },
    generate: async () => ({ text: 'still not json' }),
  });
  assert.equal(run.result.status, 'unknown');
  assert.match(run.result.notes || '', /unreadable/i);
  assert.equal(logged, 'gemini_parse_error');
});
