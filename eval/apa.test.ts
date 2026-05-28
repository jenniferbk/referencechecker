import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  initials, formatAuthors, getYear, formatPages,
  crossrefToApa, isComplete, isSentenceCaseLike, type CrossrefWork,
  titleCaseSurname, titleCaseJournal, cleanVolume,
} from './apa.js';

test('initials reduces given names to spaced initials', () => {
  assert.equal(initials('Olga N.'), 'O. N.');
  assert.equal(initials('O.N.'), 'O. N.');
  assert.equal(initials('Jennifer'), 'J.');
});

test('formatAuthors handles 1, 2, and 3 authors', () => {
  assert.equal(formatAuthors([{ family: 'Smith', given: 'Jane' }]), 'Smith, J.');
  assert.equal(formatAuthors([{ family: 'Smith', given: 'Jane' }, { family: 'Lee', given: 'Bo' }]), 'Smith, J., & Lee, B.');
  assert.equal(
    formatAuthors([{ family: 'A', given: 'X' }, { family: 'B', given: 'Y' }, { family: 'C', given: 'Z' }]),
    'A, X., B, Y., & C, Z.'
  );
});

test('getYear reads published then issued', () => {
  assert.equal(getYear({ published: { 'date-parts': [[2021, 5]] } } as CrossrefWork), 2021);
  assert.equal(getYear({ issued: { 'date-parts': [[2019]] } } as CrossrefWork), 2019);
});

test('formatPages converts hyphen ranges to en dash', () => {
  assert.equal(formatPages('40-52'), '40–52');
  assert.equal(formatPages('40'), '40');
});

const sample: CrossrefWork = {
  DOI: '10.1000/abc',
  title: ['A study of things'],
  author: [{ family: 'Smith', given: 'Jane' }, { family: 'Lee', given: 'Bo' }],
  'container-title': ['Journal of Examples'],
  volume: '18',
  issue: '1',
  page: '40-52',
  published: { 'date-parts': [[2021, 3, 1]] },
};

test('crossrefToApa renders a journal article with markdown italics', () => {
  const out = crossrefToApa(sample);
  assert.equal(
    out,
    'Smith, J., & Lee, B. (2021). A study of things. *Journal of Examples*, *18*(1), 40–52. https://doi.org/10.1000/abc'
  );
});

test('crossrefToApa uses n.d. when year is missing', () => {
  const noYear = { ...sample, published: undefined, issued: undefined } as CrossrefWork;
  const out = crossrefToApa(noYear);
  assert.match(out, /\(n\.d\.\)/);
  assert.doesNotMatch(out, /undefined/);
});

test('crossrefToApa decodes HTML entities in title and journal', () => {
  const w = { ...sample, title: ['Sharks &amp; rays'], 'container-title': ['Maritime &amp; Ocean Affairs'] } as CrossrefWork;
  const out = crossrefToApa(w);
  assert.doesNotMatch(out, /&amp;/);
  assert.match(out, /Sharks & rays/);
  assert.match(out, /\*Maritime & Ocean Affairs\*/);
});

test('isComplete rejects works missing required fields', () => {
  assert.equal(isComplete(sample), true);
  assert.equal(isComplete({ ...sample, volume: undefined }), false);
});

test('isSentenceCaseLike distinguishes title case from sentence case', () => {
  assert.equal(isSentenceCaseLike('A study of neural things'), true);
  assert.equal(isSentenceCaseLike('A Study Of Neural Things In The Brain'), false);
});

test('titleCaseSurname converts ALL-CAPS surnames and leaves mixed case alone', () => {
  assert.equal(titleCaseSurname('MORRIS'), 'Morris');
  assert.equal(titleCaseSurname('VAN DER BERG'), 'Van Der Berg');
  assert.equal(titleCaseSurname('SMITH-JONES'), 'Smith-Jones');
  assert.equal(titleCaseSurname('Morris'), 'Morris');
  assert.equal(titleCaseSurname('McDonald'), 'McDonald');
});

test('titleCaseJournal title-cases long all-caps names but leaves acronym journals alone', () => {
  assert.equal(titleCaseJournal('JOURNAL OF APPLIED ECOLOGY'), 'Journal of Applied Ecology');
  assert.equal(titleCaseJournal('PLOS ONE'), 'PLOS ONE');
  assert.equal(titleCaseJournal('JAMA'), 'JAMA');
  assert.equal(titleCaseJournal('BMJ'), 'BMJ');
  assert.equal(titleCaseJournal('Journal of Applied Ecology'), 'Journal of Applied Ecology');
});

test('cleanVolume strips No/Vol prefixes', () => {
  assert.equal(cleanVolume('No 26'), '26');
  assert.equal(cleanVolume('No. 26'), '26');
  assert.equal(cleanVolume('Vol 8'), '8');
  assert.equal(cleanVolume('Vol. 8'), '8');
  assert.equal(cleanVolume('vol 12'), '12');
  assert.equal(cleanVolume('26'), '26');
  assert.equal(cleanVolume(undefined), undefined);
});

test('crossrefToApa applies the formatter cleanups end-to-end', () => {
  const dirty: CrossrefWork = {
    DOI: '10.1/x',
    title: ['A study of things'],
    author: [{ family: 'MORRIS', given: 'A.' }, { family: 'Lee', given: 'Bo' }],
    'container-title': ['JOURNAL OF APPLIED ECOLOGY'],
    volume: 'No 26',
    issue: '1',
    page: '40-52',
    published: { 'date-parts': [[2021]] },
  };
  assert.equal(
    crossrefToApa(dirty),
    'Morris, A., & Lee, B. (2021). A study of things. *Journal of Applied Ecology*, *26*(1), 40–52. https://doi.org/10.1/x'
  );
});
