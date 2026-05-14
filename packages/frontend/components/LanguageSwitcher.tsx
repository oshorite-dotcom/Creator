/**
 * Language Switcher Component
 * Dropdown to switch between languages
 */

import React, { useState } from 'react';
import type { LanguageCode } from '@cortex-ai/types';
import { useLanguage } from '../hooks/useLanguage';

const LANGUAGES: Record<LanguageCode, { name: string; flag: string; nativeName: string }> = {
  en: { name: 'English', flag: '🇺🇸', nativeName: 'English' },
  hi: { name: 'Hindi', flag: '🇮🇳', nativeName: 'हिन्दी' },
  ta: { name: 'Tamil', flag: '🇮🇳', nativeName: 'தமிழ்' },
  te: { name: 'Telugu', flag: '🇮🇳', nativeName: 'తెలుగు' },
  mr: { name: 'Marathi', flag: '🇮🇳', nativeName: 'मराठी' },
  bn: { name: 'Bengali', flag: '🇮🇳', nativeName: 'বাংলা' },
  gu: { name: 'Gujarati', flag: '🇮🇳', nativeName: 'ગુજરાતી' },
  kn: { name: 'Kannada', flag: '🇮🇳', nativeName: 'ಕನ್ನಡ' },
  ml: { name: 'Malayalam', flag: '🇮🇳', nativeName: 'മലയാളം' },
  or: { name: 'Odia', flag: '🇮🇳', nativeName: 'ଓଡ଼ିଆ' },
  pa: { name: 'Punjabi', flag: '🇮🇳', nativeName: 'ਪੰਜਾਬੀ' },
  as: { name: 'Assamese', flag: '🇮🇳', nativeName: 'অসমীয়া' },
};

export interface LanguageSwitcherProps {
  className?: string;
  showNativeName?: boolean;
  dropdownPosition?: 'top' | 'bottom';
}

/**
 * Language Switcher Component
 */
export function LanguageSwitcher({
  className = '',
  showNativeName = true,
  dropdownPosition = 'bottom',
}: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const currentLang = LANGUAGES[language];

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors font-medium text-sm"
        aria-label="Select language"
      >
        <span className="text-xl">{currentLang.flag}</span>
        <span className="hidden sm:inline">{currentLang.name}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className={`absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto ${
            dropdownPosition === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
        >
          {(Object.entries(LANGUAGES) as [LanguageCode, typeof LANGUAGES[LanguageCode]][]).map(
            ([code, { name, flag, nativeName }]) => (
              <button
                key={code}
                onClick={() => {
                  setLanguage(code);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors flex items-center gap-3 ${
                  language === code ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                }`}
              >
                <span className="text-xl">{flag}</span>
                <div className="flex-1">
                  <div className="font-medium text-sm">{name}</div>
                  {showNativeName && <div className="text-xs text-gray-600">{nativeName}</div>}
                </div>
                {language === code && (
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
