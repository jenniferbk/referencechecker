# Model A/B Accuracy Eval — Design

**Date:** 2026-05-26
**Status:** Approved, ready for implementation plan
**Author:** Jennifer Kleiman (with Claude)

## Problem

Gemini 3.5 Flash went GA on 2026-05-19 (model ID `gemini-3.5-flash`, $1.50 input /
$9.00 output per 1M tokens). The Reference Checker currently runs on
`gemini-3.1-pro-preview` ($2 / $12), hardcoded at `src/services/gemini.ts:81`. We want
to know whether 3.5 Flash is **as accurate or more accurate** at this specific task —
verifying academic references and checking APA 7th formatting — before considering a
switch. Google's published benchmarks are for coding/agentic tasks, not citation
verification, so they don't answer the question.

Gemini 3.5 Pro does **not** exist yet (promised "next month" as of I/O 2026), so today's
comparison is two models: `gemini-3.1-pro-preview` vs `gemini-3.5-flash`.

## Goal & non-goals

**Goal:** Measure which model is *more accurate* at reference verification, against a
ground-truth answer key. Accuracy is the sole headline metric.

**Non-goals:**
- Not a cost study (we capture token counts because they're free in the response, but
  cost is not the deciding metric).
- Not a live/production experiment. No traffic splitting, no shadow mode — neither can
  measure accuracy because live references have no answer key.
- Not a books/chapters/proceedings evaluation in v1 (journal articles only — see Scope).

## Why offline, not live

To measure which model is *right*, every test reference needs a known-correct verdict.
Live user traffic has no such key, and the existing `job_results` rows were all labeled
by 3.1 Pro, so they can't grade 3.1 Pro. An offline harness with a constructed answer key
is the only design that can produce an accuracy verdict. It also charges no user credits
and carries zero production risk.

## Answer key (the test set)

60 items, built automatically from the CrossRef REST API and cached to
`eval/testset.json` (committed, so reruns are reproducible and the key is reviewable).

| Bucket | Count | Truth | How built |
|---|---|---|---|
| Real, correctly formatted | 20 | `verified` | Pull real journal articles from CrossRef (complete author/title/journal/year/DOI), format to APA 7th via `crossrefToApa()`. |
| Real, one introduced error | 20 | `corrected` | Take real articles, corrupt exactly one recorded field. Store `brokenField` + the correct citation. |
| Fabricated | 20 | `hallucinated` | Synthesize invented author/title/journal/year and a syntactically valid but unregistered DOI. **Confirm the DOI returns 404 from the CrossRef DOI endpoint** (`/works/{doi}`) before accepting as a true negative. |

**Corruption types** (one per corrected item, recorded so the grader knows what was
broken): swap publication year, strip required italics, wrong volume number, misspell an
author surname, malformed page range.

**Validity risk + mitigation:** the "verified" bucket only measures accuracy if *our* APA
7th formatting is genuinely correct — otherwise a model that correctly flags our bad
formatting gets scored as wrong. Therefore `crossrefToApa()` is the validity-critical
component and gets thorough unit tests. Two further notes:

- *Title casing.* CrossRef sometimes stores article titles in title case; APA 7th wants
  sentence case. Converting title→sentence case reliably is lossy (proper nouns). v1
  preserves CrossRef's title casing verbatim and prefers records whose titles are already
  sentence-case-like (heuristic selection). This is acceptable because the goal is an A/B
  *comparison*: both models receive byte-identical inputs, so any systematic formatting
  bias depresses both models' absolute scores equally and does not bias which model wins.
- *Confirming fakes.* Proving a paper doesn't exist is not fully automatable. The reliable
  automatic signal is the DOI 404 check above (real DOI → 200, fabricated → 404, verified).
  Because `testset.json` is committed, the 20 fakes are also available for human review.

## Scope decision (YAGNI)

v1 restricts the test set to CrossRef type `journal-article`. APA 7th rules for journal
articles are well-defined and a correct formatter is achievable. Books, chapters, and
proceedings add formatter complexity for marginal benefit and are deferred.

## Architecture

```
eval/
  build-testset.ts   # CrossRef -> 60-item key, cached to testset.json
  testset.json       # cached key (committed)
  crossref.ts        # CrossRef API client (fetch works, check-by-title)
  apa.ts             # crossrefToApa() formatter + corruption helpers
  run.ts             # runs each model in MODELS over the key, captures verdicts
  grade.ts           # scores verdicts vs key (status match + fix-restored)
  report.ts          # writes report.md + results-<timestamp>.json
src/services/
  geminiCore.ts      # NEW: real verification call, model + apiKey as parameters
  gemini.ts          # thin wrapper over geminiCore (production behavior unchanged)
```

