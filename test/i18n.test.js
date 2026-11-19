import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LOCALES, getLocale, matchLanguage } from '../js/i18n/index.js';
import en from '../js/i18n/en.js';
import fi from '../js/i18n/fi.js';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const htmlKeys = [...html.matchAll(/data-i18n="([^"]+)"[^>]*>([^<]*)</g)].map(([, key, text]) => ({ key, text }));

test('finnish phrases are terse', () => {
  assert.equal(fi.describe(null), 'ei kasvoja');
  assert.equal(fi.describe({ x: 0, y: 0, d: 0 }), 'keskellä');
  assert.equal(fi.describe({ x: -1, y: 3, d: 0 }), 'vähän vasemmalla, paljon ylhäällä');
  assert.equal(fi.describe({ x: 2, y: 0, d: 0 }), 'oikealla');
  assert.equal(fi.describe({ x: 0, y: -2, d: 1 }), 'alhaalla, vähän lähellä');
  assert.equal(fi.describe({ x: 0, y: 0, d: -2 }), 'kaukana');
});

test('every level combination has a phrase in every locale', () => {
  for (const loc of Object.values(LOCALES)) {
    for (let x = -3; x <= 3; x++) {
      for (let y = -3; y <= 3; y++) {
        for (let d = -2; d <= 2; d++) {
          const s = loc.describe({ x, y, d });
          assert.ok(s && !s.includes('undefined'), `${loc.lang} ${x},${y},${d}: ${s}`);
        }
      }
    }
  }
});

test('language matching', () => {
  assert.equal(getLocale('fi-FI'), fi);
  assert.equal(getLocale('sv'), en);
  assert.equal(matchLanguage(['fi-FI', 'en-US']), 'fi');
  assert.equal(matchLanguage(['sv-SE', 'FI']), 'fi');
  assert.equal(matchLanguage(['de']), 'en');
  assert.equal(matchLanguage([]), 'en');
});

test('locales have the same keys as English', () => {
  for (const loc of Object.values(LOCALES)) {
    for (const group of ['status', 'ui']) {
      assert.deepEqual(Object.keys(loc[group]).sort(), Object.keys(en[group]).sort(), `${loc.lang}.${group}`);
      for (const [k, v] of Object.entries(en[group])) {
        assert.equal(typeof loc[group][k], typeof v, `${loc.lang}.${group}.${k}`);
      }
    }
  }
});

test('index.html text keys exist and its English matches en.js', () => {
  assert.ok(htmlKeys.length > 30);
  for (const { key, text } of htmlKeys) {
    assert.ok(key in en.ui, `missing ui.${key}`);
    assert.equal(text, en.ui[key], `index.html text for ${key}`);
  }
  const used = new Set(htmlKeys.map((k) => k.key));
  const unused = Object.keys(en.ui).filter((k) => !used.has(k) && !['description', 'stop'].includes(k));
  assert.deepEqual(unused, [], 'ui keys not used in index.html');
});
