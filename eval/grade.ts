import type { TestItem, ItemResult, ModelReport, Truth } from './types.js';
import type { RunResult, VerificationResult } from '../src/services/geminiCore.js';

const TRUTHS: Truth[] = ['verified', 'corrected', 'hallucinated'];
const STATUSES: VerificationResult['status'][] = ['verified', 'corrected', 'hallucinated', 'unknown'];

function normalize(s: string): string {
  return (s || '').toLowerCase().replace(/[*]/g, '').replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim();
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
      return m ? new RegExp(`\\b${m[1]}\\b\\s*[(,]`).test(fixed) : false;
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
