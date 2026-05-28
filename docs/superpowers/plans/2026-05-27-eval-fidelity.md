# Eval Answer-Key Fidelity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the eval's verified-bucket measurement trustworthy by adding an existence score alongside the strict score, and cleaning the cheap, common formatter dirt that distorts the strict score.

**Architecture:** All changes are in `eval/` (`types.ts`, `grade.ts`, `report.ts`, `apa.ts`) and their tests. No production code is touched. The grading reframe is additive (new fields, existing ones unchanged). The formatter adds three small bounded helpers used inside `formatAuthors` and `crossrefToApa`. Verification is free: re-grade the saved post-fix results JSON.

**Tech Stack:** TypeScript (ESM), Node 25 built-in test runner via `tsx`. Run a single test with `node --import tsx --test "<path>"`; full suite `npm test`. Imports use `.js` extensions.

**Spec:** `docs/superpowers/specs/2026-05-27-eval-fidelity-design.md`
**Branch:** `eval-fidelity` (already checked out — commit here).

> **Scope adjustment from the spec (decided during plan-writing):** the journal ALL-CAPS title-case fix uses a *conservative heuristic* (only multi-word all-caps strings containing at least one word longer than 4 characters get title-cased) so that legitimately-all-caps acronym journals like `PLOS ONE`, `JAMA`, `BMJ` are left alone. The other two formatter fixes (author surname, volume prefix) are unconditional.

---

## Conventions

- The existing `gradeItem` test file uses a `run(status, corrected?)` helper that returns `{ result: { original: 'r', status, corrected }, latencyMs: 100, usage: { promptTokens: 1, candidatesTokens: 1, totalTokens: 50 } }`. Reuse it.
- Use real en-dash `–` (U+2013) characters where shown.
- After each TDD task, run `npm test` to confirm the full suite stays green (currently 47 tests on `main`).

---

## Task 1: Grading reframe (`types.ts` + `grade.ts`)

**Files:**
- Modify: `eval/types.ts`
- Modify: `eval/grade.ts`
- Modify: `eval/grade.test.ts`

- [ ] **Step 1: Add failing tests**

In `eval/grade.test.ts`, append (uses the existing `run` helper already defined in that file):

```ts
test('gradeItem sets existenceCorrect for verified->verified and verified->corrected', () => {
  const item: TestItem = { id: 'v0', reference: 'r', truth: 'verified' };
  assert.equal(gradeItem(item, run('verified')).existenceCorrect, true);
  assert.equal(gradeItem(item, run('corrected')).existenceCorrect, true);
  assert.equal(gradeItem(item, run('hallucinated')).existenceCorrect, false);
  assert.equal(gradeItem(item, run('unknown')).existenceCorrect, false);
});

test('existenceCorrect equals strict for corrected and hallucinated truth', () => {
  const c: TestItem = { id: 'c0', reference: 'r', truth: 'corrected' };
  assert.equal(gradeItem(c, run('corrected')).existenceCorrect, true);
  assert.equal(gradeItem(c, run('verified')).existenceCorrect, false);    // missed the defect
  assert.equal(gradeItem(c, run('hallucinated')).existenceCorrect, false);

  const h: TestItem = { id: 'h0', reference: 'r', truth: 'hallucinated' };
  assert.equal(gradeItem(h, run('hallucinated')).existenceCorrect, true);
  assert.equal(gradeItem(h, run('verified')).existenceCorrect, false);
});

test('buildModelReport computes overallExistenceAccuracy and verifiedExistenceAccuracy', () => {
  const items = [
    gradeItem({ id: 'v0', reference: 'r', truth: 'verified' }, run('verified')),     // strict ✓ exist ✓
    gradeItem({ id: 'v1', reference: 'r', truth: 'verified' }, run('corrected')),    // strict ✗ exist ✓
    gradeItem({ id: 'v2', reference: 'r', truth: 'verified' }, run('hallucinated')), // strict ✗ exist ✗
    gradeItem({ id: 'h0', reference: 'r', truth: 'hallucinated' }, run('hallucinated')), // strict ✓ exist ✓
  ];
  const rep = buildModelReport('m', items);
  assert.equal(rep.overallAccuracy, 2 / 4);            // strict: v0, h0
  assert.equal(rep.overallExistenceAccuracy, 3 / 4);   // existence: v0, v1, h0
  assert.equal(rep.verifiedExistenceAccuracy, 2 / 3);  // v0, v1 out of 3 verified
  assert.equal(rep.existenceCorrectCount, 3);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --import tsx --test "eval/grade.test.ts"`
