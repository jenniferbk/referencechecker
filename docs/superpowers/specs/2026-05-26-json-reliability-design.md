# JSON Reliability Hardening — Design

**Date:** 2026-05-26
**Status:** Approved, ready for implementation plan
**Author:** Jennifer Kleiman (with Claude)
**Related:** [[2026-05-26-model-ab-test-design]] (the eval that surfaced this), `docs/superpowers/results/2026-05-26-model-ab-eval-results.md`

## Problem

The 60-item model A/B eval (2026-05-26) showed that `verifyReference` sometimes returns
`unknown` because the model's response can't be parsed as JSON, even though
`generationConfig` already sets `responseMimeType: 'application/json'`:

- `gemini-3.5-flash`: 4/60 (~6.7%) `unknown` from malformed/empty JSON.
- `gemini-3.1-pro-preview` (current production model): 1/60 (~1.7%).

Two observed failure modes:
1. **Empty response** — the model returned no text; `JSON.parse('')` throws.
2. **Malformed JSON** — the model emitted a dangling/duplicated clause inside the object
   (e.g. an extra line after the `notes` string before the closing brace), so `JSON.parse`
   fails on otherwise-usable content.

Today `parseVerificationResponse` swallows these into a `status: 'unknown'` result with **no
retry**, so the user sees "could not verify" even though a re-ask would usually succeed.

## Goal & non-goals

**Goal:** Reduce `unknown`-from-bad-JSON results in production `verifyReference` for any
model, by (a) constraining the model to emit schema-valid JSON and (b) retrying the
stochastic residual failures.

**Non-goals:**
- Not changing the verification prompt's wording or the APA logic.
- Not changing the eval's answer key or grading (that is the separate Issue B —
  answer-key fidelity — handled in its own spec).
- Not switching the production model. This hardening is model-agnostic and benefits the
  current `gemini-3.1-pro-preview` as well as any future swap.

## Verified constraint

Gemini 3 supports combining **structured outputs (`responseSchema`) with Grounding with
Google Search** (Google Developers Blog, "New Gemini API updates for Gemini 3"; Gemini API
structured-output and grounding docs). Both eval models are in the Gemini 3 family, so the
schema + grounding combination is allowed. A field report of nil responses involved
`thinkingConfig` + File Search, neither of which this code uses; the eval rerun (below) is
the empirical check that grounding still works with the schema.

The installed SDK is `@google/generative-ai` 0.24.1. Its `ResponseSchema`/`Schema` types
provide `EnumStringSchema` (`{ type: STRING, format: "enum", enum: string[] }`) and
`ObjectSchema` (`{ type: OBJECT, properties, required? }`). This SDK version's `ObjectSchema`
has **no `propertyOrdering`** field, so the schema does not use it.

## Design

All changes are in `src/services/geminiCore.ts` and its test. `gemini.ts` (the production
wrapper) is unchanged; it automatically benefits because it calls `runVerification`.

### 1. Constrained output via `responseSchema`

Add an exported constant and pass it in `defaultGenerate`'s `generationConfig` next to the
existing `responseMimeType: 'application/json'`; keep `tools: [{ googleSearch: {} }]`.

```ts
import { GoogleGenerativeAI, SchemaType, type ResponseSchema } from '@google/generative-ai';

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

- `status` deliberately excludes `'unknown'` — that value is the harness's internal marker
  for a failed/unparseable call, never a verdict the model should emit.
- `corrected` is optional (a hallucinated reference has nothing to correct).
- `notes` is required so every verdict carries an explanation.

`defaultGenerate` becomes:

```ts
const m = genAI.getGenerativeModel({
  model,
  // @ts-ignore - googleSearch is valid but types might be missing
  tools: [{ googleSearch: {} }],
  generationConfig: { responseMimeType: 'application/json', responseSchema: VERIFICATION_SCHEMA },
});
```

### 2. Retry on parse failure / empty response

`parseVerificationResponse` changes contract: it **throws** on an empty response or invalid
JSON instead of returning an `unknown` result. It still strips ``` ```json ``` fences first.

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

`runVerification` calls it inside the existing try block, so a `PARSE_ERROR` is caught by
the existing retry loop. `isRetryableError` recognizes `PARSE_ERROR` as retryable:

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

Parse retries reuse the existing exponential backoff and `MAX_RETRIES = 3` cap. On
exhaustion, the final-failure handler logs `gemini_parse_error` (preserving today's logging
intent) and returns the existing `unknown` result, now with a clear message:

```ts
const parseFailed = (lastError?.message || '').includes('PARSE_ERROR');
// ... in the message ladder:
else if (parseFailed) errorMessage = 'The AI returned an unreadable response after multiple attempts. Please try again.';
```

The `gemini_parse_error` log entry moves from per-attempt (inside the old
`parseVerificationResponse`) to once-on-final-failure inside `runVerification`. The
`logError` injection point is unchanged.

### 3. Behavior preservation

- Production `verifyReference` still returns the same 4-field `VerificationResult` and still
  returns `status: 'unknown'` when the model genuinely can't produce parseable output after
  retries — only now that path is rarer.
- RECITATION handling, quota/network classification, the rate limiter, and the
  `generate`/`logError` injection seams are unchanged.
- The retry count and backoff are unchanged (parse failures share the existing budget).

## Testing

Unit tests in `src/services/geminiCore.test.ts`:

- `parseVerificationResponse`: valid JSON → result; ` ```json ` fences stripped; empty
  string → throws `PARSE_ERROR`; invalid JSON → throws `PARSE_ERROR`.
- `runVerification`: retries a parse failure then succeeds (generate returns bad JSON once,
  then valid → 2 calls, returns `verified`); retries an empty response; returns `unknown`
  and logs `gemini_parse_error` once after exhausting parse retries.
- `VERIFICATION_SCHEMA` shape: `status` is an enum with exactly
  `['verified','corrected','hallucinated']`; `required` includes `status` and `notes`.
- Existing success / RECITATION / quota / 403 tests continue to pass (updated only where the
  parse contract changed).

The `responseSchema`'s runtime effect is exercised by the real SDK call, which is mocked in
unit tests (via the injected `generate`), so it is verified empirically by the eval rerun,
not by a unit test.

## Verification (eval rerun)

After unit tests and `npm run build` pass, rerun `npm run eval` on the committed 60-item
answer key (~16 min, ~$0.30–0.60 of API, gated on explicit human go-ahead). Compare against
the saved baseline (`docs/superpowers/results/2026-05-26-model-ab-eval-results.md`):

- **Success criterion:** `unknown` count drops (target: 3.5-flash 4→0–1, 3.1-pro 1→0).
- **Guardrail:** the `hallucinated` bucket stays ~100% for both models — confirming
  `responseSchema` did not disable or degrade Google Search grounding. If hallucination
  detection regresses, revert the `responseSchema` change and keep only the parse retry
  (Section 2), then document the incompatibility.

## Rollback

If the eval rerun shows grounding regression, removing the single `responseSchema` line from
`defaultGenerate` reverts to today's behavior while retaining the parse-retry improvement.

## Open items

None blocking.
