// hooks/useLanguageSwitch.ts
import { useTranslation } from 'react-i18next';

export function useLanguageSwitch() {
  const { i18n } = useTranslation();
  const isTR = (i18n.resolvedLanguage || i18n.language || '').toLowerCase().startsWith('tr');

  const toggle = (value: boolean) => {
    i18n.changeLanguage(value ? 'tr-TR' : 'en-US');
  };

  return { isTR, toggle };
}