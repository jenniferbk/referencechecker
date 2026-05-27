# Eval Answer-Key Fidelity — Design (Issue B)

**Date:** 2026-05-27
**Status:** Approved, ready for implementation plan
**Author:** Jennifer Kleiman (with Claude)
**Related:** [[2026-05-26-model-ab-test-design]] (the eval), [[2026-05-26-json-reliability-design]] (Issue A), `docs/superpowers/results/2026-05-27-eval-post-jsonfix.md`

## Problem

In the model A/B eval, the "verified" bucket is misleadingly low (~40% for both models)
because the CrossRef→APA answer key emits citations that are not always perfect APA 7th, so
both models reasonably return `corrected` instead of `verified`. Inspection of the post-fix
run's verified-bucket disagreements shows the "corrections" are legitimate and fall into two
groups:

**Cheap, common formatter dirt (worth fixing in `apa.ts`):**
- ALL-CAPS author surnames, e.g. `MORRIS, A.` (item v10).
- ALL-CAPS journal titles (item v16).
- `No`/`Vol` prefixes in the CrossRef volume field, e.g. `*No 26*(2)` (item v8).

**Genuinely hard / unfixable (the existence score should absorb these):**
- Fragmented CJK author names (v3), junk 1935 metadata (v4, v14), a real typo in the source
  title (v18, "wallof"), conference/article-number nuances (v13, v17), guillemets and odd
  punctuation (v12, v15, v19).

Because perfect CrossRef→APA fidelity is unattainable, demanding exactly `verified` conflates
two different questions: "is this a real source?" and "is our formatting flawless?".

## Goal & non-goals

**Goal:** Make the eval's verified-bucket measurement trustworthy by (a) scoring it two ways
— a robust **existence** score and a strict **format-perfect** score, both reported — and
(b) removing the cheapest, most common formatter dirt so the strict score reflects model
behavior rather than our bugs.

**Non-goals:**
- Not changing production code. This is entirely within the `eval/` harness.
- Not chasing every formatting edge case (CJK reconstruction, source typos, junk metadata,
  guillemets, `?`/`!` punctuation). The existence score covers those; pursuing them is
  diminishing returns (YAGNI).
- Not changing the corrected/hallucinated grading semantics.

## Design

All changes are in `eval/` (`grade.ts`, `report.ts`, `types.ts`, `apa.ts`) and their tests.

### 1. Grading reframe (`grade.ts`, `types.ts`)

Add a second correctness notion. For each item:

- `correct` (strict, unchanged): `predictedStatus === truth`.
- `existenceCorrect` (new): `correct` OR (`truth === 'verified'` AND `predictedStatus === 'corrected'`).
  - For `verified` truth: true if the model said `verified` or `corrected` (recognized a real
    source, did not hallucinate-flag it).
  - For `corrected` truth: equals strict — the model must still *catch* the injected error
    (`corrected` → `verified` remains wrong; it missed the defect).
  - For `hallucinated` truth: equals strict — a fake must still be flagged.

`ItemResult` gains `existenceCorrect: boolean`.

`ModelReport` gains:
- `existenceCorrectCount: number`
- `overallExistenceAccuracy: number` = `existenceCorrectCount / total`
- `verifiedExistenceAccuracy: number` = existence-correct among verified-truth items /
  verified-truth total.

The existing strict fields (`overallAccuracy`, `perClass.verified.accuracy`, confusion,
`falseAccusations`, `misses`, etc.) are unchanged. `falseAccusations` (verified→hallucinated)
remains the key safety signal and is unaffected by the existence reframe.

### 2. Report (`report.ts`)

The summary table shows both scores. Proposed columns (existence values are the meaningful
headline; strict values shown alongside):

```
| model | overall(exist) | overall(strict) | verified(exist) | verified(strict) | corrected | hallucinated | fix✓(approx) | unknown | false-acc | misses | avg-lat | tokens |
```

