# Model A/B Accuracy Eval — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an offline harness that grades Gemini models (`gemini-3.1-pro-preview` vs `gemini-3.5-flash`) on reference-verification accuracy against a CrossRef-built answer key.

**Architecture:** Extract the production Gemini call into a model-parameterized, dependency-injected `geminiCore.ts` (production behavior unchanged). A standalone `eval/` toolchain builds a 60-item answer key from CrossRef, runs each model through the real verification code path, grades verdicts against truth, and writes a report. The harness never touches Supabase, credits, or the `/verify-reference` endpoint.

**Tech Stack:** TypeScript (ESM), `tsx` (already a devDependency), Node 25 built-in test runner (`node:test` + `node:assert`), `@google/generative-ai`, CrossRef REST API via global `fetch`.

---

## Conventions for this plan

- **Test command:** `node --import tsx --test "<glob>"` (verified working on this machine, Node 25). The `test` npm script runs all tests.
- **Imports use `.js` extensions** (project is ESM with `moduleResolution: bundler`), e.g. `import { x } from './apa.js'` even though the file is `apa.ts`.
- **Eval files run via `tsx`**, which transpiles without type-checking. Tests catch logic errors. The `src/` refactor is still type-checked by `tsc`.
- **Commit after each task.** Branch is `model-ab-eval` (already created).
- Each test file lives next to its source as `<name>.test.ts`.

---

## Shared types (referenced throughout)

These live in `eval/types.ts` (created in Task 3) and `src/services/geminiCore.ts` (Task 2). Listed here so later tasks can reference exact names:

```ts
// from src/services/geminiCore.ts
interface VerificationResult {
  original: string;
  status: 'verified' | 'corrected' | 'hallucinated' | 'unknown';
  corrected?: string;
  notes?: string;
}
interface TokenUsage { promptTokens: number; candidatesTokens: number; totalTokens: number; }
interface RunResult { result: VerificationResult; latencyMs: number; usage?: TokenUsage; }

// from eval/types.ts
type Truth = 'verified' | 'corrected' | 'hallucinated';
type BrokenField = 'year' | 'italics' | 'volume' | 'author' | 'pages';
interface TestItem {
  id: string;
  reference: string;          // citation text fed to the model
  truth: Truth;
  doi?: string;               // real DOI (verified/corrected) or fabricated 404 DOI (hallucinated)
  brokenField?: BrokenField;  // corrected items only
  correctReference?: string;  // un-corrupted APA citation (corrected items only)
}
interface ItemResult {
  itemId: string; truth: Truth; brokenField?: string;
  predictedStatus: VerificationResult['status'];
  correct: boolean; fixRestored?: boolean;
  latencyMs: number; totalTokens: number;
  reference: string; corrected?: string; notes?: string;
}
interface ModelReport {
  model: string; total: number; correctCount: number; overallAccuracy: number;
  perClass: Record<Truth, { total: number; correct: number; accuracy: number }>;
  confusion: Record<Truth, Record<VerificationResult['status'], number>>;
  falseAccusations: number; misses: number; unknownCount: number;
  correctedPredictedCount: number; fixRestoredCount: number; fixRestoredRate: number;
  avgLatencyMs: number; totalTokens: number; items: ItemResult[];
}
```

---

## Task 1: Project scripts + test runner wiring

**Files:**
- Modify: `package.json` (scripts)
- Modify: `.gitignore`
- Create: `eval/smoke.test.ts` (temporary sanity test, deleted in Step 5)

- [ ] **Step 1: Add scripts to `package.json`**

Replace the `"scripts"` block with:

```json
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "node --import tsx --test \"src/**/*.test.ts\" \"eval/**/*.test.ts\"",
    "eval:build": "tsx eval/build-testset.ts",
    "eval": "tsx eval/run.ts"
  },
```

- [ ] **Step 2: Add eval artifacts to `.gitignore`**

Append these lines (keep existing lines):

```
eval/results-*.json
eval/report.md
```

(`eval/testset.json` stays tracked.)

- [ ] **Step 3: Write a temporary smoke test**

Create `eval/smoke.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('test runner works', () => {
  assert.equal(1 + 1, 2);
});
```

- [ ] **Step 4: Run the test suite**

Run: `npm test`
Expected: PASS (1 test passing, `pass 1`, `fail 0`).

- [ ] **Step 5: Delete the smoke test and commit**

```bash
rm eval/smoke.test.ts
git add package.json .gitignore
git commit -m "Add eval scripts and Node test runner wiring"
```

---

## Task 2: Extract `geminiCore.ts` (production refactor, behavior unchanged)

**Files:**
- Create: `src/services/geminiCore.ts`
- Create: `src/services/geminiCore.test.ts`
- Modify: `src/services/gemini.ts` (becomes a thin wrapper)

This is the only task that touches production code. The verdict logic, prompt, retry behavior, and rate limiter are preserved exactly; only the model becomes a parameter, logging is injected, and token usage + latency are captured additively.

- [ ] **Step 1: Write failing tests for the pure helpers**

Create `src/services/geminiCore.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPrompt, parseVerificationResponse,
  isQuotaError, isRetryableError, isRecitationError,
  runVerification,
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

test('parseVerificationResponse falls back to unknown and logs on bad JSON', () => {
  let logged = '';
  const r = parseVerificationResponse('not json', 'ref', (e) => { logged = e.errorType; });
  assert.equal(r.status, 'unknown');
  assert.equal(logged, 'gemini_parse_error');
});

test('error classifiers', () => {
  assert.equal(isQuotaError({ message: 'got 429 RESOURCE_EXHAUSTED' }), true);
  assert.equal(isRecitationError({ message: 'RECITATION blocked' }), true);
  assert.equal(isRetryableError({ message: 'fetch failed' }), true);
  assert.equal(isRetryableError({ message: 'RECITATION' }), false);
  assert.equal(isRetryableError({ message: 'totally fatal' }), false);
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --import tsx --test "src/services/geminiCore.test.ts"`
Expected: FAIL (module `./geminiCore.js` not found).

- [ ] **Step 3: Create `src/services/geminiCore.ts`**

