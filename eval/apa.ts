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
  const names = authors.filter(a => a.family).map(a => a.given ? `${a.family}, ${initials(a.given)}` : `${a.family}`);
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

export function crossrefToApa(work: CrossrefWork): string {
  const authors = formatAuthors(work.author || []);
  const year = getYear(work);
  const title = decodeEntities((work.title?.[0] || '').trim().replace(/\.+$/, ''));
  const journal = decodeEntities((work['container-title']?.[0] || '').trim());
  const pages = formatPages(work.page);
  let volPart = work.volume ? `*${work.volume}*` : '';
  if (work.volume && work.issue) volPart = `*${work.volume}*(${work.issue})`;
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