`corrected` and `hallucinated` columns are unchanged (strict == existence there). The
markdown per-model section adds one bullet: "Existence recognition (real source not
hallucinated): X% (Y/Z)" next to the existing strict accuracy bullet. The disagreement
appendix is unchanged but, for verified-truth items, a `corrected` verdict is no longer
listed as a disagreement under the existence view (it still appears under strict). To keep
the appendix simple, it continues to list strict disagreements (`!correct`) and notes which
are existence-correct.

### 3. Formatter cleanup (`apa.ts`) — three targeted fixes only

- **ALL-CAPS author surname → title case.** In author formatting, if a `family` value is
  entirely uppercase letters (matches `/^[\p{Lu}]{2,}$/u`, allowing spaces/hyphens between
  uppercase words), convert it to title case (`MORRIS` → `Morris`, `VAN DER BERG` →
  `Van Der Berg`). Mixed-case names (`Morris`, `McDonald`) are left untouched. Intercaps lost
  from already-all-caps input (`MCDONALD` → `Mcdonald`) are an accepted limitation.
- **ALL-CAPS journal title → APA title case.** If the journal string has no lowercase
  letters, convert to title case: capitalize the first letter of each word and the first
  word, but lowercase a small set of minor words (a, an, and, as, at, but, by, for, in, of,
  on, or, the, to, vs) when they are not the first word. Journals already in mixed case are
  left untouched.
- **Strip `No`/`Vol` volume prefixes.** Before rendering, clean `work.volume` by removing a
  leading `No`, `No.`, `Vol`, or `Vol.` followed by whitespace (case-insensitive), e.g.
  `No 26` → `26`, `Vol. 8` → `8`.

These are bounded helpers with unit tests. They run inside `crossrefToApa` so both the
verified and corrected buckets get cleaner base citations.

### 4. Decomposition & interfaces

- `apa.ts`: add small exported pure helpers `titleCaseSurname(s)`, `titleCaseJournal(s)`,
  `cleanVolume(s)`, used by `formatAuthors`/`crossrefToApa`. Each independently testable.
- `grade.ts`: `gradeItem` sets `existenceCorrect`; `buildModelReport` aggregates the new
  fields. Pure functions, as today.
- `report.ts`: rendering only; consumes the new `ModelReport` fields.

## Testing

Unit tests (free):
- `grade.test.ts`: `existenceCorrect` true for verified→corrected, false for
  verified→hallucinated and verified→unknown; equals strict for corrected and hallucinated
  truth (corrected→verified is existence-incorrect); `buildModelReport` computes
  `overallExistenceAccuracy` and `verifiedExistenceAccuracy` correctly on a mixed set.
- `apa.test.ts`: `titleCaseSurname('MORRIS')==='Morris'`, multi-word all-caps handled,
  mixed-case untouched; `titleCaseJournal('JOURNAL OF EXAMPLES')==='Journal of Examples'`,
  mixed-case untouched; `cleanVolume('No 26')==='26'`, `cleanVolume('Vol. 8')==='8'`,
  `cleanVolume('26')==='26'`; an end-to-end `crossrefToApa` case with an ALL-CAPS author and
  `No`-prefixed volume renders clean APA.
- `report.test.ts`: summary table contains both an existence overall and a strict overall;
  markdown contains the existence-recognition bullet.

Free verification (no API calls): re-grade the existing saved results JSON
(`eval/results-*.json`) through the new grader and report the existence-overall vs strict-
overall for both models. Expectation: the verified-bucket items that scored `corrected`
(~11/20 per model) become existence-correct, lifting the existence overall well above the
strict overall.

Optional/deferred (paid): a fresh `npm run eval` to observe the *strict* score improve on the
cleaned answer key. Not required to validate this change and gated on explicit human
go-ahead.

## Rollback

Each formatter helper is independent; if one over-corrects (e.g. a title-casing edge case),
it can be reverted without affecting the grading reframe. The grading reframe is additive
(new fields), so it carries no risk to existing metrics.

## Open items

None blocking.