Run via `npm run eval` (adds `tsx` as a devDependency). The eval is a local dev tool,
separate from the `tsc` production build.

### Production refactor (touches live code)

The eval must exercise the **exact** production code path — same prompt, retry logic,
rate limiter, search-grounding config — with only the model ID swapped. A divergent copy
would invalidate the comparison. So:

- Extract the current body of `verifyReference` into
  `geminiCore.ts: runVerification({ apiKey, model, reference })`. It returns the existing
  `VerificationResult` plus `latencyMs` and optional token `usage`.
- The module-level rate limiter (`MIN_DELAY_MS`, `pendingQueue`, `processQueue`) and the
  retry/parse/error-classification helpers move into `geminiCore.ts`.
- `gemini.ts` keeps `verifyReference(reference)` as a one-line wrapper:
  `runVerification({ apiKey: config.geminiApiKey, model: 'gemini-3.1-pro-preview', reference })`.
  **Production output is byte-for-byte identical.**
- `geminiCore.ts` reads its API key from the passed argument, not from `config.ts`, so the
  eval (which imports `geminiCore` directly) does **not** trip `config.ts`'s startup check
  that calls `process.exit(1)` on missing Supabase/Stripe env vars — vars Jennifer may not
  have locally.
- The eval reads `GEMINI_API_KEY` directly via `dotenv`.

The refactor is covered by unit tests written before the change (TDD) to prove production
output is unchanged.

## Data flow

1. `npm run eval` → `run.ts` loads `eval/testset.json` (calls `build-testset.ts` to create
   it if missing).
2. For each `model` in the `MODELS` array, for each of the 60 items, call
   `runVerification({ apiKey, model, reference })`, recording verdict, latency, token usage.
   Calls go through the shared rate limiter. Progress is printed.
3. `grade.ts` scores all verdicts against the key.
4. `report.ts` writes `eval/report.md` and `eval/results-<timestamp>.json` and prints a
   summary table.

`MODELS = ['gemini-3.1-pro-preview', 'gemini-3.5-flash']` — add `gemini-3.5-pro` when it
ships and rerun.

## Grading

**Primary — 3-class status accuracy.** Compare predicted `status` to truth `status`. Build
a 3×3 confusion matrix per model. Report overall accuracy plus per-class accuracy, and call
out by name the two error types that matter most to a researcher:
- **False accusation:** truth `verified` but model said `hallucinated` (real ref called fake).
- **Miss:** truth `hallucinated` but model said `verified` (fake ref waved through).

A model verdict of `unknown` (API failure / RECITATION refusal) counts as incorrect for any
truth class and is tallied separately so failures don't masquerade as wrong *answers*.

**Secondary — fix restored** (corrected items only, flagged *approximate*). For each
corrected item the model classified as `corrected`, normalize and fuzzy-compare its
`corrected` text against the known-correct citation, focused on whether `brokenField` was
repaired. Reported as a separate percentage, explicitly labeled approximate because
free-text correction matching is brittle.

## Report

- **Console summary table:** model × overall accuracy × verified accuracy × corrected-caught
  accuracy × hallucination accuracy × fix-restored% × `unknown` count × avg latency × total
  tokens.
- **Confusion matrix** per model.
- **Disagreement appendix:** every item where a model's verdict ≠ truth — the reference,
  the truth label, each model's verdict, and its correction text — for manual eyeballing.
- Written to `eval/report.md` and `eval/results-<timestamp>.json`.

## Execution & cost

- 60 items × 2 models = 120 grounded API calls.
- At the existing 8s rate limit, ~16 minutes. The eval's delay is configurable
  (env var, defaulting to the production 8000ms) so it can be sped up for a local run.
- Cost ≈ $0.30–0.60 of **API** usage on Jennifer's key (real money), **not** user credits.
  The harness never writes to Supabase and never calls `/verify-reference`.

## Testing

- TDD for the pure functions: `crossrefToApa()`, the corruption helpers, and the grader
  (status match + fix-restored). These are deterministic and easy to test.
- Mock the CrossRef HTTP client in tests.
- Tests proving `verifyReference` output is unchanged after the `geminiCore` extraction.
- The live model call itself is not unit-tested (external dependency); it's exercised by
  the actual eval run.

## Open items

None blocking. `gemini-3.5-pro` is intentionally out of scope until Google publishes the
model ID.