Expected: FAIL — `existenceCorrect` and the new `ModelReport` fields don't exist yet (TypeScript errors / property-undefined assertion failures).

- [ ] **Step 3: Add the new fields to `eval/types.ts`**

In `ItemResult`, add this field after `correct`:

```ts
  existenceCorrect: boolean;
```

In `ModelReport`, add these three fields (place after `correctCount` and `overallAccuracy`):

```ts
  existenceCorrectCount: number;
  overallExistenceAccuracy: number;
  verifiedExistenceAccuracy: number;
```

So `ModelReport` now includes `model`, `total`, `correctCount`, `existenceCorrectCount`, `overallAccuracy`, `overallExistenceAccuracy`, `verifiedExistenceAccuracy`, then the existing `perClass`, `confusion`, etc.

- [ ] **Step 4: Update `gradeItem` and `buildModelReport` in `eval/grade.ts`**

Replace the `gradeItem` function with:

```ts
export function gradeItem(item: TestItem, run: RunResult): ItemResult {
  const predicted = run.result.status;
  const correct = predicted === item.truth;
  const res: ItemResult = {
    itemId: item.id,
    truth: item.truth,
    brokenField: item.brokenField,
    predictedStatus: predicted,
    correct,
    existenceCorrect: correct || (item.truth === 'verified' && predicted === 'corrected'),
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
```

Replace the `buildModelReport` function with:

```ts
export function buildModelReport(model: string, items: ItemResult[]): ModelReport {
  const perClass = Object.fromEntries(TRUTHS.map(t => [t, { total: 0, correct: 0, accuracy: 0 }])) as ModelReport['perClass'];
  const confusion = Object.fromEntries(
    TRUTHS.map(t => [t, Object.fromEntries(STATUSES.map(s => [s, 0]))]),
  ) as ModelReport['confusion'];

  let correctCount = 0, existenceCorrectCount = 0, verifiedExistenceCorrect = 0;
  let unknownCount = 0, falseAccusations = 0, misses = 0;
  let totalTokens = 0, latencySum = 0, correctedPredictedCount = 0, fixRestoredCount = 0;

  for (const it of items) {
    perClass[it.truth].total++;
    confusion[it.truth][it.predictedStatus]++;
    if (it.correct) { correctCount++; perClass[it.truth].correct++; }
    if (it.existenceCorrect) existenceCorrectCount++;
    if (it.truth === 'verified' && it.existenceCorrect) verifiedExistenceCorrect++;
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
    model, total: items.length, correctCount, existenceCorrectCount,
    overallAccuracy: items.length ? correctCount / items.length : 0,
    overallExistenceAccuracy: items.length ? existenceCorrectCount / items.length : 0,
    verifiedExistenceAccuracy: perClass.verified.total ? verifiedExistenceCorrect / perClass.verified.total : 0,
    perClass, confusion, falseAccusations, misses, unknownCount,
    correctedPredictedCount, fixRestoredCount,
    fixRestoredRate: correctedPredictedCount ? fixRestoredCount / correctedPredictedCount : 0,
    avgLatencyMs: items.length ? latencySum / items.length : 0,
    totalTokens, items,
  };
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `node --import tsx --test "eval/grade.test.ts"`
Expected: PASS — all tests, including the three new ones.
Run: `npm test`
Expected: full suite still green. (Note: `report.ts`'s render functions still reference only the old `ModelReport` fields, which is fine because the new fields are additive — `report.test.ts` should still pass. We update the rendering in Task 3.)
Run: `npm run build`
Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add eval/types.ts eval/grade.ts eval/grade.test.ts
git commit -m "Add existence scoring to grader: verified+corrected counts as recognized real"
```

---

## Task 2: Formatter cleanup (`apa.ts`)

**Files:**
- Modify: `eval/apa.ts`
- Modify: `eval/apa.test.ts`

Three exported helpers, with the journal one using the conservative heuristic.

- [ ] **Step 1: Add failing tests**

Append to `eval/apa.test.ts`:

