/**
 * Language Settings Component
 * Configure language preferences
 */

import React, { useState } from 'react';
import type { LanguageCode } from '@cortex-ai/types';
import { useLanguage } from '../hooks/useLanguage';

export interface LanguageSettingsProps {
  onClose?: () => void;
  className?: string;
}

/**
 * Language Settings Component
 */
export function LanguageSettings({ onClose, className = '' }: LanguageSettingsProps) {
  const { language, setLanguage } = useLanguage();
  const [voiceGender, setVoiceGender] = useState<'male' | 'female'>('female');
  const [speechRate, setSpeechRate] = useState(1.0);
  const [autoDetect, setAutoDetect] = useState(true);

  const handleLanguageChange = (newLanguage: LanguageCode) => {
    setLanguage(newLanguage);
  };

  const handleSave = () => {
    // Save settings to localStorage
    localStorage.setItem('language_settings', JSON.stringify({
      voiceGender,
      speechRate,
      autoDetect,
    }));
    onClose?.();
  };

  return (
    <div className={`space-y-6 p-6 bg-white rounded-lg shadow-lg ${className}`}>
      <div>
        <h2 className="text-xl font-bold mb-4">Language Settings</h2>
      </div>

      {/* Current Language */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Current Language
        </label>
        <select
          value={language}
          onChange={(e) => handleLanguageChange(e.target.value as LanguageCode)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="en">English</option>
          <option value="hi">हिन्दी (Hindi)</option>
          <option value="ta">தமிழ் (Tamil)</option>
          <option value="te">తెలుగు (Telugu)</option>
          <option value="mr">मराठी (Marathi)</option>
          <option value="bn">বাংলা (Bengali)</option>
          <option value="gu">ગુજરાતી (Gujarati)</option>
          <option value="kn">ಕನ್ನಡ (Kannada)</option>
          <option value="ml">മലയാളം (Malayalam)</option>
          <option value="or">ଓଡ଼ିଆ (Odia)</option>
          <option value="pa">ਪੰਜਾਬੀ (Punjabi)</option>
          <option value="as">অসমীয়া (Assamese)</option>
        </select>
      </div>

      {/* Voice Settings */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Voice Settings</h3>

        {/* Voice Gender */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Voice Gender
          </label>
          <div className="flex gap-4">
            {(['male', 'female'] as const).map((gender) => (
              <label key={gender} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="voiceGender"
                  value={gender}
                  checked={voiceGender === gender}
                  onChange={(e) => setVoiceGender(e.target.value as 'male' | 'female')}
                  className="w-4 h-4 text-blue-500"
                />
                <span className="text-sm capitalize">{gender}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Speech Rate */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Speech Rate: {speechRate.toFixed(1)}x
          </label>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={speechRate}
            onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Slower</span>
            <span>Faster</span>
          </div>
        </div>
      </div>

      {/* Auto-detect */}
      <div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={autoDetect}
            onChange={(e) => setAutoDetect(e.target.checked)}
            className="w-4 h-4 text-blue-500 rounded"
          />
          <span className="text-sm text-gray-700">Auto-detect language from input</span>
        </label>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={handleSave}
          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
        >
          Save Settings
        </button>
        {onClose && (
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
