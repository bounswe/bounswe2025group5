import { useState } from 'react';
import { Button } from '@/components/ui/button';
import i18n from '@/services/useClientTranslation';

export default function LanguageToggle() {
  const [currentLang, setCurrentLang] = useState(i18n.language);

  const toggleLanguage = () => {
    const newLang = currentLang === 'tr' ? 'en' : 'tr';
    i18n.changeLanguage(newLang);
    setCurrentLang(newLang);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      className="bg-black/10 backdrop-blur-sm border-white/25 text-white hover:bg-black/30 transition-colors text-3xl"
    >
      {currentLang === 'tr' ? '🇬🇧' : '🇹🇷'}
    </Button>
  );
}