```ts
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface VerificationResult {
  original: string;
  status: 'verified' | 'corrected' | 'hallucinated' | 'unknown';
  corrected?: string;
  notes?: string;
}

export interface TokenUsage {
  promptTokens: number;
  candidatesTokens: number;
  totalTokens: number;
}

export interface RunResult {
  result: VerificationResult;
  latencyMs: number;
  usage?: TokenUsage;
}

export interface GenerateOutput { text: string; usage?: TokenUsage; }
export type GenerateFn = (args: { apiKey: string; model: string; prompt: string }) => Promise<GenerateOutput>;

export interface LogEntry {
  endpoint: string;
  errorType: 'gemini_parse_error' | 'gemini_quota' | 'gemini_network' | 'gemini_error';
  message: string;
  details?: Record<string, any>;
}
export type LogFn = (entry: LogEntry) => void;

const MAX_RETRIES = 3;

function minDelayMs(): number { return parseInt(process.env.GEMINI_MIN_DELAY_MS || '8000', 10); }
function initialBackoffMs(): number { return parseInt(process.env.GEMINI_BACKOFF_MS || '5000', 10); }

// Global rate limiter for Gemini API calls (shared across all calls in this process).
let lastCallTime = 0;
const pendingQueue: Array<{ resolve: () => void }> = [];
let processing = false;

async function acquireSlot(): Promise<void> {
  return new Promise<void>(resolve => { pendingQueue.push({ resolve }); processQueue(); });
}

async function processQueue(): Promise<void> {
  if (processing) return;
  processing = true;
  while (pendingQueue.length > 0) {
    const elapsed = Date.now() - lastCallTime;
    const delay = minDelayMs();
    if (elapsed < delay) await sleep(delay - elapsed);
    lastCallTime = Date.now();
    const next = pendingQueue.shift();
    if (next) next.resolve();
  }
  processing = false;
}

export function isQuotaError(error: any): boolean {
  const msg = error?.message || '';
  return msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED');
}
export function isRecitationError(error: any): boolean {
  return (error?.message || '').includes('RECITATION');
}
export function isRetryableError(error: any): boolean {
  if (isQuotaError(error)) return true;
  if (isRecitationError(error)) return false;
  const msg = error?.message || '';
  return msg.includes('fetch failed') || msg.includes('ECONNRESET') || msg.includes('ETIMEDOUT')
    || msg.includes('socket hang up') || msg.includes('503') || msg.includes('UNAVAILABLE');
}
export function sleep(ms: number): Promise<void> { return new Promise(r => setTimeout(r, ms)); }

export function buildPrompt(reference: string): string {
  return `
  You are an expert APA 7th Edition Reference Checker.
  Your goal is to verify if a given reference exists and is formatted correctly using Google Search.

  Reference to check: "${reference}"

  Instructions:
  1. Use Google Search to verify if this paper/book/source actually exists.
  2. If it does NOT exist (hallucinated), mark status as 'hallucinated'.
  3. If it DOES exist, check the APA 7th formatting.
     - If the user's input is perfect, mark status as 'verified'.
     - If there are errors (typos, punctuation, italics, missing info), mark status as 'corrected' and provide the fixed version.
  4. IMPORTANT: In the "corrected" field, use markdown formatting (*text*) for italics according to APA 7th Edition rules:
     - For journal articles: Italicize the journal title and volume number
     - For books: Italicize the book title
     - For chapters in edited books: Italicize the book title (NOT the chapter title)
     - For conference proceedings: Italicize the proceedings title

  Return ONLY a JSON object with this structure:
  {
    "status": "verified" | "corrected" | "hallucinated",
    "corrected": "The definitive APA 7th citation with *markdown italics* for proper formatting (if verified or corrected)",
    "notes": "Brief explanation of what was found or fixed."
  }
  `;
}

export function parseVerificationResponse(text: string, reference: string, logError?: LogFn): VerificationResult {
  let data: any;
  try {
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
    data = JSON.parse(jsonString);
  } catch {
    logError?.({
      endpoint: 'gemini/verifyReference',
      errorType: 'gemini_parse_error',
      message: 'Failed to parse Gemini JSON response',
      details: { reference: reference.substring(0, 100), rawText: text.substring(0, 500) },
    });
    data = { status: 'unknown', corrected: '', notes: `Raw Response: ${text}` };
  }
  return { original: reference, status: data.status || 'unknown', corrected: data.corrected, notes: data.notes };
}

const defaultGenerate: GenerateFn = async ({ apiKey, model, prompt }) => {
  const genAI = new GoogleGenerativeAI(apiKey);
  const m = genAI.getGenerativeModel({
    model,
    // @ts-ignore - googleSearch is valid but types might be missing
    tools: [{ googleSearch: {} }],
    generationConfig: { responseMimeType: 'application/json' },
  });
  const result = await m.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  const um: any = (response as any).usageMetadata;
  const usage: TokenUsage | undefined = um ? {
    promptTokens: um.promptTokenCount ?? 0,
    candidatesTokens: um.candidatesTokenCount ?? 0,
    totalTokens: um.totalTokenCount ?? 0,
  } : undefined;
  return { text, usage };
};

export async function runVerification(opts: {
  apiKey: string; model: string; reference: string; logError?: LogFn; generate?: GenerateFn;
}): Promise<RunResult> {
  const { apiKey, model, reference, logError } = opts;
  const generate = opts.generate || defaultGenerate;
  await acquireSlot();
  const prompt = buildPrompt(reference);
  const started = Date.now();
  let lastError: any;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const out = await generate({ apiKey, model, prompt });
      const result = parseVerificationResponse(out.text, reference, logError);
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
        console.warn(`Gemini error (${isQuotaError(error) ? 'quota' : 'network'}), retrying in ${backoff}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
        await sleep(backoff);
        continue;
      }
      break;
    }
  }

  const quotaFailed = isQuotaError(lastError);
  const networkFailed = !quotaFailed && isRetryableError(lastError);
  logError?.({
    endpoint: 'gemini/verifyReference',
    errorType: quotaFailed ? 'gemini_quota' : networkFailed ? 'gemini_network' : 'gemini_error',
    message: lastError?.message || 'Unknown Gemini error',
    details: { reference: reference.substring(0, 100), retries: MAX_RETRIES },
  });

  let errorMessage = 'Error connecting to Gemini.';
  if (quotaFailed) errorMessage = 'Gemini API quota exhausted. Please try again later.';
  else if (networkFailed) errorMessage = 'Could not reach Gemini API after multiple attempts. Please try again.';
  else if (lastError?.message?.includes('403') || lastError?.message?.includes('PERMISSION_DENIED')) errorMessage = 'Gemini API permission denied.';
  else if (lastError?.message?.includes('404') || lastError?.message?.includes('NOT_FOUND')) errorMessage = 'Gemini model not found.';
  else errorMessage += ` Details: ${lastError?.message || JSON.stringify(lastError)}`;

  return { result: { original: reference, status: 'unknown', notes: errorMessage }, latencyMs: Date.now() - started };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --import tsx --test "src/services/geminiCore.test.ts"`
Expected: PASS (all 8 tests).

- [ ] **Step 5: Rewrite `src/services/gemini.ts` as a thin wrapper**

Replace the **entire** file contents with:

```ts
import { config } from '../config.js';
import { runVerification, type VerificationResult } from './geminiCore.js';
import { logError as persistError } from './logger.js';

export type { VerificationResult } from './geminiCore.js';

const PRODUCTION_MODEL = 'gemini-3.1-pro-preview';

