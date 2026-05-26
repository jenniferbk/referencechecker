import { test } from 'node:test';
import assert from 'node:assert/strict';
import { corruptItem, BROKEN_FIELDS } from './corrupt.js';

const apa = 'Smith, J., & Lee, B. (2021). A study of things. *Journal of Examples*, *18*(1), 40–52. https://doi.org/10.1000/abc';

test('BROKEN_FIELDS lists the five corruption types', () => {
  assert.deepEqual([...BROKEN_FIELDS].sort(), ['author', 'italics', 'pages', 'volume', 'year']);
});

test('corruptYear changes the year', () => {
  const out = corruptItem(apa, 'year');
  assert.notEqual(out, apa);
  assert.doesNotMatch(out, /\(2021\)/);
  assert.match(out, /\(20\d\d\)/);
});

test('corruptItalics removes all markdown asterisks', () => {
  const out = corruptItem(apa, 'italics');
  assert.doesNotMatch(out, /\*/);
});

test('corruptVolume changes the volume number', () => {
  const out = corruptItem(apa, 'volume');
  assert.notEqual(out, apa);
  assert.doesNotMatch(out, /\*18\*/);
});

test('corruptAuthor alters the first surname', () => {
  const out = corruptItem(apa, 'author');
  assert.notEqual(out, apa);
  assert.doesNotMatch(out, /^Smith/);
});

test('corruptPages changes the page numbers', () => {
  const out = corruptItem(apa, 'pages');
  assert.notEqual(out, apa);
  assert.doesNotMatch(out, /40–52/);
});
