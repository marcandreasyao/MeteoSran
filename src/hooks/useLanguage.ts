import { useState } from 'react';

export type Language = 'fr' | 'en';

const STORAGE_KEY = 'meteosran-lang';

const getInitialLanguage = (): Language => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (stored === 'fr' || stored === 'en') return stored;
  } catch {
    // localStorage may be unavailable in sandboxed contexts
  }
  if (typeof navigator !== 'undefined' && navigator.language.startsWith('fr')) {
    return 'fr';
  }
  return 'en';
};

/**
 * Detects the user's preferred language from browser locale (navigator.language).
 * Manual overrides are persisted to localStorage so the choice survives navigation.
 * Returns the active language and a toggle function.
 *
 * French is the default for any 'fr-*' locale (fr-FR, fr-CI, fr-BE, etc.).
 * All other locales default to English.
 */
export const useLanguage = (): [Language, () => void] => {
  const [lang, setLang] = useState<Language>(getInitialLanguage);

  const toggleLang = () => {
    setLang(prev => {
      const next: Language = prev === 'fr' ? 'en' : 'fr';
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // silent fail
      }
      return next;
    });
  };

  return [lang, toggleLang];
};