export async function verifyReference(reference: string): Promise<VerificationResult> {
  const { result } = await runVerification({
    apiKey: config.geminiApiKey,
    model: PRODUCTION_MODEL,
    reference,
    logError: (entry) => { void persistError(entry); },
  });
  return result;
}
```

- [ ] **Step 6: Type-check the production build**

Run: `npm run build`
Expected: exit 0, no type errors. (Confirms `references.ts` still type-checks against the re-exported `VerificationResult` and the wrapper.)

- [ ] **Step 7: Run the full suite and commit**

```bash
npm test
git add src/services/geminiCore.ts src/services/geminiCore.test.ts src/services/gemini.ts
git commit -m "Extract geminiCore with model param; gemini.ts becomes thin wrapper"
```
Expected: tests pass, build clean. Production `verifyReference` returns the same 4-field `VerificationResult` as before.

---

## Task 3: Eval types + APA 7th formatter

**Files:**
- Create: `eval/types.ts`
- Create: `eval/apa.ts`
- Create: `eval/apa.test.ts`

- [ ] **Step 1: Create `eval/types.ts`**

```ts
import type { VerificationResult } from '../src/services/geminiCore.js';

export type Truth = 'verified' | 'corrected' | 'hallucinated';
export type BrokenField = 'year' | 'italics' | 'volume' | 'author' | 'pages';

export interface TestItem {
  id: string;
  reference: string;
  truth: Truth;
  doi?: string;
  brokenField?: BrokenField;
  correctReference?: string;
}

export interface ItemResult {
  itemId: string;
  truth: Truth;
  brokenField?: string;
  predictedStatus: VerificationResult['status'];
  correct: boolean;
  fixRestored?: boolean;
  latencyMs: number;
  totalTokens: number;
  reference: string;
  corrected?: string;
  notes?: string;
}

export interface ModelReport {
  model: string;
  total: number;
  correctCount: number;
  overallAccuracy: number;
  perClass: Record<Truth, { total: number; correct: number; accuracy: number }>;
  confusion: Record<Truth, Record<VerificationResult['status'], number>>;
  falseAccusations: number;
  misses: number;
  unknownCount: number;
  correctedPredictedCount: number;
  fixRestoredCount: number;
  fixRestoredRate: number;
  avgLatencyMs: number;
  totalTokens: number;
  items: ItemResult[];
}
```

- [ ] **Step 2: Write failing tests for the APA formatter**

Create `eval/apa.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  initials, formatAuthors, getYear, formatPages,
  crossrefToApa, isComplete, isSentenceCaseLike, type CrossrefWork,
} from './apa.js';

test('initials reduces given names to spaced initials', () => {
  assert.equal(initials('Olga N.'), 'O. N.');
  assert.equal(initials('O.N.'), 'O. N.');
  assert.equal(initials('Jennifer'), 'J.');
});

test('formatAuthors handles 1, 2, and 3 authors', () => {
  assert.equal(formatAuthors([{ family: 'Smith', given: 'Jane' }]), 'Smith, J.');
  assert.equal(formatAuthors([{ family: 'Smith', given: 'Jane' }, { family: 'Lee', given: 'Bo' }]), 'Smith, J., & Lee, B.');
  assert.equal(
    formatAuthors([{ family: 'A', given: 'X' }, { family: 'B', given: 'Y' }, { family: 'C', given: 'Z' }]),
    'A, X., B, Y., & C, Z.'
  );
});

test('getYear reads published then issued', () => {
  assert.equal(getYear({ published: { 'date-parts': [[2021, 5]] } } as CrossrefWork), 2021);
  assert.equal(getYear({ issued: { 'date-parts': [[2019]] } } as CrossrefWork), 2019);
});

test('formatPages converts hyphen ranges to en dash', () => {
  assert.equal(formatPages('40-52'), '40–52');
  assert.equal(formatPages('40'), '40');
});

const sample: CrossrefWork = {
  DOI: '10.1000/abc',
  title: ['A study of things'],
  author: [{ family: 'Smith', given: 'Jane' }, { family: 'Lee', given: 'Bo' }],
  'container-title': ['Journal of Examples'],
  volume: '18',
  issue: '1',
  page: '40-52',
  published: { 'date-parts': [[2021, 3, 1]] },
};

test('crossrefToApa renders a journal article with markdown italics', () => {
  const out = crossrefToApa(sample);
  assert.equal(
    out,
    'Smith, J., & Lee, B. (2021). A study of things. *Journal of Examples*, *18*(1), 40–52. https://doi.org/10.1000/abc'
  );
});

test('isComplete rejects works missing required fields', () => {
  assert.equal(isComplete(sample), true);
  assert.equal(isComplete({ ...sample, volume: undefined }), false);
});

