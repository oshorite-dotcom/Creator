/**
 * Language Context
 * Global language state management
 */

import React, { createContext, useState, useCallback, useEffect, ReactNode } from 'react';
import type { LanguageCode } from '@cortex-ai/types';

export interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export interface LanguageProviderProps {
  children: ReactNode;
  defaultLanguage?: LanguageCode;
}

/**
 * Language Provider Component
 */
export function LanguageProvider({
  children,
  defaultLanguage = 'en',
}: LanguageProviderProps) {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    // Try to get from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('language');
      if (saved) return saved as LanguageCode;
    }
    return defaultLanguage;
  });

  /**
   * Set language and persist to localStorage
   */
  const setLanguage = useCallback((lang: LanguageCode) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang);
      document.documentElement.lang = lang;
      document.cookie = `language=${lang}; path=/; max-age=${365 * 24 * 60 * 60}`;
    }
  }, []);

  /**
   * Set initial language attribute
   */
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  const value: LanguageContextType = {
    language,
    setLanguage,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}
