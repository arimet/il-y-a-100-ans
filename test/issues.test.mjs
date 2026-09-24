import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseIssues, dateKey, iiifUrl, itemUrl } from '../lib/issues.mjs';

const xml = `<?xml version="1.0"?><issues>
<issue ark="bpt6k294903k" dayOfYear="267">24 septembre 1926</issue>
<issue ark="bpt6kAAAA" dayOfYear="1">1 janvier 1926</issue>
<issue ark="bpt6kBBBB" dayOfYear="1">1 janvier 1926 (2e édition)</issue>
</issues>`;

test('parseIssues turns dayOfYear into MM-DD and keeps the first issue of each day', () => {
  assert.deepEqual(parseIssues(xml, 1926), [
    { key: '09-24', ark: 'bpt6k294903k' },
    { key: '01-01', ark: 'bpt6kAAAA' },
  ]);
});

test('parseIssues handles leap years (1928: day 60 is February 29)', () => {
  const leap = '<issue ark="bpt6kX" dayOfYear="60">29 février 1928</issue>';
  assert.deepEqual(parseIssues(leap, 1928), [{ key: '02-29', ark: 'bpt6kX' }]);
});

test('dateKey formats as MM-DD', () => {
  assert.equal(dateKey(new Date(2026, 8, 24)), '09-24');
  assert.equal(dateKey(new Date(2026, 0, 5)), '01-05');
});

test('Gallica URLs', () => {
  assert.equal(iiifUrl('bpt6k294903k'), 'https://gallica.bnf.fr/iiif/ark:/12148/bpt6k294903k/f1/full/600,/0/native.jpg');
  assert.equal(itemUrl('bpt6k294903k'), 'https://gallica.bnf.fr/ark:/12148/bpt6k294903k/f1.item');
});