test('isSentenceCaseLike distinguishes title case from sentence case', () => {
  assert.equal(isSentenceCaseLike('A study of neural things'), true);
  assert.equal(isSentenceCaseLike('A Study Of Neural Things In The Brain'), false);
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `node --import tsx --test "eval/apa.test.ts"`
Expected: FAIL (`./apa.js` not found).

- [ ] **Step 4: Create `eval/apa.ts`**

```ts
export interface CrossrefAuthor { given?: string; family?: string; }
export interface CrossrefWork {
  DOI: string;
  title: string[];
  author?: CrossrefAuthor[];
  'container-title': string[];
  volume?: string;
  issue?: string;
  page?: string;
  published?: { 'date-parts': number[][] };
  issued?: { 'date-parts': number[][] };
}

export function initials(given: string): string {
  return given.split(/[\s.]+/).filter(Boolean).map(tok => tok[0].toUpperCase() + '.').join(' ');
}

export function formatAuthors(authors: CrossrefAuthor[]): string {
  const names = authors.filter(a => a.family).map(a => a.given ? `${a.family}, ${initials(a.given)}` : `${a.family}`);
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  if (names.length <= 20) return names.slice(0, -1).join(', ') + ', & ' + names[names.length - 1];
  return names.slice(0, 19).join(', ') + ', . . . ' + names[names.length - 1]; // APA 21+ authors
}

export function getYear(work: CrossrefWork): number | undefined {
  const dp = work.published?.['date-parts'] || work.issued?.['date-parts'];
  return dp && dp[0] && dp[0][0] ? dp[0][0] : undefined;
}

export function formatPages(page?: string): string {
  if (!page) return '';
  return page.replace(/-+/g, '–');
}

export function crossrefToApa(work: CrossrefWork): string {
  const authors = formatAuthors(work.author || []);
  const year = getYear(work);
  const title = (work.title?.[0] || '').trim().replace(/\.+$/, '');
  const journal = (work['container-title']?.[0] || '').trim();
  const pages = formatPages(work.page);
  let volPart = work.volume ? `*${work.volume}*` : '';
  if (work.volume && work.issue) volPart = `*${work.volume}*(${work.issue})`;
  const tail = `*${journal}*${volPart ? ', ' + volPart : ''}${pages ? ', ' + pages : ''}.`;
  const out = `${authors} (${year}). ${title}. ${tail} https://doi.org/${work.DOI}`;
  return out.replace(/\s+/g, ' ').trim();
}

export function isComplete(work: CrossrefWork): boolean {
  return !!(work.author?.some(a => a.family) && work.title?.[0] && work['container-title']?.[0]
    && work.volume && getYear(work) && work.DOI && work.page);
}

export function isSentenceCaseLike(title: string): boolean {
  const words = title.split(/\s+/).slice(1);
  if (words.length === 0) return true;
  const capped = words.filter(w => /^[A-Z]/.test(w)).length;
  return capped / words.length < 0.4;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `node --import tsx --test "eval/apa.test.ts"`
Expected: PASS (8 tests).

- [ ] **Step 6: Commit**

```bash
git add eval/types.ts eval/apa.ts eval/apa.test.ts
git commit -m "Add eval types and CrossRef-to-APA-7th formatter"
```

---

## Task 4: Corruption helpers (for the "corrected" bucket)

**Files:**
- Create: `eval/corrupt.ts`
- Create: `eval/corrupt.test.ts`

- [ ] **Step 1: Write failing tests**

Create `eval/corrupt.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { corruptItem, BROKEN_FIELDS } from './corrupt.js';

const apa = 'Smith, J., & Lee, B. (2021). A study of things. *Journal of Examples*, *18*(1), 40–52. https://doi.org/10.1000/abc';

test('BROKEN_FIELDS lists the five corruption types', () => {
  assert.deepEqual([...BROKEN_FIELDS].sort(), ['author', 'italics', 'pages', 'volume', 'year']);
});

test('corruptYear changes the year', () => {
  const out = corruptItem(apa, 'year');
  assert.notEqual(out, apa);
  assert.doesNotMatch(out, /\(2021\)/);
  assert.match(out, /\(20\d\d\)/);
});

test('corruptItalics removes all markdown asterisks', () => {
  const out = corruptItem(apa, 'italics');
  assert.doesNotMatch(out, /\*/);
});

test('corruptVolume changes the volume number', () => {
  const out = corruptItem(apa, 'volume');
  assert.notEqual(out, apa);
  assert.doesNotMatch(out, /\*18\*/);
});

test('corruptAuthor alters the first surname', () => {
  const out = corruptItem(apa, 'author');
  assert.notEqual(out, apa);
  assert.doesNotMatch(out, /^Smith/);
});

test('corruptPages changes the page numbers', () => {
  const out = corruptItem(apa, 'pages');
  assert.notEqual(out, apa);
  assert.doesNotMatch(out, /40–52/);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --import tsx --test "eval/corrupt.test.ts"`
Expected: FAIL (`./corrupt.js` not found).

- [ ] **Step 3: Create `eval/corrupt.ts`**

```ts
import type { BrokenField } from './types.js';

export const BROKEN_FIELDS: readonly BrokenField[] = ['year', 'italics', 'volume', 'author', 'pages'];

function corruptYear(apa: string): string {
  return apa.replace(/\((\d{4})\)/, (_m, y) => `(${parseInt(y, 10) + 2})`);
}
function corruptItalics(apa: string): string {
  return apa.replace(/\*/g, '');
}
function corruptVolume(apa: string): string {
  return apa.replace(/\*(\d+)\*/, (_m, v) => `*${parseInt(v, 10) + 7}*`);
}
function corruptAuthor(apa: string): string {
  // swap the first two letters of the leading surname (clear misspelling)
  return apa.replace(/^([A-Za-z])([A-Za-z])/, (_m, a, b) => `${b}${a}`);
}
function corruptPages(apa: string): string {
  // replace the page segment that sits just before the DOI
  return apa.replace(/,\s*[\d–-]+\.\s*https/, ', 9999. https');
}

export function corruptItem(apa: string, field: BrokenField): string {
  switch (field) {
    case 'year': return corruptYear(apa);
    case 'italics': return corruptItalics(apa);
    case 'volume': return corruptVolume(apa);
    case 'author': return corruptAuthor(apa);
    case 'pages': return corruptPages(apa);
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --import tsx --test "eval/corrupt.test.ts"`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add eval/corrupt.ts eval/corrupt.test.ts
git commit -m "Add citation corruption helpers for the corrected bucket"
```

---

## Task 5: CrossRef client

**Files:**
- Create: `eval/crossref.ts`
- Create: `eval/crossref.test.ts`

- [ ] **Step 1: Write failing tests (mocking global fetch)**

Create `eval/crossref.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --import tsx --test "eval/crossref.test.ts"`
Expected: FAIL (`./crossref.js` not found).

- [ ] **Step 3: Create `eval/crossref.ts`**

```ts
import type { CrossrefWork } from './apa.js';

const BASE = 'https://api.crossref.org';
const MAILTO = 'jennifer.kleiman@uga.edu';
const HEADERS = { 'User-Agent': `refcheck-eval/1.0 (mailto:${MAILTO})` };
const SELECT = 'DOI,title,author,container-title,volume,issue,page,published,issued';

export async function fetchSample(count: number): Promise<CrossrefWork[]> {
  const url = `${BASE}/works?filter=type:journal-article&sample=${Math.min(count, 100)}&select=${SELECT}&mailto=${MAILTO}`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`CrossRef ${res.status}`);
  const json: any = await res.json();
  return json.message.items as CrossrefWork[];
}

export async function doiExists(doi: string): Promise<boolean> {
  const res = await fetch(`${BASE}/works/${encodeURIComponent(doi)}`, { headers: HEADERS });
  return res.status === 200;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --import tsx --test "eval/crossref.test.ts"`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add eval/crossref.ts eval/crossref.test.ts
git commit -m "Add CrossRef client (sample fetch + DOI existence check)"
```

---

## Task 6: Fabricated-citation generator (for the "hallucinated" bucket)

**Files:**
- Create: `eval/fake.ts`
- Create: `eval/fake.test.ts`

- [ ] **Step 1: Write failing tests**

Create `eval/fake.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --import tsx --test "eval/fake.test.ts"`
Expected: FAIL (`./fake.js` not found).

- [ ] **Step 3: Create `eval/fake.ts`**

```ts
import { doiExists } from './crossref.js';

const SURNAMES = ['Quenby', 'Vorhees', 'Mallok', 'Trennick', 'Wexler', 'Ostrander', 'Bellweather', 'Cardew', 'Fenniston', 'Grumman'];
const GIVENS = ['Q. R.', 'T.', 'M. J.', 'A.', 'D. L.', 'P.', 'K. E.', 'S.', 'R. W.', 'N.'];
const TITLES = [
  'Adaptive resonance in distributed sensor lattices',
  'A unified theory of recursive market equilibria',
  'Photonic entanglement under thermal decoherence',
  'Morphological drift in synthetic lexicons',
  'Stochastic scheduling for ephemeral compute fabrics',
  'On the topology of self-healing supply graphs',
  'Latent affect in multimodal dialogue agents',
  'Boundary conditions for non-ergodic diffusion fields',
  'A calculus of revocable consent in data exchange',
  'Emergent grammar in low-resource creole corpora',
];
const JOURNALS = [
  'Journal of Applied Cybernetics',
  'International Review of Theoretical Linguistics',
  'Quarterly Papers in Computational Ecology',
  'Annals of Synthetic Materials',
  'Review of Distributed Systems Theory',
];

export function makeFakeDoi(seed: number): string {
  return `10.9999/refcheck.fake.${seed}.${Math.floor(Math.random() * 1e6)}`;
}

export function buildFakeApa(seed: number): { reference: string; doi: string } {
  const a = SURNAMES[seed % SURNAMES.length];
  const ag = GIVENS[seed % GIVENS.length];
  const b = SURNAMES[(seed + 4) % SURNAMES.length];
  const bg = GIVENS[(seed + 4) % GIVENS.length];
  const title = TITLES[seed % TITLES.length];
  const journal = JOURNALS[seed % JOURNALS.length];
  const year = 2015 + (seed % 10);
  const vol = 10 + (seed % 40);
  const issue = 1 + (seed % 4);
  const pages = `${100 + seed}–${110 + seed}`;
  const doi = makeFakeDoi(seed);
  const reference = `${a}, ${ag}, & ${b}, ${bg} (${year}). ${title}. *${journal}*, *${vol}*(${issue}), ${pages}. https://doi.org/${doi}`;
  return { reference, doi };
}

export async function makeFake(
  seed: number,
  check: (doi: string) => Promise<boolean> = doiExists,
): Promise<{ reference: string; doi: string }> {
  for (let i = 0; i < 5; i++) {
    const f = buildFakeApa(seed + i * 1000);
    if (!(await check(f.doi))) return f; // 404 confirms a usable fake
  }
  throw new Error('Could not generate a confirmed-fake DOI after 5 attempts');
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --import tsx --test "eval/fake.test.ts"`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add eval/fake.ts eval/fake.test.ts
git commit -m "Add fabricated-citation generator with DOI-404 confirmation"
```

---

## Task 7: Test-set builder

**Files:**
- Create: `eval/build-testset.ts`

This task is integration-level (hits the live CrossRef API). It has no unit test; it is validated by a real run that produces `eval/testset.json`.

- [ ] **Step 1: Create `eval/build-testset.ts`**

```ts
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchSample } from './crossref.js';
import { crossrefToApa, isComplete, isSentenceCaseLike } from './apa.js';
import { corruptItem, BROKEN_FIELDS } from './corrupt.js';
import { makeFake } from './fake.js';
import type { TestItem } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'testset.json');

export async function buildTestset(verifiedN = 20, correctedN = 20, fakeN = 20): Promise<TestItem[]> {
  const need = verifiedN + correctedN;
  const works = [] as ReturnType<typeof selectComplete>;

  let guard = 0;
  while (works.length < need && guard < 10) {
    guard++;
    const batch = await fetchSample(100);
    works.push(...batch.filter(isComplete));
  }
  if (works.length < need) throw new Error(`Only found ${works.length} complete works, need ${need}`);

  // Prefer sentence-case-like titles for the verified bucket (better APA-match validity).
  works.sort((a, b) => Number(isSentenceCaseLike(b.title[0])) - Number(isSentenceCaseLike(a.title[0])));

  const items: TestItem[] = [];
  works.slice(0, verifiedN).forEach((w, i) => {
    items.push({ id: `v${i}`, reference: crossrefToApa(w), truth: 'verified', doi: w.DOI });
  });
  works.slice(verifiedN, verifiedN + correctedN).forEach((w, i) => {
    const apa = crossrefToApa(w);
    const field = BROKEN_FIELDS[i % BROKEN_FIELDS.length];
    items.push({ id: `c${i}`, reference: corruptItem(apa, field), truth: 'corrected', doi: w.DOI, brokenField: field, correctReference: apa });
  });
  for (let i = 0; i < fakeN; i++) {
    const f = await makeFake(i);
    items.push({ id: `h${i}`, reference: f.reference, truth: 'hallucinated', doi: f.doi });
  }

  fs.writeFileSync(OUT, JSON.stringify(items, null, 2));
  console.log(`Wrote ${items.length} items to ${OUT} (verified=${verifiedN}, corrected=${correctedN}, hallucinated=${fakeN})`);
  return items;
}

// helper kept inline for the type of `works`
function selectComplete() { return [] as import('./apa.js').CrossrefWork[]; }

if (import.meta.url === `file://${process.argv[1]}`) {
  const arg = parseInt(process.argv[2] || '', 10);
  const n = Number.isFinite(arg) && arg > 0 ? arg : 20;
  buildTestset(n, n, n).catch(e => { console.error(e); process.exit(1); });
}
```

> Note: the `selectComplete`/`works` typing pattern above is only to give `works` the element type `CrossrefWork`. If the engineer prefers, declare `const works: import('./apa.js').CrossrefWork[] = []` directly and delete `selectComplete`.

- [ ] **Step 2: Smoke-build a tiny set (3 per bucket) against the live API**

Run: `npx tsx eval/build-testset.ts 3`
Expected: prints `Wrote 9 items ...` and creates `eval/testset.json` with 9 items.

- [ ] **Step 3: Eyeball the generated set**

Run: `cat eval/testset.json`
Verify by eye: the `verified` items look like correct APA 7th journal citations; `corrected` items each have a visible single defect matching `brokenField`; `hallucinated` items use `10.9999/...` DOIs. If a formatter bug shows up, fix `apa.ts` (with a new failing test first) before continuing.

- [ ] **Step 4: Commit the builder (not the tiny testset yet)**

```bash
git add eval/build-testset.ts
git commit -m "Add CrossRef-driven test-set builder"
```

---

## Task 8: Grader

**Files:**
- Create: `eval/grade.ts`
- Create: `eval/grade.test.ts`

- [ ] **Step 1: Write failing tests**

Create `eval/grade.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gradeItem, buildModelReport, fixRestored } from './grade.js';
import type { TestItem } from './types.js';

