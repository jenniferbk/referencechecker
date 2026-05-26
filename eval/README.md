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

Requires `GEMINI_API_KEY` in `.env` (or the shell environment). Calls use real
API quota/money (not user credits). Set `GEMINI_MIN_DELAY_MS` to control the
rate-limiter delay (default 8000ms; lower it for faster local runs).

## What it measures

- **Primary:** 3-class status accuracy (verified / corrected / hallucinated),
  with a confusion matrix and two named error types — false accusations
  (real ref flagged fake) and misses (fake ref passed as verified).
- **Secondary (approximate):** whether a "corrected" verdict actually restored
  the broken field.

## Adding a model

Edit `MODELS` in `eval/run.ts`. Add `gemini-3.5-pro` once Google publishes its ID.

## Files

- `build-testset.ts` — CrossRef -> `testset.json`
- `apa.ts` — CrossRef -> APA 7th journal-article formatter
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
