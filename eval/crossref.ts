import type { CrossrefWork } from './apa.js';

const BASE = 'https://api.crossref.org';
const MAILTO = 'jennifer.kleiman@uga.edu';
const HEADERS = { 'User-Agent': `refcheck-eval/1.0 (mailto:${MAILTO})` };
const SELECT = 'DOI,title,author,container-title,volume,issue,page,published,issued';

export async function fetchSample(count: number): Promise<CrossrefWork[]> {
  const url = `${BASE}/works?filter=type:journal-article&sample=${Math.min(count, 100)}&select=${SELECT}&mailto=${MAILTO}`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`CrossRef ${res.status}`);
  const json: any = await res.json();
  return json.message.items as CrossrefWork[];
}

export async function doiExists(doi: string): Promise<boolean> {
  const res = await fetch(`${BASE}/works/${encodeURIComponent(doi)}`, { headers: HEADERS });
  return res.status === 200;
}