```ts
test('titleCaseSurname converts ALL-CAPS surnames and leaves mixed case alone', () => {
  assert.equal(titleCaseSurname('MORRIS'), 'Morris');
  assert.equal(titleCaseSurname('VAN DER BERG'), 'Van Der Berg');
  assert.equal(titleCaseSurname('SMITH-JONES'), 'Smith-Jones');
  assert.equal(titleCaseSurname('Morris'), 'Morris');
  assert.equal(titleCaseSurname('McDonald'), 'McDonald');
});

test('titleCaseJournal title-cases long all-caps names but leaves acronym journals alone', () => {
  assert.equal(titleCaseJournal('JOURNAL OF APPLIED ECOLOGY'), 'Journal of Applied Ecology');
  assert.equal(titleCaseJournal('PLOS ONE'), 'PLOS ONE');               // all tokens <=4 chars → untouched
  assert.equal(titleCaseJournal('JAMA'), 'JAMA');                       // single token → untouched
  assert.equal(titleCaseJournal('BMJ'), 'BMJ');
  assert.equal(titleCaseJournal('Journal of Applied Ecology'), 'Journal of Applied Ecology'); // already mixed
});

test('cleanVolume strips No/Vol prefixes', () => {
  assert.equal(cleanVolume('No 26'), '26');
  assert.equal(cleanVolume('No. 26'), '26');
  assert.equal(cleanVolume('Vol 8'), '8');
  assert.equal(cleanVolume('Vol. 8'), '8');
  assert.equal(cleanVolume('vol 12'), '12');
  assert.equal(cleanVolume('26'), '26');
  assert.equal(cleanVolume(undefined), undefined);
});

test('crossrefToApa applies the formatter cleanups end-to-end', () => {
  const dirty: CrossrefWork = {
    DOI: '10.1/x',
    title: ['A study of things'],
    author: [{ family: 'MORRIS', given: 'A.' }, { family: 'Lee', given: 'Bo' }],
    'container-title': ['JOURNAL OF APPLIED ECOLOGY'],
    volume: 'No 26',
    issue: '1',
    page: '40-52',
    published: { 'date-parts': [[2021]] },
  };
  assert.equal(
    crossrefToApa(dirty),
    'Morris, A., & Lee, B. (2021). A study of things. *Journal of Applied Ecology*, *26*(1), 40–52. https://doi.org/10.1/x'
  );
});
```

Add `titleCaseSurname, titleCaseJournal, cleanVolume` to the existing import from `./apa.js` at the top of the test file.

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --import tsx --test "eval/apa.test.ts"`
Expected: FAIL — the three helpers don't exist.

- [ ] **Step 3: Add the helpers to `eval/apa.ts`**

Insert near the other helpers (after `decodeEntities`, before `crossrefToApa`):

```ts
const JOURNAL_MINOR_WORDS = new Set([
  'a','an','and','as','at','but','by','for','in','of','on','or','the','to','vs',
]);

