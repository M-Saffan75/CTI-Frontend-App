import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { DEFAULT_LANGUAGE } from '@/i18n/locale';
import en from '@/i18n/locales/en';
import tr from '@/i18n/locales/tr';

// Turkish is the default. English is also the fallback for a key that has no Turkish text yet.
// LanguageProvider changes the language; backend messages are never run through t().
i18n.use(initReactI18next).init({
  resources: { tr: { translation: tr }, en: { translation: en } },
  lng: DEFAULT_LANGUAGE,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
  react: { useSuspense: false },
});

export default i18n;