const correctApa = 'Smith, J. (2021). A study. *Journal of Examples*, *18*(1), 40–52. https://doi.org/10.1/x';

function run(status: string, corrected?: string) {
  return { result: { original: 'r', status: status as any, corrected }, latencyMs: 100, usage: { promptTokens: 1, candidatesTokens: 1, totalTokens: 50 } };
}

test('gradeItem marks correct when status matches truth', () => {
  const item: TestItem = { id: 'v0', reference: 'r', truth: 'verified' };
  assert.equal(gradeItem(item, run('verified')).correct, true);
  assert.equal(gradeItem(item, run('hallucinated')).correct, false);
});

test('fixRestored detects a restored year', () => {
  const item: TestItem = { id: 'c0', reference: 'bad', truth: 'corrected', brokenField: 'year', correctReference: correctApa };
  assert.equal(fixRestored(item, 'Smith, J. (2021). A study. *Journal of Examples*, *18*(1), 40–52.'), true);
  assert.equal(fixRestored(item, 'Smith, J. (2099). still wrong'), false);
});

test('fixRestored detects re-added italics', () => {
  const item: TestItem = { id: 'c1', reference: 'bad', truth: 'corrected', brokenField: 'italics', correctReference: correctApa };
  assert.equal(fixRestored(item, 'Smith, J. (2021). A study. *Journal of Examples*, *18*(1), 40-52.'), true);
  assert.equal(fixRestored(item, 'Smith, J. (2021). A study. Journal of Examples, 18(1), 40-52.'), false);
});

