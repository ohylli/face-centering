import en from './en.js';
import fi from './fi.js';

/** Registered locales, keyed by base language. */
export const LOCALES = { en, fi };

const base = (tag) => String(tag).toLowerCase().split('-')[0];

/** Pick a locale by language tag, falling back to English. */
export function getLocale(lang = 'en') {
  return LOCALES[base(lang)] ?? en;
}

/** First supported language in a preference list (e.g. navigator.languages), else 'en'. */
export function matchLanguage(tags = []) {
  for (const tag of tags) {
    if (LOCALES[base(tag)]) return base(tag);
  }
  return 'en';
}
