# JSON Reliability Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cut `unknown`-from-bad-JSON results in `verifyReference` by constraining model output with a `responseSchema` and retrying the stochastic parse/empty failures.

**Architecture:** All changes are in `src/services/geminiCore.ts` and its test. `gemini.ts` (the production wrapper) is untouched and benefits automatically. The model call gains a `responseSchema`; `parseVerificationResponse` switches from swallowing bad JSON to throwing, so the existing retry loop in `runVerification` re-asks before giving up.

**Tech Stack:** TypeScript (ESM), `@google/generative-ai` 0.24.1, Node 25 built-in test runner via `tsx`. Run a test file with `node --import tsx --test "<path>"`; run all tests with `npm test`.

**Spec:** `docs/superpowers/specs/2026-05-26-json-reliability-design.md`
**Branch:** `json-reliability` (already checked out — commit here).

---

## Context for the implementer

The current `src/services/geminiCore.ts` (read it first) exports `runVerification`,
`parseVerificationResponse`, `buildPrompt`, the error classifiers, and types. The
production wrapper `verifyReference` in `gemini.ts` calls `runVerification` and is NOT
modified by this plan. The eval harness in `eval/` also calls `runVerification`.

Key current behavior being changed:
- `defaultGenerate` (geminiCore.ts) sets `generationConfig: { responseMimeType: 'application/json' }`.
- `parseVerificationResponse(text, reference, logError?)` swallows invalid JSON into a
  `status: 'unknown'` result and logs `gemini_parse_error` itself (no retry).
- `runVerification` calls `parseVerificationResponse(out.text, reference, logError)` inside
  its retry loop; parse failures therefore never retry.

There are existing tests in `src/services/geminiCore.test.ts` — some change in Task 2.

---

## Task 1: Constrain output with `responseSchema`

**Files:**
- Modify: `src/services/geminiCore.ts`
- Modify: `src/services/geminiCore.test.ts`

- [ ] **Step 1: Write the failing test for the schema constant**

Add this import line at the top of `src/services/geminiCore.test.ts` (merge into the
existing import from `./geminiCore.js`):

```ts
import { VERIFICATION_SCHEMA } from './geminiCore.js';
```

Add this test:

```ts
test('VERIFICATION_SCHEMA constrains status to the three real verdicts', () => {
  const props: any = (VERIFICATION_SCHEMA as any).properties;
  assert.deepEqual(props.status.enum, ['verified', 'corrected', 'hallucinated']);
  assert.equal(props.status.format, 'enum');
  assert.deepEqual((VERIFICATION_SCHEMA as any).required, ['status', 'notes']);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --import tsx --test "src/services/geminiCore.test.ts"`
Expected: FAIL — `VERIFICATION_SCHEMA` is not exported (import error / undefined).

- [ ] **Step 3: Add the schema and apply it**

In `src/services/geminiCore.ts`, change the import on line 1 from:

```ts
import { GoogleGenerativeAI } from '@google/generative-ai';
```
to:
```ts
import { GoogleGenerativeAI, SchemaType, type ResponseSchema } from '@google/generative-ai';
```

Add this exported constant immediately after the `LogFn` type (right before
`const MAX_RETRIES = 3;`):

```ts
// Constrains the model to emit schema-valid JSON. 'unknown' is intentionally NOT a
// permitted status — it is the harness's internal marker for an unparseable/failed call,
// never a verdict the model should produce.
export const VERIFICATION_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    status: { type: SchemaType.STRING, format: 'enum', enum: ['verified', 'corrected', 'hallucinated'] },
    corrected: { type: SchemaType.STRING },
    notes: { type: SchemaType.STRING },
  },
  required: ['status', 'notes'],
};
```

In `defaultGenerate`, change the `generationConfig` line from:

```ts
    generationConfig: { responseMimeType: 'application/json' },
```
to:
```ts
    generationConfig: { responseMimeType: 'application/json', responseSchema: VERIFICATION_SCHEMA },
```

