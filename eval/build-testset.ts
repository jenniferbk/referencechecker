import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchSample } from './crossref.js';
import { crossrefToApa, isComplete, isSentenceCaseLike, type CrossrefWork } from './apa.js';
import { corruptItem, BROKEN_FIELDS } from './corrupt.js';
import { makeFake } from './fake.js';
import type { TestItem } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'testset.json');

export async function buildTestset(verifiedN = 20, correctedN = 20, fakeN = 20): Promise<TestItem[]> {
  const need = verifiedN + correctedN;
  const works: CrossrefWork[] = [];

  let guard = 0;
  while (works.length < need && guard < 10) {
    guard++;
    const batch = await fetchSample(100);
    works.push(...batch.filter(isComplete));
  }
  if (works.length < need) throw new Error(`Only found ${works.length} complete works, need ${need}`);

  // Prefer sentence-case-like titles for the verified bucket (better APA-match validity).
  works.sort((a, b) => Number(isSentenceCaseLike(b.title[0])) - Number(isSentenceCaseLike(a.title[0])));

  const items: TestItem[] = [];
  works.slice(0, verifiedN).forEach((w, i) => {
    items.push({ id: `v${i}`, reference: crossrefToApa(w), truth: 'verified', doi: w.DOI });
  });
  works.slice(verifiedN, verifiedN + correctedN).forEach((w, i) => {
    const apa = crossrefToApa(w);
    const field = BROKEN_FIELDS[i % BROKEN_FIELDS.length];
    items.push({ id: `c${i}`, reference: corruptItem(apa, field), truth: 'corrected', doi: w.DOI, brokenField: field, correctReference: apa });
  });
  for (let i = 0; i < fakeN; i++) {
    const f = await makeFake(i);
    items.push({ id: `h${i}`, reference: f.reference, truth: 'hallucinated', doi: f.doi });
  }

  fs.writeFileSync(OUT, JSON.stringify(items, null, 2));
  console.log(`Wrote ${items.length} items to ${OUT} (verified=${verifiedN}, corrected=${correctedN}, hallucinated=${fakeN})`);
  return items;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const arg = parseInt(process.argv[2] || '', 10);
  const n = Number.isFinite(arg) && arg > 0 ? arg : 20;
  buildTestset(n, n, n).catch(e => { console.error(e); process.exit(1); });
}