test('gradeItem sets fixRestored only for corrected-predicted corrected items', () => {
  const item: TestItem = { id: 'c0', reference: 'bad', truth: 'corrected', brokenField: 'year', correctReference: correctApa };
  assert.equal(gradeItem(item, run('corrected', correctApa)).fixRestored, true);
  assert.equal(gradeItem(item, run('verified', correctApa)).fixRestored, false);
});

test('buildModelReport aggregates accuracy, confusion, false-accusations and misses', () => {
  const items = [
    gradeItem({ id: 'v0', reference: 'r', truth: 'verified' }, run('verified')),
    gradeItem({ id: 'v1', reference: 'r', truth: 'verified' }, run('hallucinated')), // false accusation
    gradeItem({ id: 'h0', reference: 'r', truth: 'hallucinated' }, run('verified')), // miss
    gradeItem({ id: 'h1', reference: 'r', truth: 'hallucinated' }, run('hallucinated')),
  ];
  const rep = buildModelReport('m', items);
  assert.equal(rep.total, 4);
  assert.equal(rep.correctCount, 2);
  assert.equal(rep.overallAccuracy, 0.5);
  assert.equal(rep.falseAccusations, 1);
  assert.equal(rep.misses, 1);
  assert.equal(rep.confusion.verified.hallucinated, 1);
  assert.equal(rep.perClass.verified.total, 2);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --import tsx --test "eval/grade.test.ts"`
Expected: FAIL (`./grade.js` not found).

- [ ] **Step 3: Create `eval/grade.ts`**

```ts
import type { TestItem, ItemResult, ModelReport, Truth } from './types.js';
import type { RunResult, VerificationResult } from '../src/services/geminiCore.js';

const TRUTHS: Truth[] = ['verified', 'corrected', 'hallucinated'];
const STATUSES: VerificationResult['status'][] = ['verified', 'corrected', 'hallucinated', 'unknown'];

function normalize(s: string): string {
  return (s || '').toLowerCase().replace(/[*]/g, '').replace(/\s+/g, ' ').trim();
}

export function fixRestored(item: TestItem, corrected?: string): boolean {
  if (!item.correctReference || !corrected) return false;
  const fixed = normalize(corrected);
  switch (item.brokenField) {
    case 'year': {
      const m = item.correctReference.match(/\((\d{4})\)/);
      return m ? fixed.includes(`(${m[1]})`) : false;
    }
    case 'volume': {
      const m = item.correctReference.match(/\*(\d+)\*/);
      return m ? new RegExp(`\\b${m[1]}\\b`).test(fixed) : false;
    }
    case 'pages': {
      const m = item.correctReference.match(/,\s*([\d–-]+)\.\s*https/);
      return m ? fixed.includes(normalize(m[1])) : false;
    }
    case 'italics':
      return (corrected.match(/\*/g)?.length || 0) >= 2;
    case 'author': {
      const m = item.correctReference.match(/^([A-Za-z]+)/);
      return m ? fixed.includes(m[1].toLowerCase()) : false;
    }
    default:
      return false;
  }
}

export function gradeItem(item: TestItem, run: RunResult): ItemResult {
  const predicted = run.result.status;
  const res: ItemResult = {
    itemId: item.id,
    truth: item.truth,
    brokenField: item.brokenField,
    predictedStatus: predicted,
    correct: predicted === item.truth,
    latencyMs: run.latencyMs,
    totalTokens: run.usage?.totalTokens ?? 0,
    reference: item.reference,
    corrected: run.result.corrected,
    notes: run.result.notes,
  };
  if (item.truth === 'corrected') {
    res.fixRestored = predicted === 'corrected' && fixRestored(item, run.result.corrected);
  }
  return res;
}

export function buildModelReport(model: string, items: ItemResult[]): ModelReport {
  const perClass = Object.fromEntries(TRUTHS.map(t => [t, { total: 0, correct: 0, accuracy: 0 }])) as ModelReport['perClass'];
  const confusion = Object.fromEntries(
    TRUTHS.map(t => [t, Object.fromEntries(STATUSES.map(s => [s, 0]))]),
  ) as ModelReport['confusion'];

  let correctCount = 0, unknownCount = 0, falseAccusations = 0, misses = 0;
  let totalTokens = 0, latencySum = 0, correctedPredictedCount = 0, fixRestoredCount = 0;

  for (const it of items) {
    perClass[it.truth].total++;
    confusion[it.truth][it.predictedStatus]++;
    if (it.correct) { correctCount++; perClass[it.truth].correct++; }
    if (it.predictedStatus === 'unknown') unknownCount++;
    if (it.truth === 'verified' && it.predictedStatus === 'hallucinated') falseAccusations++;
    if (it.truth === 'hallucinated' && it.predictedStatus === 'verified') misses++;
    if (it.truth === 'corrected' && it.predictedStatus === 'corrected') {
      correctedPredictedCount++;
      if (it.fixRestored) fixRestoredCount++;
    }
    totalTokens += it.totalTokens;
    latencySum += it.latencyMs;
  }
  for (const t of TRUTHS) perClass[t].accuracy = perClass[t].total ? perClass[t].correct / perClass[t].total : 0;

  return {
    model, total: items.length, correctCount,
    overallAccuracy: items.length ? correctCount / items.length : 0,
    perClass, confusion, falseAccusations, misses, unknownCount,
    correctedPredictedCount, fixRestoredCount,
    fixRestoredRate: correctedPredictedCount ? fixRestoredCount / correctedPredictedCount : 0,
    avgLatencyMs: items.length ? latencySum / items.length : 0,
    totalTokens, items,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --import tsx --test "eval/grade.test.ts"`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add eval/grade.ts eval/grade.test.ts
git commit -m "Add grader: status accuracy, confusion, fix-restored"
```

---

## Task 9: Report renderer

**Files:**
- Create: `eval/report.ts`
- Create: `eval/report.test.ts`

- [ ] **Step 1: Write failing tests**

Create `eval/report.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderTable, renderConsoleTable, renderMarkdown } from './report.js';
import type { ModelReport } from './types.js';

const rep: ModelReport = {
  model: 'gemini-x', total: 2, correctCount: 1, overallAccuracy: 0.5,
  perClass: {
    verified: { total: 1, correct: 1, accuracy: 1 },
    corrected: { total: 0, correct: 0, accuracy: 0 },
    hallucinated: { total: 1, correct: 0, accuracy: 0 },
  },
  confusion: {
    verified: { verified: 1, corrected: 0, hallucinated: 0, unknown: 0 },
    corrected: { verified: 0, corrected: 0, hallucinated: 0, unknown: 0 },
    hallucinated: { verified: 1, corrected: 0, hallucinated: 0, unknown: 0 },
  },
  falseAccusations: 0, misses: 1, unknownCount: 0,
  correctedPredictedCount: 0, fixRestoredCount: 0, fixRestoredRate: 0,
  avgLatencyMs: 120, totalTokens: 100,
  items: [
    { itemId: 'h0', truth: 'hallucinated', predictedStatus: 'verified', correct: false, latencyMs: 120, totalTokens: 50, reference: 'fake ref', corrected: 'x', notes: 'looks real' },
  ],
};

test('renderTable aligns columns', () => {
  const out = renderTable(['a', 'bb'], [['1', '2'], ['333', '4']]);
  assert.match(out, /\| a   \| bb \|/);
});

test('renderConsoleTable includes the model and overall accuracy', () => {
  const out = renderConsoleTable([rep]);
  assert.match(out, /gemini-x/);
  assert.match(out, /50\.0%/);
});

test('renderMarkdown includes a disagreement appendix entry for wrong items', () => {
  const md = renderMarkdown([rep]);
  assert.match(md, /# Model A\/B Accuracy Report/);
  assert.match(md, /h0/);          // the mis-graded item id
  assert.match(md, /fake ref/);    // its reference text appears for eyeballing
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --import tsx --test "eval/report.test.ts"`
Expected: FAIL (`./report.js` not found).

- [ ] **Step 3: Create `eval/report.ts`**

```ts
import fs from 'node:fs';
import path from 'node:path';
import type { ModelReport, Truth } from './types.js';
import type { VerificationResult } from '../src/services/geminiCore.js';

const TRUTHS: Truth[] = ['verified', 'corrected', 'hallucinated'];
const STATUSES: VerificationResult['status'][] = ['verified', 'corrected', 'hallucinated', 'unknown'];

function pct(x: number): string { return (x * 100).toFixed(1) + '%'; }

export function renderTable(header: string[], rows: string[][]): string {
  const widths = header.map((h, i) => Math.max(h.length, ...rows.map(r => (r[i] || '').length)));
  const line = (cells: string[]) => '| ' + cells.map((c, i) => (c || '').padEnd(widths[i])).join(' | ') + ' |';
  const sep = '|' + widths.map(w => '-'.repeat(w + 2)).join('|') + '|';
  return [line(header), sep, ...rows.map(line)].join('\n');
}

export function renderConsoleTable(reports: ModelReport[]): string {
  const header = ['model', 'overall', 'verified', 'corrected', 'hallucinated', 'fix✓(approx)', 'unknown', 'false-acc', 'misses', 'avg-lat', 'tokens'];
  const rows = reports.map(r => [
    r.model, pct(r.overallAccuracy),
    pct(r.perClass.verified.accuracy), pct(r.perClass.corrected.accuracy), pct(r.perClass.hallucinated.accuracy),
    pct(r.fixRestoredRate), String(r.unknownCount), String(r.falseAccusations), String(r.misses),
    Math.round(r.avgLatencyMs) + 'ms', String(r.totalTokens),
  ]);
  return renderTable(header, rows);
}

function renderConfusion(r: ModelReport): string {
  const header = ['truth \\ predicted', ...STATUSES];
  const rows = TRUTHS.map(t => [t, ...STATUSES.map(s => String(r.confusion[t][s]))]);
  return renderTable(header, rows);
}

export function renderMarkdown(reports: ModelReport[]): string {
  const lines: string[] = [];
  lines.push('# Model A/B Accuracy Report', '');
  lines.push(`_Generated ${new Date().toISOString()}_`, '');
  lines.push('## Summary', '', renderConsoleTable(reports), '');
  for (const r of reports) {
    lines.push(`## ${r.model}`, '');
    lines.push(`- Overall accuracy: **${pct(r.overallAccuracy)}** (${r.correctCount}/${r.total})`);
    lines.push(`- False accusations (real → flagged fake): **${r.falseAccusations}**`);
    lines.push(`- Misses (fake → passed as verified): **${r.misses}**`);
    lines.push(`- Fix restored (approx, among corrected-caught): ${r.fixRestoredCount}/${r.correctedPredictedCount}`);
    lines.push(`- Unknown/failed verdicts: ${r.unknownCount}`, '');
    lines.push('### Confusion matrix', '', renderConfusion(r), '');
    const wrong = r.items.filter(it => !it.correct);
    lines.push(`### Disagreements with truth (${wrong.length})`, '');
    for (const it of wrong) {
      lines.push(`- **${it.itemId}** truth=\`${it.truth}\` predicted=\`${it.predictedStatus}\``);
      lines.push(`  - ref: ${it.reference}`);
      if (it.corrected) lines.push(`  - model correction: ${it.corrected}`);
      if (it.notes) lines.push(`  - notes: ${it.notes}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

export function writeReport(reports: ModelReport[], dir: string): { mdPath: string; jsonPath: string } {
  fs.mkdirSync(dir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(dir, `results-${ts}.json`);
  const mdPath = path.join(dir, 'report.md');
  fs.writeFileSync(jsonPath, JSON.stringify(reports, null, 2));
  fs.writeFileSync(mdPath, renderMarkdown(reports));
  return { mdPath, jsonPath };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --import tsx --test "eval/report.test.ts"`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add eval/report.ts eval/report.test.ts
git commit -m "Add report renderer: summary table, confusion, disagreement appendix"
```

---

## Task 10: Runner

**Files:**
- Create: `eval/run.ts`

Integration-level; validated by the real eval run in Task 11.

- [ ] **Step 1: Create `eval/run.ts`**

```ts
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runVerification } from '../src/services/geminiCore.js';
import { gradeItem, buildModelReport } from './grade.js';
import { renderConsoleTable, writeReport } from './report.js';
import { buildTestset } from './build-testset.js';
import type { TestItem, ItemResult, ModelReport } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TESTSET = path.join(__dirname, 'testset.json');

// Add 'gemini-3.5-pro' here when Google publishes its model ID.
const MODELS = ['gemini-3.1-pro-preview', 'gemini-3.5-flash'];

async function loadTestset(): Promise<TestItem[]> {
  if (!fs.existsSync(TESTSET)) {
    console.log('No testset.json found — building a default 20/20/20 set...');
    await buildTestset();
  }
  return JSON.parse(fs.readFileSync(TESTSET, 'utf8')) as TestItem[];
}

async function main(): Promise<void> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) { console.error('GEMINI_API_KEY is not set. Add it to .env.'); process.exit(1); }

  const items = await loadTestset();
  console.log(`Loaded ${items.length} test items. Models: ${MODELS.join(', ')}`);
  console.log(`Rate limit: ${process.env.GEMINI_MIN_DELAY_MS || '8000'}ms between calls.\n`);

  const reports: ModelReport[] = [];
  for (const model of MODELS) {
    console.log(`=== ${model} ===`);
    const results: ItemResult[] = [];
    let i = 0;
    for (const item of items) {
      i++;
      const run = await runVerification({ apiKey, model, reference: item.reference });
      const graded = gradeItem(item, run);
      results.push(graded);
      console.log(`  [${i}/${items.length}] ${item.truth} -> ${graded.predictedStatus} ${graded.correct ? '✓' : '✗'}`);
    }
    reports.push(buildModelReport(model, results));
    console.log('');
  }

  console.log(renderConsoleTable(reports));
  const { mdPath, jsonPath } = writeReport(reports, __dirname);
  console.log(`\nReport:  ${mdPath}\nResults: ${jsonPath}`);
}

main().catch(e => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Type/lint sanity via a dry compile of the eval entry**

Run: `npx tsx --eval "import('./eval/run.ts').then(()=>{}).catch(e=>{console.error(String(e));})"` is NOT used (it would execute). Instead verify imports resolve by running the unit suite again:
Run: `npm test`
Expected: all tests pass (the runner shares modules already covered by tests).

- [ ] **Step 3: Commit**

```bash
git add eval/run.ts
git commit -m "Add eval runner over the model list"
```

---

## Task 11: End-to-end run + README

**Files:**
- Create: `eval/README.md`
- Produces: `eval/testset.json` (committed), `eval/report.md` + `eval/results-*.json` (gitignored)

- [ ] **Step 1: Build the full 60-item answer key**

Run: `npm run eval:build`
Expected: `Wrote 60 items ... (verified=20, corrected=20, hallucinated=20)`.

- [ ] **Step 2: Eyeball `eval/testset.json` once more**

Confirm the 20 verified items are plausible correct APA citations, the 20 corrected items each have exactly one defect, and the 20 fakes use `10.9999/...` DOIs. Fix `apa.ts`/`corrupt.ts`/`fake.ts` (test-first) if anything is off, then rebuild.

- [ ] **Step 3: Do a fast smoke run on a 9-item set first**

To avoid spending ~16 min / ~$0.50 on a broken pipeline, first run against a tiny set:

```bash
npx tsx eval/build-testset.ts 3      # 9-item set
GEMINI_MIN_DELAY_MS=8000 npm run eval
```
Expected: both models run all 9 items, a summary table prints, and `eval/report.md` is written. Inspect `report.md` for sanity (columns populated, disagreement appendix readable).

- [ ] **Step 4: Rebuild the full set and run the real eval**

```bash
npm run eval:build                   # back to 60 items
npm run eval                         # ~16 min at 8s/call
```
Expected: summary table comparing `gemini-3.1-pro-preview` vs `gemini-3.5-flash` across overall/per-class accuracy, false-accusations, misses, fix-restored, latency, tokens; `eval/report.md` written.

- [ ] **Step 5: Write `eval/README.md`**

```markdown
# Model accuracy eval

Offline harness that grades Gemini models on reference-verification accuracy
against a CrossRef-built answer key. Does not touch Supabase, credits, or the
production endpoint.

## Run

```bash
npm run eval:build        # build/refresh eval/testset.json (20/20/20)
npm run eval:build 3      # smaller 3-per-bucket set for smoke testing
npm run eval              # run all models in MODELS over the test set
```

Requires `GEMINI_API_KEY` in `.env`. Calls use real API quota/money (not user
credits). Set `GEMINI_MIN_DELAY_MS` to control the rate-limiter delay
(default 8000ms; lower it for faster local runs).

## What it measures

- **Primary:** 3-class status accuracy (verified / corrected / hallucinated),
  with a confusion matrix and two named error types — false accusations
  (real ref flagged fake) and misses (fake ref passed as verified).
- **Secondary (approximate):** whether a "corrected" verdict actually restored
  the broken field.

## Adding a model

Edit `MODELS` in `eval/run.ts`. Add `gemini-3.5-pro` once Google publishes its ID.

## Files

- `build-testset.ts` — CrossRef → `testset.json`
- `apa.ts` — CrossRef → APA 7th journal-article formatter
- `corrupt.ts` — single-field corruptions for the "corrected" bucket
- `fake.ts` — fabricated citations (DOI 404-confirmed) for the "hallucinated" bucket
- `crossref.ts` — CrossRef API client
- `run.ts` — runs models, grades, writes the report
- `grade.ts` — scoring
- `report.ts` — console table + `report.md` + `results-*.json`

## Caveat on validity

The goal is an A/B *comparison*: both models get byte-identical inputs, so any
systematic APA-formatting imperfection in the test set depresses both models'
absolute scores equally and does not bias which model wins. Title casing is
preserved from CrossRef (sentence-case conversion is lossy). The 20 fakes are
committed for human review.
```

- [ ] **Step 6: Commit the testset and README**

```bash
git add eval/testset.json eval/README.md
git commit -m "Add committed 60-item answer key and eval README"
```

- [ ] **Step 7: Final verification**

Run: `npm test && npm run build`
Expected: all unit tests pass and the production TypeScript build is clean.

---

## Self-review notes (author check, not a task)

- **Spec coverage:** offline harness (Tasks 7,10,11) ✓; CrossRef 20/20/20 key (Task 7) ✓; APA formatter w/ tests (Task 3) ✓; DOI-404 fake confirmation (Task 6) ✓; geminiCore refactor preserving production behavior (Task 2) ✓; isolation from config/supabase via injected logError + direct API key (Task 2) ✓; 3-class accuracy + confusion + false-accusations/misses (Task 8) ✓; fix-restored secondary, flagged approximate (Tasks 8,9,README) ✓; report.md + JSON + disagreement appendix (Task 9) ✓; configurable rate delay + MODELS array (Tasks 2,10) ✓; cost/time note (README, Task 11) ✓; journal-articles-only scope (Task 3 `isComplete`, README) ✓.
- **Placeholder scan:** none — every code/test step contains full content.
- **Type consistency:** `RunResult`, `VerificationResult`, `TestItem`, `ItemResult`, `ModelReport`, `BrokenField`, `crossrefToApa`, `corruptItem`, `BROKEN_FIELDS`, `fetchSample`, `doiExists`, `makeFake`, `buildFakeApa`, `gradeItem`, `buildModelReport`, `fixRestored`, `renderTable`, `renderConsoleTable`, `renderMarkdown`, `writeReport`, `buildTestset` are defined once and referenced consistently across tasks.
