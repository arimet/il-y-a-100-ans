// Builds data/issues.json from Gallica's Issues API.
// Gallica sends no CORS headers, so the browser cannot query it directly: the index is generated here and committed.
import { writeFile, mkdir } from 'node:fs/promises';
import { parseIssues } from '../lib/issues.mjs';

// [name shown on the site, Gallica ARK of the title]
const PAPERS = [
  ['Le Figaro', 'cb34355551z'],
  ['Le Petit Parisien', 'cb34419111x'],
  ['Le Petit Journal', 'cb32895690j'],
  ['Le Matin', 'cb328123058'],
  ["L'Humanité", 'cb327877302'],
  ['Le Temps', 'cb34431794k'],
];

// Two years (100 and 99 years ago) so the site keeps working until the next yearly rebuild.
const thisYear = new Date().getFullYear();
const YEARS = [thisYear - 100, thisYear - 99];

const index = {};
for (const year of YEARS) {
  index[year] = {};
  for (const [paper, titleArk] of PAPERS) {
    const url = `https://gallica.bnf.fr/services/Issues?ark=ark:/12148/${titleArk}/date&date=${year}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'il-y-a-100-ans (open source project)' }, // Gallica answers 403 without one
      signal: AbortSignal.timeout(60_000), // Gallica is slow, ~10 s per call
    });
    if (!res.ok) throw new Error(`${paper} ${year}: HTTP ${res.status}`);
    const issues = parseIssues(await res.text(), year);
    console.log(`${year} ${paper}: ${issues.length} issues`);
    for (const { key, ark } of issues) (index[year][key] ??= []).push({ paper, ark });
  }
}

await mkdir('data', { recursive: true });
await writeFile('data/issues.json', JSON.stringify(index));
