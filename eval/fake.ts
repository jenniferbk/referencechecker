import { doiExists } from './crossref.js';

const SURNAMES = ['Quenby', 'Vorhees', 'Mallok', 'Trennick', 'Wexler', 'Ostrander', 'Bellweather', 'Cardew', 'Fenniston', 'Grumman'];
const GIVENS = ['Q. R.', 'T.', 'M. J.', 'A.', 'D. L.', 'P.', 'K. E.', 'S.', 'R. W.', 'N.'];
const TITLES = [
  'Adaptive resonance in distributed sensor lattices',
  'A unified theory of recursive market equilibria',
  'Photonic entanglement under thermal decoherence',
  'Morphological drift in synthetic lexicons',
  'Stochastic scheduling for ephemeral compute fabrics',
  'On the topology of self-healing supply graphs',
  'Latent affect in multimodal dialogue agents',
  'Boundary conditions for non-ergodic diffusion fields',
  'A calculus of revocable consent in data exchange',
  'Emergent grammar in low-resource creole corpora',
];
const JOURNALS = [
  'Journal of Applied Cybernetics',
  'International Review of Theoretical Linguistics',
  'Quarterly Papers in Computational Ecology',
  'Annals of Synthetic Materials',
  'Review of Distributed Systems Theory',
];

export function makeFakeDoi(seed: number): string {
  return `10.9999/refcheck.fake.${seed}.${Math.floor(Math.random() * 1e6)}`;
}

export function buildFakeApa(seed: number): { reference: string; doi: string } {
  const a = SURNAMES[seed % SURNAMES.length];
  const ag = GIVENS[seed % GIVENS.length];
  const b = SURNAMES[(seed + 4) % SURNAMES.length];
  const bg = GIVENS[(seed + 4) % GIVENS.length];
  const title = TITLES[seed % TITLES.length];
  const journal = JOURNALS[seed % JOURNALS.length];
  const year = 2015 + (seed % 10);
  const vol = 10 + (seed % 40);
  const issue = 1 + (seed % 4);
  const pages = `${100 + seed}–${110 + seed}`;
  const doi = makeFakeDoi(seed);
  const reference = `${a}, ${ag}, & ${b}, ${bg} (${year}). ${title}. *${journal}*, *${vol}*(${issue}), ${pages}. https://doi.org/${doi}`;
  return { reference, doi };
}

export async function makeFake(
  seed: number,
  check: (doi: string) => Promise<boolean> = doiExists,
): Promise<{ reference: string; doi: string }> {
  for (let i = 0; i < 5; i++) {
    const f = buildFakeApa(seed + i * 1000);
    if (!(await check(f.doi))) return f; // 404 confirms a usable fake
  }
  throw new Error('Could not generate a confirmed-fake DOI after 5 attempts');
}