Leave `tools: [{ googleSearch: {} }]` unchanged.

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --import tsx --test "src/services/geminiCore.test.ts"`
Expected: PASS (the new schema test passes; all previously-passing tests still pass).

- [ ] **Step 5: Type-check the production build**

Run: `npm run build`
Expected: exit 0, no type errors. (Confirms the `responseSchema`/`SchemaType` types are used
correctly for SDK 0.24.1.)

- [ ] **Step 6: Commit**

```bash
git add src/services/geminiCore.ts src/services/geminiCore.test.ts
git commit -m "Constrain verification output with a responseSchema"
```

---

## Task 2: Retry on parse-failure / empty response

**Files:**
- Modify: `src/services/geminiCore.ts`
- Modify: `src/services/geminiCore.test.ts`

This task changes `parseVerificationResponse` to **throw** on empty/invalid JSON, makes
`PARSE_ERROR` retryable, and adds a parse-failure branch to the final-failure handler so the
existing retry loop re-asks before returning `unknown`.

- [ ] **Step 1: Update the parse tests to the new throwing contract**

In `src/services/geminiCore.test.ts`, DELETE this existing test:

```ts
test('parseVerificationResponse falls back to unknown and logs on bad JSON', () => {
  let logged = '';
  const r = parseVerificationResponse('not json', 'ref', (e) => { logged = e.errorType; });
  assert.equal(r.status, 'unknown');
  assert.equal(logged, 'gemini_parse_error');
});
```

Replace it with:

```ts
test('parseVerificationResponse throws on an empty response', () => {
  assert.throws(() => parseVerificationResponse('', 'ref'), /PARSE_ERROR/);
  assert.throws(() => parseVerificationResponse('   ', 'ref'), /PARSE_ERROR/);
});

test('parseVerificationResponse throws on invalid JSON', () => {
  assert.throws(() => parseVerificationResponse('not json', 'ref'), /PARSE_ERROR/);
});
```

In the existing `'error classifiers'` test, add this assertion (parse errors are retryable):

```ts
  assert.equal(isRetryableError({ message: 'PARSE_ERROR: invalid JSON' }), true);
