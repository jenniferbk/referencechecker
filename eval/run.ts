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

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(e => { console.error(e); process.exit(1); });
}
