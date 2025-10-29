import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import type { Language } from '../types';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Use a module-level cache to store fetched translations
const translationCache: Partial<Record<Language, any>> = {};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const fetchAllTranslations = async () => {
      // Prevent re-fetching if already loaded
      if (Object.keys(translationCache).length > 0) {
        setIsLoaded(true);
        return;
      }
      try {
        const [en, fr, es] = await Promise.all([
          fetch('/locales/en.json').then(res => {
            if (!res.ok) throw new Error(`Failed to fetch en.json: ${res.statusText}`);
            return res.json();
          }),
          fetch('/locales/fr.json').then(res => {
            if (!res.ok) throw new Error(`Failed to fetch fr.json: ${res.statusText}`);
            return res.json();
          }),
          fetch('/locales/es.json').then(res => {
            if (!res.ok) throw new Error(`Failed to fetch es.json: ${res.statusText}`);
            return res.json();
          }),
        ]);
        translationCache.en = en;
        translationCache.fr = fr;
        translationCache.es = es;
        setIsLoaded(true);
      } catch (error) {
        console.error("Failed to load translation files:", error);
        // Still set to loaded to unblock rendering, will fallback to keys
        setIsLoaded(true);
      }
    };

    fetchAllTranslations();
  }, []);

  const t = useCallback((key: string): string => {
    const messages = translationCache[language];
    if (!messages) {
      return key; // Fallback to key if language file not loaded
    }
    // Basic key lookup, can be expanded for nested keys if needed.
    const message = messages[key];
    return message || key;
  }, [language]);

  // Do not render the rest of the app until translations are fetched
  // to avoid a flash of untranslated content.
  if (!isLoaded) {
    return null;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
