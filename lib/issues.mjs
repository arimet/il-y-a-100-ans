const pad = (n) => String(n).padStart(2, '0');

/** "MM-DD" key for a date, in local time. */
export const dateKey = (d) => `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/**
 * Parses the XML returned by Gallica's `services/Issues` endpoint.
 * Keeps only the first issue of each day (some papers printed several editions).
 * @returns {Array<{ key: string, ark: string }>}
 */
export function parseIssues(xml, year) {
  const seen = new Set();
  const issues = [];
  for (const [, ark, dayOfYear] of xml.matchAll(/<issue ark="([^"]+)" dayOfYear="(\d+)"/g)) {
    const key = dateKey(new Date(year, 0, Number(dayOfYear)));
    if (seen.has(key)) continue;
    seen.add(key);
    issues.push({ key, ark });
  }
  return issues;
}

/** IIIF URL of an issue's first page. */
export const iiifUrl = (ark, width = 600) =>
  `https://gallica.bnf.fr/iiif/ark:/12148/${ark}/f1/full/${width},/0/native.jpg`;

/** Gallica reader page of an issue. */
export const itemUrl = (ark) => `https://gallica.bnf.fr/ark:/12148/${ark}/f1.item`;
