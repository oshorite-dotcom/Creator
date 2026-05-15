/**
 * Translation service for the Cortex Omni blueprint.
 */
import type { LanguageCode } from '../../lib/language-detection/detectLanguage';

export interface TranslationRequest {
  text: string;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
}

export interface TranslationResponse {
  success: boolean;
  original: string;
  translated: string;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  confidence: number;
}

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

export async function translate(request: TranslationRequest): Promise<TranslationResponse> {
  const { text, sourceLanguage, targetLanguage } = request;

  if (!text || !text.trim()) {
    return {
      success: false,
      original: text,
      translated: text,
      sourceLanguage,
      targetLanguage,
      confidence: 0,
    };
  }

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

  const translatedText = await translateViaBhashini(text, sourceLanguage, targetLanguage);

  return {
    success: true,
    original: text,
    translated: translatedText,
    sourceLanguage,
    targetLanguage,
    confidence: 0.9,
  };
}

export async function translateBatch(
  texts: string[],
  sourceLanguage: LanguageCode,
  targetLanguage: LanguageCode
): Promise<string[]> {
  if (sourceLanguage === targetLanguage) {
    return texts;
  }

  const apiKey = process.env.BHASHINI_API_KEY;
  const userId = process.env.BHASHINI_USER_ID;
  const baseUrl = process.env.BHASHINI_BASE_URL;

  if (!apiKey || !userId || !baseUrl) {
    throw new Error('Bhashini credentials not configured');
  }

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
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Bhashini API error: ${response.status}`);
  }

  const data: BhashiniTranslateResponse = await response.json();
  return data.output.map((item) => item.text);
}

export async function translateToEnglish(text: string, sourceLanguage: LanguageCode): Promise<string> {
  if (sourceLanguage === 'en') return text;
  return (await translate({ text, sourceLanguage, targetLanguage: 'en' })).translated;
}

export async function translateFromEnglish(text: string, targetLanguage: LanguageCode): Promise<string> {
  if (targetLanguage === 'en') return text;
  return (await translate({ text, sourceLanguage: 'en', targetLanguage })).translated;
}

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
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Bhashini API error: ${response.status}`);
  }

  const data: BhashiniTranslateResponse = await response.json();
  return data.output[0]?.text || text;
}

function convertLanguageCodeToBhashini(code: LanguageCode): string {
  const mapping: Record<LanguageCode, string> = {
    en: 'en',
    hi: 'hi',
    ta: 'ta',
    te: 'te',
    mr: 'mr',
    bn: 'bn',
    gu: 'gu',
    kn: 'kn',
    ml: 'ml',
    or: 'or',
    pa: 'pa',
    as: 'as',
  };
  return mapping[code] || code;
}

export default {
  translate,
  translateBatch,
  translateToEnglish,
  translateFromEnglish,
};