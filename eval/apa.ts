export interface CrossrefAuthor { given?: string; family?: string; }
export interface CrossrefWork {
  DOI: string;
  title: string[];
  author?: CrossrefAuthor[];
  'container-title': string[];
  volume?: string;
  issue?: string;
  page?: string;
  published?: { 'date-parts': number[][] };
  issued?: { 'date-parts': number[][] };
}

export function initials(given: string): string {
  return given.split(/[\s.]+/).filter(Boolean).map(tok => tok[0].toUpperCase() + '.').join(' ');
}

export function formatAuthors(authors: CrossrefAuthor[]): string {
  const names = authors.filter(a => a.family).map(a => {
    const fam = titleCaseSurname(a.family as string);
    return a.given ? `${fam}, ${initials(a.given)}` : fam;
  });
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  if (names.length <= 20) return names.slice(0, -1).join(', ') + ', & ' + names[names.length - 1];
  return names.slice(0, 19).join(', ') + ', . . . ' + names[names.length - 1]; // APA 21+ authors
}

export function getYear(work: CrossrefWork): number | undefined {
  const dp = work.published?.['date-parts'] || work.issued?.['date-parts'];
  return dp && dp[0] && dp[0][0] ? dp[0][0] : undefined;
}

export function formatPages(page?: string): string {
  if (!page) return '';
  return page.replace(/-+/g, '–');
}

export function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_m, n) => String.fromCodePoint(parseInt(n, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_m, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, '&');
}

const JOURNAL_MINOR_WORDS = new Set([
  'a','an','and','as','at','but','by','for','in','of','on','or','the','to','vs',
]);

export function titleCaseSurname(family: string): string {
  // Only transform when the WHOLE surname is uppercase letters (and separators).
  // Mixed-case names ('Morris', 'McDonald') are returned unchanged.
  if (!/^[\p{Lu}][\p{Lu} '\-]*$/u.test(family)) return family;
  return family.toLowerCase().replace(/(^|[\s'\-])(\p{Ll})/gu, (_m, sep, ch) => sep + (ch as string).toUpperCase());
}

export function titleCaseJournal(journal: string): string {
  // Conservative heuristic: title-case only when the journal is ALL CAPS AND
  // multi-word AND contains at least one token longer than 4 characters.
  // Leaves acronym journals (PLOS ONE, JAMA, BMJ) alone.
  if (/\p{Ll}/u.test(journal)) return journal;
  const tokens = journal.trim().split(/\s+/).filter(Boolean);
  if (tokens.length < 2) return journal;
  if (!tokens.some(t => t.length > 4)) return journal;
  return tokens.map((t, i) => {
    const lower = t.toLowerCase();
    if (i > 0 && JOURNAL_MINOR_WORDS.has(lower)) return lower;
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }).join(' ');
}

export function cleanVolume(volume: string | undefined): string | undefined {
  if (volume === undefined) return undefined;
  return volume.replace(/^\s*(?:no|vol)\.?\s+/i, '').trim();
}

export function crossrefToApa(work: CrossrefWork): string {
  const authors = formatAuthors(work.author || []);
  const year = getYear(work);
  const title = decodeEntities((work.title?.[0] || '').trim().replace(/\.+$/, ''));
  const journal = titleCaseJournal(decodeEntities((work['container-title']?.[0] || '').trim()));
  const volume = cleanVolume(work.volume);
  const pages = formatPages(work.page);
  let volPart = volume ? `*${volume}*` : '';
  if (volume && work.issue) volPart = `*${volume}*(${work.issue})`;
  const tail = `*${journal}*${volPart ? ', ' + volPart : ''}${pages ? ', ' + pages : ''}.`;
  const body = `${authors} (${year ?? 'n.d.'}). ${title}. ${tail}`.replace(/\s+/g, ' ').trim();
  return `${body} https://doi.org/${work.DOI}`;
}

export function isComplete(work: CrossrefWork): boolean {
  return !!(work.author?.some(a => a.family) && work.title?.[0] && work['container-title']?.[0]
    && work.volume && getYear(work) && work.DOI && work.page);
}

export function isSentenceCaseLike(title: string): boolean {
  const words = title.split(/\s+/).slice(1);
  if (words.length === 0) return true;
  const capped = words.filter(w => /^[A-Z]/.test(w)).length;
  return capped / words.length < 0.4;
}
