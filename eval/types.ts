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
  existenceCorrect: boolean;
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
  existenceCorrectCount: number;
  overallAccuracy: number;
  overallExistenceAccuracy: number;
  verifiedExistenceAccuracy: number;
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
