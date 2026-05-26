import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gradeItem, buildModelReport, fixRestored } from './grade.js';
import type { TestItem } from './types.js';

const correctApa = 'Smith, J. (2021). A study. *Journal of Examples*, *18*(1), 40–52. https://doi.org/10.1/x';

function run(status: string, corrected?: string) {
  return { result: { original: 'r', status: status as any, corrected }, latencyMs: 100, usage: { promptTokens: 1, candidatesTokens: 1, totalTokens: 50 } };
}

test('gradeItem marks correct when status matches truth', () => {
  const item: TestItem = { id: 'v0', reference: 'r', truth: 'verified' };
  assert.equal(gradeItem(item, run('verified')).correct, true);
  assert.equal(gradeItem(item, run('hallucinated')).correct, false);
});

test('fixRestored detects a restored year', () => {
  const item: TestItem = { id: 'c0', reference: 'bad', truth: 'corrected', brokenField: 'year', correctReference: correctApa };
  assert.equal(fixRestored(item, 'Smith, J. (2021). A study. *Journal of Examples*, *18*(1), 40–52.'), true);
  assert.equal(fixRestored(item, 'Smith, J. (2099). still wrong'), false);
});

test('fixRestored detects re-added italics', () => {
  const item: TestItem = { id: 'c1', reference: 'bad', truth: 'corrected', brokenField: 'italics', correctReference: correctApa };
  assert.equal(fixRestored(item, 'Smith, J. (2021). A study. *Journal of Examples*, *18*(1), 40-52.'), true);
  assert.equal(fixRestored(item, 'Smith, J. (2021). A study. Journal of Examples, 18(1), 40-52.'), false);
});

test('gradeItem sets fixRestored only for corrected-predicted corrected items', () => {
  const item: TestItem = { id: 'c0', reference: 'bad', truth: 'corrected', brokenField: 'year', correctReference: correctApa };
  assert.equal(gradeItem(item, run('corrected', correctApa)).fixRestored, true);
  assert.equal(gradeItem(item, run('verified', correctApa)).fixRestored, false);
});

test('fixRestored detects a restored volume and ignores issue/page coincidences', () => {
  const item: TestItem = { id: 'c2', reference: 'bad', truth: 'corrected', brokenField: 'volume', correctReference: correctApa };
  assert.equal(fixRestored(item, 'Smith, J. (2021). A study. *Journal of Examples*, *18*(1), 40–52.'), true);
  assert.equal(fixRestored(item, 'Smith, J. (2021). A study. *Journal of Examples*, *25*(3), 18–22.'), false);
});

test('fixRestored pages accepts hyphen or en-dash from the model', () => {
  const item: TestItem = { id: 'c4', reference: 'bad', truth: 'corrected', brokenField: 'pages', correctReference: correctApa };
  assert.equal(fixRestored(item, 'Smith, J. (2021). A study. *Journal of Examples*, *18*(1), 40-52.'), true);
  assert.equal(fixRestored(item, 'Smith, J. (2021). A study. *Journal of Examples*, *18*(1), 40–52.'), true);
  assert.equal(fixRestored(item, 'Smith, J. (2021). A study. *Journal of Examples*, *18*(1), 99-100.'), false);
});

test('fixRestored author detects a restored surname', () => {
  const item: TestItem = { id: 'c3', reference: 'bad', truth: 'corrected', brokenField: 'author', correctReference: correctApa };
  assert.equal(fixRestored(item, 'Smith, J. (2021). A study. *Journal of Examples*, *18*(1), 40–52.'), true);
  assert.equal(fixRestored(item, 'Jones, J. (2021). A study. *Journal of Examples*, *18*(1), 40–52.'), false);
});

test('buildModelReport aggregates accuracy, confusion, false-accusations and misses', () => {
  const items = [
    gradeItem({ id: 'v0', reference: 'r', truth: 'verified' }, run('verified')),
    gradeItem({ id: 'v1', reference: 'r', truth: 'verified' }, run('hallucinated')), // false accusation
    gradeItem({ id: 'h0', reference: 'r', truth: 'hallucinated' }, run('verified')), // miss
    gradeItem({ id: 'h1', reference: 'r', truth: 'hallucinated' }, run('hallucinated')),
  ];
  const rep = buildModelReport('m', items);
  assert.equal(rep.total, 4);
  assert.equal(rep.correctCount, 2);
  assert.equal(rep.overallAccuracy, 0.5);
  assert.equal(rep.falseAccusations, 1);
  assert.equal(rep.misses, 1);
  assert.equal(rep.confusion.verified.hallucinated, 1);
  assert.equal(rep.perClass.verified.total, 2);
});
