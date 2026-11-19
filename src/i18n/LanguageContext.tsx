import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import LanguageModal from '@/components/LanguageModal';
import i18n from '@/i18n';
import { DEFAULT_LANGUAGE, LanguageCode, setCurrentLanguage } from '@/i18n/locale';

export type { LanguageCode };

// Turkish is the default, English the second language
export const LANGUAGES: { code: LanguageCode; label: string; flag: string }[] = [
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

const STORAGE_KEY = 'app.language';

const isLanguage = (value: unknown): value is LanguageCode =>
  LANGUAGES.some(l => l.code === value);

interface LanguageValue {
  language: LanguageCode;
  setLanguage: (code: LanguageCode) => void;
  openLanguageModal: () => void;
}

const LanguageContext = createContext<LanguageValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLang] = useState<LanguageCode>(DEFAULT_LANGUAGE);
  const [ready, setReady] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(saved => {
        // an unknown saved value falls back to the default
        if (isLanguage(saved)) {
          setCurrentLanguage(saved);
          i18n.changeLanguage(saved);
          setLang(saved);
        }
        else if (saved) AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const setLanguage = useCallback((code: LanguageCode) => {
    if (!isLanguage(code)) return;
    // the format helpers and i18next change first, so the screens that redraw read the new language
    setCurrentLanguage(code);
    i18n.changeLanguage(code);
    setLang(code);
    AsyncStorage.setItem(STORAGE_KEY, code).catch(() => {});
  }, []);

  const openLanguageModal = useCallback(() => setModalVisible(true), []);

  const value = useMemo(
    () => ({ language, setLanguage, openLanguageModal }),
    [language, setLanguage, openLanguageModal],
  );

  if (!ready) return null;

  return (
    <LanguageContext.Provider value={value}>
      {children}
      <LanguageModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageValue {
  const value = useContext(LanguageContext);
  if (!value) throw new Error('useLanguage() was called outside <LanguageProvider>.');
  return value;
}