```

Add these three `runVerification` tests:

```ts
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
```

- [ ] **Step 2: Run the tests to verify the new ones fail**

Run: `node --import tsx --test "src/services/geminiCore.test.ts"`
Expected: FAIL — the parse-throws tests fail (current code returns `unknown` instead of
throwing), and the retry/exhaustion tests fail (current code does not retry parse failures
and has no "unreadable" message).

- [ ] **Step 3: Rewrite `parseVerificationResponse` to throw**

In `src/services/geminiCore.ts`, replace the entire `parseVerificationResponse` function
(currently lines ~110–125, the version taking a `logError?` param) with:

```ts
export function parseVerificationResponse(text: string, reference: string): VerificationResult {
  const jsonString = (text || '').replace(/```json/g, '').replace(/```/g, '').trim();
  if (!jsonString) throw new Error('PARSE_ERROR: empty response');
  let data: any;
  try {
    data = JSON.parse(jsonString);
  } catch {
    throw new Error('PARSE_ERROR: invalid JSON');
  }
  return { original: reference, status: data.status || 'unknown', corrected: data.corrected, notes: data.notes };
}
```

- [ ] **Step 4: Make `PARSE_ERROR` retryable**

Replace the `isRetryableError` function with (adds the `PARSE_ERROR` check at the front of
the message tests):

```ts
export function isRetryableError(error: any): boolean {
  if (isQuotaError(error)) return true;
  if (isRecitationError(error)) return false;
  const msg = error?.message || '';
  return msg.includes('PARSE_ERROR') || msg.includes('fetch failed') || msg.includes('ECONNRESET')
    || msg.includes('ETIMEDOUT') || msg.includes('socket hang up') || msg.includes('503')
    || msg.includes('UNAVAILABLE');
}
```

- [ ] **Step 5: Wire the retry + parse-failure final branch into `runVerification`**

Replace the entire `runVerification` function with this version. Changes vs current:
captures `lastRawText`; calls `parseVerificationResponse` with two args (no `logError`);
the `console.warn` labels parse retries; the final handler adds a `parseFailed` branch
(checked before `networkFailed`, since `isRetryableError` now treats `PARSE_ERROR` as
retryable) that logs `gemini_parse_error` with the raw text and returns an "unreadable"
message.

```ts
export async function runVerification(opts: {
  apiKey: string; model: string; reference: string; logError?: LogFn; generate?: GenerateFn;
}): Promise<RunResult> {
  const { apiKey, model, reference, logError } = opts;
  const generate = opts.generate || defaultGenerate;
  await acquireSlot();
  const prompt = buildPrompt(reference);
  const started = Date.now();
  let lastError: any;
  let lastRawText = '';

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const out = await generate({ apiKey, model, prompt });
      lastRawText = out.text;
      const result = parseVerificationResponse(out.text, reference);
      return { result, latencyMs: Date.now() - started, usage: out.usage };
    } catch (error: any) {
      lastError = error;
      if (isRecitationError(error)) {
        return {
          result: { original: reference, status: 'unknown', notes: 'This reference could not be verified because the AI flagged it as protected content. Please verify it manually.' },
          latencyMs: Date.now() - started,
        };
      }
      if (isRetryableError(error) && attempt < MAX_RETRIES) {
        const backoff = initialBackoffMs() * Math.pow(2, attempt);
        const kind = isQuotaError(error) ? 'quota' : (error?.message || '').includes('PARSE_ERROR') ? 'parse' : 'network';
        console.warn(`Gemini error (${kind}), retrying in ${backoff}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
        await sleep(backoff);
        continue;
      }
      break;
    }
  }

  const quotaFailed = isQuotaError(lastError);
  const parseFailed = (lastError?.message || '').includes('PARSE_ERROR');
  const networkFailed = !quotaFailed && !parseFailed && isRetryableError(lastError);
  logError?.({
    endpoint: 'gemini/verifyReference',
    errorType: quotaFailed ? 'gemini_quota' : parseFailed ? 'gemini_parse_error' : networkFailed ? 'gemini_network' : 'gemini_error',
    message: lastError?.message || 'Unknown Gemini error',
    details: { reference: reference.substring(0, 100), retries: MAX_RETRIES, ...(parseFailed ? { rawText: lastRawText.substring(0, 500) } : {}) },
  });

  let errorMessage = 'Error connecting to Gemini.';
  if (quotaFailed) errorMessage = 'Gemini API quota exhausted. Please try again later.';
  else if (parseFailed) errorMessage = 'The AI returned an unreadable response after multiple attempts. Please try again.';
  else if (networkFailed) errorMessage = 'Could not reach Gemini API after multiple attempts. Please try again.';
  else if (lastError?.message?.includes('403') || lastError?.message?.includes('PERMISSION_DENIED')) errorMessage = 'Gemini API permission denied.';
  else if (lastError?.message?.includes('404') || lastError?.message?.includes('NOT_FOUND')) errorMessage = 'Gemini model not found.';
  else errorMessage += ` Details: ${lastError?.message || JSON.stringify(lastError)}`;

  return { result: { original: reference, status: 'unknown', notes: errorMessage }, latencyMs: Date.now() - started };
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `node --import tsx --test "src/services/geminiCore.test.ts"`
Expected: PASS — all tests, including the new parse-throw, retry-then-succeed (parse and
empty), and exhaustion tests.

- [ ] **Step 7: Run the full suite and build**

Run: `npm test`
Expected: full suite passes (the eval tests also import `runVerification`/`parseVerificationResponse`; confirm none broke).
Run: `npm run build`
Expected: exit 0.

- [ ] **Step 8: Commit**

```bash
git add src/services/geminiCore.ts src/services/geminiCore.test.ts
git commit -m "Retry parse-failure/empty responses before returning unknown"
```

---

## Task 3: Verify with an eval rerun (PAID — requires human go-ahead)

**Files:** none (runs the existing harness; report artifacts are gitignored).

This task spends real Gemini API money (~$0.30–0.60, ~16 min). Do NOT run it without
explicit human confirmation in the conversation. It is the empirical check that the
`responseSchema` reduced `unknown` results AND did not break Google Search grounding.

- [ ] **Step 1: Confirm the committed 60-item answer key is present**

Run: `python3 -c "import json; d=json.load(open('eval/testset.json')); print(len(d), 'items')"`
Expected: `60 items`. (If not 60, restore with `git checkout eval/testset.json`.)

- [ ] **Step 2: Run the eval (only after human go-ahead)**

Run: `npm run eval`
Expected: completes in ~16 min, prints the comparison table, writes `eval/report.md` and a
`eval/results-*.json`.

- [ ] **Step 3: Compare against the baseline**

Baseline (`docs/superpowers/results/2026-05-26-model-ab-eval-results.md`): 3.1-pro 1
`unknown`, 3.5-flash 4 `unknown`; both `hallucinated` ~100%.

Check in the new run:
- **Success:** `unknown` count dropped (target: 3.5-flash → 0–1, 3.1-pro → 0).
- **Guardrail:** `hallucinated` accuracy stayed ~100% for both models. If it dropped
  materially, `responseSchema` likely disrupted grounding — proceed to Step 4.

Report the new table and the before/after `unknown` and `hallucinated` numbers.

- [ ] **Step 4: Rollback ONLY if grounding regressed**

If and only if the `hallucinated` bucket regressed materially, remove the `responseSchema`
from `defaultGenerate` (revert the one-line `generationConfig` change from Task 1, keeping
`VERIFICATION_SCHEMA` exported and the Task 2 retry intact), then:

```bash
git add src/services/geminiCore.ts
git commit -m "Revert responseSchema: regressed Google Search grounding (keep parse retry)"
```
Document the observed regression in the commit body. The parse-retry from Task 2 still
provides a reliability improvement on its own.

- [ ] **Step 5: Save the rerun results snapshot**

```bash
cp eval/report.md docs/superpowers/results/2026-05-26-model-ab-eval-results-post-jsonfix.md
git add docs/superpowers/results/2026-05-26-model-ab-eval-results-post-jsonfix.md
git commit -m "Save post-JSON-fix eval results snapshot"
```

---

## Self-review notes (author check, not a task)

- **Spec coverage:** responseSchema constant + applied in defaultGenerate (Task 1) ✓;
  `status` enum excludes `unknown`, `corrected` optional, `notes` required (Task 1 schema) ✓;
  parseVerificationResponse throws on empty/invalid (Task 2 Step 3) ✓; PARSE_ERROR retryable
  (Task 2 Step 4) ✓; retry reuses MAX_RETRIES/backoff, final handler logs gemini_parse_error
  with rawText and returns clear message (Task 2 Step 5) ✓; behavior preservation —
  verifyReference unchanged, RECITATION/quota/network/403/404 paths intact (Task 2 Step 5
  keeps those branches; full suite in Step 7) ✓; tests for parse-throw, retries, exhaustion,
  schema shape (Tasks 1–2) ✓; eval-rerun verification with success criterion + guardrail +
  rollback (Task 3) ✓.
- **Placeholder scan:** none — every code/test step has complete content.
- **Type consistency:** `VERIFICATION_SCHEMA`, `ResponseSchema`, `SchemaType`,
  `parseVerificationResponse(text, reference)` (2-arg), `isRetryableError`, `runVerification`,
  `PARSE_ERROR` sentinel, `lastRawText`, `parseFailed` are used consistently across tasks.
  Note `parseVerificationResponse` drops its former `logError?` third argument; the existing
  "handles clean JSON" and "strips markdown fences" tests already call it with 2 args, so
  they remain valid.
