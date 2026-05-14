/**
 * Translation Service
 * Translates text between supported languages
 */

import type { TranslationRequest, TranslationResponse, LanguageCode } from '@cortex-ai/types';
import { isLanguageSupported } from '@cortex-ai/config/languages';

interface BhashiniTranslateRequest {
  serviceId: string;
  userId?: string;
  sourceLanguage: string;
  targetLanguage: string;
  input: string[];
}

interface BhashiniTranslateResponse {
  output: Array<{ text: string }>;
}

/**
 * Translate text from one language to another
 */
export async function translate(request: TranslationRequest): Promise<TranslationResponse> {
  const { text, sourceLanguage, targetLanguage } = request;

  // Validate languages
  if (!isLanguageSupported(sourceLanguage)) {
    throw new Error(`Source language not supported: ${sourceLanguage}`);
  }

  if (!isLanguageSupported(targetLanguage)) {
    throw new Error(`Target language not supported: ${targetLanguage}`);
  }

  // If same language, return as-is
  if (sourceLanguage === targetLanguage) {
    return {
      success: true,
      original: text,
      translated: text,
      sourceLanguage,
      targetLanguage,
      confidence: 1.0,
    };
  }

  try {
    const translatedText = await translateViaBhashini(
      text,
      sourceLanguage,
      targetLanguage
    );

    return {
      success: true,
      original: text,
      translated: translatedText,
      sourceLanguage,
      targetLanguage,
      confidence: 0.9,
    };
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
}

/**
 * Translate via Bhashini API
 */
async function translateViaBhashini(
  text: string,
  sourceLanguage: LanguageCode,
  targetLanguage: LanguageCode
): Promise<string> {
  const apiKey = process.env.BHASHINI_API_KEY;
  const userId = process.env.BHASHINI_USER_ID;
  const baseUrl = process.env.BHASHINI_BASE_URL;

  if (!apiKey || !userId || !baseUrl) {
    throw new Error('Bhashini credentials not configured');
  }

  try {
    const payload: BhashiniTranslateRequest = {
      serviceId: 'ai4bharat/translation',
      userId,
      sourceLanguage: convertLanguageCodeToBhashini(sourceLanguage),
      targetLanguage: convertLanguageCodeToBhashini(targetLanguage),
      input: [text],
    };

    const response = await fetch(`${baseUrl}/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Bhashini API error: ${response.status}`);
    }

    const data: BhashiniTranslateResponse = await response.json();
    return data.output[0]?.text || text;
  } catch (error) {
    console.error('Bhashini translation error:', error);
    throw error;
  }
}

/**
 * Batch translate multiple texts
 */
export async function translateBatch(
  texts: string[],
  sourceLanguage: LanguageCode,
  targetLanguage: LanguageCode
): Promise<string[]> {
  const apiKey = process.env.BHASHINI_API_KEY;
  const userId = process.env.BHASHINI_USER_ID;
  const baseUrl = process.env.BHASHINI_BASE_URL;

  if (!apiKey || !userId || !baseUrl) {
    throw new Error('Bhashini credentials not configured');
  }

  if (sourceLanguage === targetLanguage) {
    return texts;
  }

  try {
    const payload: BhashiniTranslateRequest = {
      serviceId: 'ai4bharat/translation',
      userId,
      sourceLanguage: convertLanguageCodeToBhashini(sourceLanguage),
      targetLanguage: convertLanguageCodeToBhashini(targetLanguage),
      input: texts,
    };

    const response = await fetch(`${baseUrl}/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Bhashini API error: ${response.status}`);
    }

    const data: BhashiniTranslateResponse = await response.json();
    return data.output.map((item) => item.text);
  } catch (error) {
    console.error('Bhashini batch translation error:', error);
    throw error;
  }
}

/**
 * Translate to English (bridge language)
 */
export async function translateToEnglish(
  text: string,
  sourceLanguage: LanguageCode
): Promise<string> {
  if (sourceLanguage === 'en') return text;
  return (await translate({ text, sourceLanguage, targetLanguage: 'en' })).translated;
}

/**
 * Translate from English to target language
 */
export async function translateFromEnglish(
  text: string,
  targetLanguage: LanguageCode
): Promise<string> {
  if (targetLanguage === 'en') return text;
  return (await translate({ text, sourceLanguage: 'en', targetLanguage })).translated;
}

function convertLanguageCodeToBhashini(code: LanguageCode): string {
  const mapping: Record<LanguageCode, string> = {
    en: 'en', hi: 'hi', ta: 'ta', te: 'te', mr: 'mr',
    bn: 'bn', gu: 'gu', kn: 'kn', ml: 'ml', or: 'or', pa: 'pa', as: 'as',
  };
  return mapping[code] || code;
}

export default {
  translate,
  translateBatch,
  translateToEnglish,
  translateFromEnglish,
};