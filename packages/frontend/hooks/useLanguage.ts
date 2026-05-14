/**
 * useLanguage Hook
 * Manages language state and operations
 */

import { useState, useCallback, useEffect, useContext } from 'react';
import type { LanguageCode } from '@cortex-ai/types';
import { LanguageContext } from '../context/LanguageContext';

export interface UseLanguageReturn {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  detectLanguage: (text: string) => Promise<LanguageCode>;
  translate: (text: string, from: LanguageCode, to: LanguageCode) => Promise<string>;
  synthesizeToSpeech: (text: string, language: LanguageCode) => Promise<AudioBuffer>;
  recognizeFromSpeech: (audio: Blob, language: LanguageCode) => Promise<string>;
  isLoading: boolean;
  error: Error | null;
}

export function useLanguage(): UseLanguageReturn {
  const context = useContext(LanguageContext);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }

  const { language, setLanguage } = context;

  /**
   * Detect language from text
   */
  const detectLanguage = useCallback(async (text: string): Promise<LanguageCode> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/language/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language }),
      });

      if (!response.ok) throw new Error('Failed to detect language');

      const data = await response.json();
      return data.data.language;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [language]);

  /**
   * Translate text
   */
  const translate = useCallback(
    async (text: string, from: LanguageCode, to: LanguageCode): Promise<string> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/language/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            sourceLanguage: from,
            targetLanguage: to,
            language,
          }),
        });

        if (!response.ok) throw new Error('Failed to translate');

        const data = await response.json();
        return data.data.translated;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [language]
  );

  /**
   * Synthesize text to speech
   */
  const synthesizeToSpeech = useCallback(
    async (text: string, lang: LanguageCode): Promise<AudioBuffer> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/language/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            language: lang,
            gender: 'female',
            language: language,
          }),
        });

        if (!response.ok) throw new Error('Failed to synthesize speech');

        const data = await response.json();
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const binaryString = atob(data.data.audio);
        const bytes = new Uint8Array(binaryString.length);

        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const audioBuffer = audioContext.createBuffer(1, bytes.length, 44100);
        const channelData = audioBuffer.getChannelData(0);

        for (let i = 0; i < bytes.length; i++) {
          channelData[i] = (bytes[i] - 128) / 128;
        }

        return audioBuffer;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [language]
  );

  /**
   * Recognize speech from audio
   */
  const recognizeFromSpeech = useCallback(
    async (audio: Blob, lang: LanguageCode): Promise<string> => {
      setIsLoading(true);
      setError(null);

      try {
        const arrayBuffer = await audio.arrayBuffer();
        const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

        const response = await fetch('/api/language/asr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audio: base64Audio,
            language: lang,
            format: 'wav',
            language: language,
          }),
        });

        if (!response.ok) throw new Error('Failed to recognize speech');

        const data = await response.json();
        return data.data.text;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [language]
  );

  return {
    language,
    setLanguage,
    detectLanguage,
    translate,
    synthesizeToSpeech,
    recognizeFromSpeech,
    isLoading,
    error,
  };
}
