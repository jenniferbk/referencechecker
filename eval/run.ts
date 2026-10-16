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

// Override with EVAL_MODELS=a,b,c. IDs confirmed against the live models list on 2026-10-16.
const DEFAULT_MODELS = ['gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-3.8-flash', 'gemini-4-argon', 'gemini-3.5-flash-lite'];
const MODELS = process.env.EVAL_MODELS ? process.env.EVAL_MODELS.split(',').map(m => m.trim()).filter(Boolean) : DEFAULT_MODELS;

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
  console.log(`Concurrency: ${process.env.GEMINI_MAX_CONCURRENCY || '6'} at a time.\n`);

  const reports: ModelReport[] = [];
  for (const model of MODELS) {
    console.log(`=== ${model} ===`);
    // Items run concurrently through the shared limiter (GEMINI_MAX_CONCURRENCY), the same
    // way production handles them; per-item latency is still measured individually.
    let done = 0;
    const results: ItemResult[] = await Promise.all(items.map(async item => {
      const run = await runVerification({ apiKey, model, reference: item.reference });
      const graded = gradeItem(item, run);
      done++;
      console.log(`  [${done}/${items.length}] ${item.id} ${item.truth} -> ${graded.predictedStatus} ${graded.correct ? '✓' : '✗'}`);
      return graded;
    }));
    reports.push(buildModelReport(model, results));
    console.log('');
  }

  console.log(renderConsoleTable(reports));
  const { mdPath, jsonPath } = writeReport(reports, __dirname);
  console.log(`\nReport:  ${mdPath}\nResults: ${jsonPath}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(e => { console.error(e); process.exit(1); });
}
