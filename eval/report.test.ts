import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderTable, renderConsoleTable, renderMarkdown } from './report.js';
import type { ModelReport } from './types.js';

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

test('renderTable aligns columns', () => {
  const out = renderTable(['a', 'bb'], [['1', '2'], ['333', '4']]);
  assert.match(out, /\| a   \| bb \|/);
});

test('renderConsoleTable includes both overall scores and verified existence', () => {
  const out = renderConsoleTable([rep]);
  assert.match(out, /gemini-x/);
  assert.match(out, /overall\(exist\)/);
  assert.match(out, /overall\(strict\)/);
  assert.match(out, /verified\(exist\)/);
});

test('renderMarkdown includes a disagreement appendix entry for wrong items', () => {
  const md = renderMarkdown([rep]);
  assert.match(md, /# Model A\/B Accuracy Report/);
  assert.match(md, /h0/);          // the mis-graded item id
  assert.match(md, /fake ref/);    // its reference text appears for eyeballing
});

test('renderMarkdown includes the existence recognition bullet', () => {
  const md = renderMarkdown([rep]);
  assert.match(md, /Existence recognition/);
});
