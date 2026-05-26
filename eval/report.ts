import fs from 'node:fs';
import path from 'node:path';
import type { ModelReport, Truth } from './types.js';
import type { VerificationResult } from '../src/services/geminiCore.js';

const TRUTHS: Truth[] = ['verified', 'corrected', 'hallucinated'];
const STATUSES: VerificationResult['status'][] = ['verified', 'corrected', 'hallucinated', 'unknown'];

function pct(x: number): string { return (x * 100).toFixed(1) + '%'; }

export function renderTable(header: string[], rows: string[][]): string {
  const widths = header.map((h, i) => Math.max(h.length, ...rows.map(r => (r[i] || '').length)));
  const line = (cells: string[]) => '| ' + cells.map((c, i) => (c || '').padEnd(widths[i])).join(' | ') + ' |';
  const sep = '|' + widths.map(w => '-'.repeat(w + 2)).join('|') + '|';
  return [line(header), sep, ...rows.map(line)].join('\n');
}

export function renderConsoleTable(reports: ModelReport[]): string {
  const header = ['model', 'overall', 'verified', 'corrected', 'hallucinated', 'fix✓(approx)', 'unknown', 'false-acc', 'misses', 'avg-lat', 'tokens'];
  const rows = reports.map(r => [
    r.model, pct(r.overallAccuracy),
    pct(r.perClass.verified.accuracy), pct(r.perClass.corrected.accuracy), pct(r.perClass.hallucinated.accuracy),
    pct(r.fixRestoredRate), String(r.unknownCount), String(r.falseAccusations), String(r.misses),
    Math.round(r.avgLatencyMs) + 'ms', String(r.totalTokens),
  ]);
  return renderTable(header, rows);
}

function renderConfusion(r: ModelReport): string {
  const header = ['truth \\ predicted', ...STATUSES];
  const rows = TRUTHS.map(t => [t, ...STATUSES.map(s => String(r.confusion[t][s]))]);
  return renderTable(header, rows);
}

export function renderMarkdown(reports: ModelReport[]): string {
  const lines: string[] = [];
  lines.push('# Model A/B Accuracy Report', '');
  lines.push(`_Generated ${new Date().toISOString()}_`, '');
  lines.push('## Summary', '', renderConsoleTable(reports), '');
  for (const r of reports) {
    lines.push(`## ${r.model}`, '');
    lines.push(`- Overall accuracy: **${pct(r.overallAccuracy)}** (${r.correctCount}/${r.total})`);
    lines.push(`- False accusations (real → flagged fake): **${r.falseAccusations}**`);
    lines.push(`- Misses (fake → passed as verified): **${r.misses}**`);
    lines.push(`- Fix restored (approx, among corrected-caught): ${r.fixRestoredCount}/${r.correctedPredictedCount}`);
    lines.push(`- Unknown/failed verdicts: ${r.unknownCount}`, '');
    lines.push('### Confusion matrix', '', renderConfusion(r), '');
    const wrong = r.items.filter(it => !it.correct);
    lines.push(`### Disagreements with truth (${wrong.length})`, '');
    for (const it of wrong) {
      lines.push(`- **${it.itemId}** truth=\`${it.truth}\` predicted=\`${it.predictedStatus}\``);
      lines.push(`  - ref: ${it.reference}`);
      if (it.corrected) lines.push(`  - model correction: ${it.corrected}`);
      if (it.notes) lines.push(`  - notes: ${it.notes}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

export function writeReport(reports: ModelReport[], dir: string): { mdPath: string; jsonPath: string } {
  fs.mkdirSync(dir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(dir, `results-${ts}.json`);
  const mdPath = path.join(dir, 'report.md');
  fs.writeFileSync(jsonPath, JSON.stringify(reports, null, 2));
  fs.writeFileSync(mdPath, renderMarkdown(reports));
  return { mdPath, jsonPath };
}