export function titleCaseSurname(family: string): string {
  // Only transform when the WHOLE surname is uppercase letters (and separators).
  // Mixed-case names ('Morris', 'McDonald') are returned unchanged.
  if (!/^[\p{Lu}][\p{Lu} '\-]*$/u.test(family)) return family;
  return family.toLowerCase().replace(/(^|[\s'\-])(\p{Ll})/gu, (_m, sep, ch) => sep + (ch as string).toUpperCase());
}

export function titleCaseJournal(journal: string): string {
  // Conservative heuristic: title-case only when the journal is ALL CAPS AND
  // multi-word AND contains at least one token longer than 4 characters.
  // Leaves acronym journals (PLOS ONE, JAMA, BMJ) alone.
  if (/\p{Ll}/u.test(journal)) return journal;                          // not all-caps → leave
  const tokens = journal.trim().split(/\s+/).filter(Boolean);
  if (tokens.length < 2) return journal;                                // single token → leave
  if (!tokens.some(t => t.length > 4)) return journal;                  // all short → leave
  return tokens.map((t, i) => {
    const lower = t.toLowerCase();
    if (i > 0 && JOURNAL_MINOR_WORDS.has(lower)) return lower;
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }).join(' ');
}

export function cleanVolume(volume: string | undefined): string | undefined {
  if (volume === undefined) return undefined;
  return volume.replace(/^\s*(?:no|vol)\.?\s+/i, '').trim();
}
```

Apply them. In `formatAuthors`, replace the `.map(...)` callback so the family name is title-cased:

```ts
export function formatAuthors(authors: CrossrefAuthor[]): string {
  const names = authors.filter(a => a.family).map(a => {
    const fam = titleCaseSurname(a.family as string);
    return a.given ? `${fam}, ${initials(a.given)}` : fam;
  });
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  if (names.length <= 20) return names.slice(0, -1).join(', ') + ', & ' + names[names.length - 1];
  return names.slice(0, 19).join(', ') + ', . . . ' + names[names.length - 1]; // APA 21+ authors
}
```

In `crossrefToApa`, apply `titleCaseJournal` to the decoded journal and `cleanVolume` to the volume. Replace the relevant lines (`journal`, the `volPart` construction):

```ts
  const journal = titleCaseJournal(decodeEntities((work['container-title']?.[0] || '').trim()));
  const volume = cleanVolume(work.volume);
  const pages = formatPages(work.page);
  let volPart = volume ? `*${volume}*` : '';
  if (volume && work.issue) volPart = `*${volume}*(${work.issue})`;
```

(Leave the rest of `crossrefToApa` — `title`, `tail`, `body` — unchanged.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --import tsx --test "eval/apa.test.ts"`
Expected: PASS — including the four new tests. The existing `crossrefToApa renders a journal article with markdown italics` test must still pass (its sample has `Smith`/`Lee` surnames in mixed case, `Journal of Examples` mixed case, `18` plain volume — all untouched by the new helpers).
Run: `npm test`
Expected: full suite green.
Run: `npm run build`
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add eval/apa.ts eval/apa.test.ts
git commit -m "apa.ts: title-case ALL-CAPS surnames, strip No/Vol volume prefixes, conservative journal casing"
```

---

## Task 3: Report (`report.ts`)

**Files:**
- Modify: `eval/report.ts`
- Modify: `eval/report.test.ts`

Add an existence column to the summary table and an existence bullet to the per-model section.

- [ ] **Step 1: Update tests**

In `eval/report.test.ts`, update the sample `ModelReport` literal to include the new fields. Find the existing:

```ts
const rep: ModelReport = {
  model: 'gemini-x', total: 2, correctCount: 1, overallAccuracy: 0.5,
  perClass: { ... },
  ...
};
```

Replace it with (adds `existenceCorrectCount: 1`, `overallExistenceAccuracy: 0.5`, `verifiedExistenceAccuracy: 1`, and the existing `items` entry gets `existenceCorrect: false`):

```ts
const rep: ModelReport = {
  model: 'gemini-x', total: 2, correctCount: 1, existenceCorrectCount: 1,
  overallAccuracy: 0.5, overallExistenceAccuracy: 0.5, verifiedExistenceAccuracy: 1,
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
    { itemId: 'h0', truth: 'hallucinated', predictedStatus: 'verified', correct: false, existenceCorrect: false, latencyMs: 120, totalTokens: 50, reference: 'fake ref', corrected: 'x', notes: 'looks real' },
  ],
};
```

Update the existing `renderConsoleTable includes the model and overall accuracy` test to assert both overall columns:

```ts
test('renderConsoleTable includes both overall scores and verified existence', () => {
  const out = renderConsoleTable([rep]);
  assert.match(out, /gemini-x/);
  assert.match(out, /overall\(exist\)/);
  assert.match(out, /overall\(strict\)/);
  assert.match(out, /verified\(exist\)/);
});
```

Add one new test:

```ts
test('renderMarkdown includes the existence recognition bullet', () => {
  const md = renderMarkdown([rep]);
  assert.match(md, /Existence recognition/);
});
```

The existing `renderMarkdown includes a disagreement appendix entry for wrong items` test should stay (it asserts `h0` and `fake ref` appear).

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --import tsx --test "eval/report.test.ts"`
Expected: FAIL — the renderer doesn't yet output the new columns/bullet.

- [ ] **Step 3: Update the renderer in `eval/report.ts`**

Replace `renderConsoleTable` with (expands the header and rows to include existence columns):

```ts
export function renderConsoleTable(reports: ModelReport[]): string {
  const header = [
    'model',
    'overall(exist)', 'overall(strict)',
    'verified(exist)', 'verified(strict)',
    'corrected', 'hallucinated',
    'fix✓(approx)', 'unknown', 'false-acc', 'misses', 'avg-lat', 'tokens',
  ];
  const rows = reports.map(r => [
    r.model,
    pct(r.overallExistenceAccuracy), pct(r.overallAccuracy),
    pct(r.verifiedExistenceAccuracy), pct(r.perClass.verified.accuracy),
    pct(r.perClass.corrected.accuracy), pct(r.perClass.hallucinated.accuracy),
    pct(r.fixRestoredRate), String(r.unknownCount), String(r.falseAccusations), String(r.misses),
    Math.round(r.avgLatencyMs) + 'ms', String(r.totalTokens),
  ]);
  return renderTable(header, rows);
}
```

In `renderMarkdown`, insert one bullet right after the `Overall accuracy` bullet. Find:

```ts
    lines.push(`- Overall accuracy: **${pct(r.overallAccuracy)}** (${r.correctCount}/${r.total})`);
```

Replace with:

```ts
    lines.push(`- Overall accuracy (strict): **${pct(r.overallAccuracy)}** (${r.correctCount}/${r.total})`);
    lines.push(`- Existence recognition (verified or corrected on real sources): **${pct(r.overallExistenceAccuracy)}** (${r.existenceCorrectCount}/${r.total})`);
```

Leave the rest of `renderMarkdown` (confusion matrix, disagreement appendix) unchanged.

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --import tsx --test "eval/report.test.ts"`
Expected: PASS.
Run: `npm test`
Expected: full suite green.
Run: `npm run build`
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add eval/report.ts eval/report.test.ts
git commit -m "Report both existence and strict scores in the summary table and markdown"
```

---

## Task 4: Free re-grade verification (no API spend)

**Files:** none changed. Just produces output to confirm the existence score lifts the headline as expected.

The grading reframe operates on already-saved verdicts (`truth` + `predictedStatus`), so we can demonstrate its effect on the existing post-fix results JSON without re-calling Gemini.

- [ ] **Step 1: Confirm the post-fix results JSON is on disk**

Run:
```bash
ls eval/results-*.json 2>/dev/null | tail -3
```
Expected: at least one file (the post-JSON-fix run from `2026-05-27`). If empty (gitignored and missing locally), the spec snapshot at `docs/superpowers/results/2026-05-27-eval-post-jsonfix.md` confirms the data we expect — proceed anyway, noting the re-grade demonstration was skipped.

- [ ] **Step 2: Compute the existence overall from saved verdicts (free)**

Run this Python snippet:

```bash
python3 -c "
import json, glob, os
f = sorted(glob.glob('eval/results-*.json'), key=os.path.getmtime)[-1]
data = json.load(open(f))
print('source:', os.path.basename(f))
for rep in data:
    total = rep['total']
    strict = rep['correctCount']
    existence = sum(1 for it in rep['items'] if it['predictedStatus']==it['truth'] or (it['truth']=='verified' and it['predictedStatus']=='corrected'))
    vt = sum(1 for it in rep['items'] if it['truth']=='verified')
    ve = sum(1 for it in rep['items'] if it['truth']=='verified' and it['predictedStatus'] in ('verified','corrected'))
    print(f\"  {rep['model']:30s}  overall(strict)={strict/total*100:5.1f}%  overall(exist)={existence/total*100:5.1f}%  verified(strict)={rep['perClass']['verified']['accuracy']*100:5.1f}%  verified(exist)={ve/vt*100:5.1f}%\")
"
```

Expected: both models' existence-overall is substantially higher than strict-overall (~+15–20 points), and the verified-existence accuracy is in the high 80s–90s for both. This is the demonstration that the grading reframe meaningfully de-noises the headline.

Report the numbers in plain prose for the conversation. Do not commit the snippet output anywhere — it's a verification, not an artifact.

- [ ] **Step 3 (optional, gated): fresh paid rerun**

Do NOT run this without explicit human go-ahead in the conversation. If approved, run `npm run eval` (~16 min, ~$0.30–0.60) on the committed 60-item answer key to observe the *strict* score improve on the cleaner answer key (the formatter cleanup's effect). Save the snapshot to `docs/superpowers/results/2026-05-28-eval-post-fidelity.md` and commit.

---

## Self-review notes (author check, not a task)

- **Spec coverage:** grading reframe — `existenceCorrect` per item (Task 1 Step 4) ✓; new `ModelReport` fields `existenceCorrectCount`/`overallExistenceAccuracy`/`verifiedExistenceAccuracy` (Task 1 Steps 3–4) ✓; semantics — verified→verified|corrected counts existence-correct, corrected/hallucinated unchanged from strict (Task 1 Steps 1, 4) ✓; report shows both overalls and verified-existence column + markdown existence bullet (Task 3) ✓; disagreement appendix unchanged (Task 3 leaves the appendix code) ✓; formatter — `titleCaseSurname` for ALL-CAPS author surnames with conservative regex (Task 2 Step 3) ✓; `cleanVolume` strips No/Vol prefixes (Task 2 Step 3) ✓; `titleCaseJournal` with conservative heuristic protecting PLOS ONE/JAMA (Task 2 Step 3, scope adjusted from spec) ✓; tests for all of it (Tasks 1–3 Steps 1) ✓; free verification re-grading the saved JSON (Task 4) ✓; paid rerun optional/gated (Task 4 Step 3) ✓.
- **Placeholder scan:** none — every step has complete content (code blocks, exact commands, expected outputs).
- **Type consistency:** `existenceCorrect`, `existenceCorrectCount`, `overallExistenceAccuracy`, `verifiedExistenceAccuracy`, `titleCaseSurname`, `titleCaseJournal`, `cleanVolume`, `JOURNAL_MINOR_WORDS` are used consistently across tasks. `CrossrefAuthor`/`CrossrefWork` already exist. The `run` helper in `grade.test.ts` already exists and is reused (not redefined).
