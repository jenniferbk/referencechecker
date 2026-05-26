import type { BrokenField } from './types.js';

export const BROKEN_FIELDS: readonly BrokenField[] = ['year', 'italics', 'volume', 'author', 'pages'];

function corruptYear(apa: string): string {
  return apa.replace(/\((\d{4})\)/, (_m, y) => `(${parseInt(y, 10) + 2})`);
}
function corruptItalics(apa: string): string {
  return apa.replace(/\*/g, '');
}
function corruptVolume(apa: string): string {
  return apa.replace(/\*(\d+)\*/, (_m, v) => `*${parseInt(v, 10) + 7}*`);
}
function corruptAuthor(apa: string): string {
  // swap the first two letters of the leading surname (clear misspelling)
  return apa.replace(/^([A-Za-z])([A-Za-z])/, (_m, a, b) => `${b}${a}`);
}
function corruptPages(apa: string): string {
  // replace the page segment that sits just before the DOI
  return apa.replace(/,\s*[\d–-]+\.\s*https/, ', 9999. https');
}

export function corruptItem(apa: string, field: BrokenField): string {
  switch (field) {
    case 'year': return corruptYear(apa);
    case 'italics': return corruptItalics(apa);
    case 'volume': return corruptVolume(apa);
    case 'author': return corruptAuthor(apa);
    case 'pages': return corruptPages(apa);
  }
}
