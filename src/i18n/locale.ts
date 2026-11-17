export type LanguageCode = 'tr' | 'en';

export const DEFAULT_LANGUAGE: LanguageCode = 'tr';

// Number and date locale per app language (Turkish: 1.234,50 and 12 Mar 2026; English: 1,234.50 and 12 Mar 2026)
const LOCALE_TAG: Record<LanguageCode, string> = { tr: 'tr-TR', en: 'en-GB' };

// The website has the same two language paths: /tr/ and /en/
const WEB_SEGMENT: Record<LanguageCode, string> = { tr: 'tr', en: 'en' };

let current: LanguageCode = DEFAULT_LANGUAGE;

// LanguageProvider calls this whenever the language changes, so the plain format helpers follow it
export function setCurrentLanguage(code: LanguageCode) {
  current = code;
}

export const getCurrentLanguage = (): LanguageCode => current;
export const getLocaleTag = (): string => LOCALE_TAG[current];
export const getWebLocaleSegment = (): string => WEB_SEGMENT[current];

// Upper and lower case for text shown to the user. Turkish has a dotted and a dotless i
// (i -> İ, ı -> I), which toUpperCase() does not know. Do not use these on codes such as IBAN or ids.
export function upper(text: string): string {
  const value = String(text ?? '');
  return current === 'tr' ? value.replace(/i/g, 'İ').replace(/ı/g, 'I').toUpperCase() : value.toUpperCase();
}

export function lower(text: string): string {
  const value = String(text ?? '');
  return current === 'tr' ? value.replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase() : value.toLowerCase();
}
