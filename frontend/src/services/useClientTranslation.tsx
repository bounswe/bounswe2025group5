import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../i18n/en.json';
import tr from '../i18n/tr.json';

const resources = {
  en: { translation: en },
  tr: { translation: tr },
};

const LANGUAGE_STORAGE_KEY = 'appLanguage';

const getInitialLanguage = (): string => {
  if (typeof window === 'undefined') return 'en';
  const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (saved === 'en' || saved === 'tr') return saved;
  return 'en';
};

const initialLanguage = getInitialLanguage();

i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

if (typeof window !== 'undefined') {
  // Keep localStorage in sync when language changes
  i18n.on('languageChanged', (lng) => {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
    } catch {
      // ignore storage errors (e.g., private mode)
    }
  });
}

export { LANGUAGE_STORAGE_KEY };
export default i18n;
