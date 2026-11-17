import en from './en.js';

const LOCALES = { en };

/** Pick a locale by language tag, falling back to English. */
export function getLocale(lang = 'en') {
  const base = String(lang).toLowerCase().split('-')[0];
  return LOCALES[base] ?? en;
}
