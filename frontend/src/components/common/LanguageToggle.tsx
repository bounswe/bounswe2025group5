import { useState } from 'react';
import i18n, { LANGUAGE_STORAGE_KEY } from '@/services/useClientTranslation';
import TurkeyFlag from '@/assets/turkey.png';
import UkFlag from '@/assets/united-kingdom.png';

export default function LanguageToggle() {
  const [currentLang, setCurrentLang] = useState(i18n.language);

  const toggleLanguage = () => {
    const newLang = currentLang === 'tr' ? 'en' : 'tr';
    i18n.changeLanguage(newLang);
    setCurrentLang(newLang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
    } catch {
      // ignore storage failures
    }
  };

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className="h-13 w-13 hover:scale-105 rounded-full grid place-items-center bg-transparent ring-4 ring-foreground/80 hover:ring-foreground transition-all duration-200 outline-none focus-visible:ring-4 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      aria-label={currentLang === 'tr' ? 'Switch language to English' : "Dili Türkçe'ye değiştir"}
      title={currentLang === 'tr' ? 'English' : 'Türkçe'}
    >
      {currentLang === 'tr' ? (
        <img
          src={UkFlag}
          width={56}
          height={56}
          alt="UK flag"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <img
          src={TurkeyFlag}
          width={56}
          height={56}
          alt="Türk bayrağı"
          loading="lazy"
          decoding="async"
        />
      )}
    </button>
  );
}