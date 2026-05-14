/**
 * Text-to-Speech Service
 * Converts text to speech audio
 */

import type { TTSRequest, TTSResponse, LanguageCode } from '@cortex-ai/types';
import { isLanguageSupported, hasTTS } from '@cortex-ai/config/languages';

interface BhashiniTTSRequest {
  serviceId: string;
  userId?: string;
  language: string;
  input: Array<{ source: string }>;
  gender?: 'male' | 'female';
  prosody?: {
    rate?: number;
    pitch?: number;
    volumeGain?: number;
  };
}

interface BhashiniTTSResponse {
  audio: string[]; // base64 encoded
  duration?: number[];
}

/**
 * Convert text to speech
 */
export async function synthesizeSpeech(request: TTSRequest): Promise<TTSResponse> {
  const { text, language, gender, speed } = request;

  // Validate language
  if (!isLanguageSupported(language)) {
    throw new Error(`Language not supported: ${language}`);
  }

  // Check if TTS is available
  if (!hasTTS(language)) {
    throw new Error(`TTS not available for language: ${language}`);
  }

  try {
    const { audio, duration } = await synthesizeViaBhashini(text, language, gender, speed);

    return {
      success: true,
      audio: Buffer.from(audio, 'base64'),
      text,
      language,
      duration,
      gender: gender || 'female',
      format: 'wav',
    };
  } catch (error) {
    console.error('TTS error:', error);
    throw error;
  }
}

/**
 * Synthesize via Bhashini API
 */
async function synthesizeViaBhashini(
  text: string,
  language: LanguageCode,
  gender?: 'male' | 'female',
  speed?: number
): Promise<{ audio: string; duration: number }> {
  const apiKey = process.env.BHASHINI_API_KEY;
  const userId = process.env.BHASHINI_USER_ID;
  const baseUrl = process.env.BHASHINI_BASE_URL;

  if (!apiKey || !userId || !baseUrl) {
    throw new Error('Bhashini credentials not configured');
  }

  try {
    const payload: BhashiniTTSRequest = {
      serviceId: 'ai4bharat/tts',
      userId,
      language: convertLanguageCodeToBhashini(language),
      input: [{ source: text }],
      gender: gender || 'female',
      prosody: speed ? { rate: speed } : undefined,
    };

    const response = await fetch(`${baseUrl}/tts`, {
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

    const data: BhashiniTTSResponse = await response.json();
    const duration = estimateDuration(text);

    return {
      audio: data.audio[0],
      duration: data.duration?.[0] || duration,
    };
  } catch (error) {
    console.error('Bhashini TTS error:', error);
    throw error;
  }
}

/**
 * Batch synthesize multiple texts
 */
export async function synthesizeSpeechBatch(
  texts: string[],
  language: LanguageCode,
  gender?: 'male' | 'female'
): Promise<TTSResponse[]> {
  const results: TTSResponse[] = [];

  for (const text of texts) {
    try {
      const result = await synthesizeSpeech({
        text,
        language,
        gender,
      });
      results.push(result);
    } catch (error) {
      console.error(`Failed to synthesize: ${text}`, error);
    }
  }

  return results;
}

/**
 * Get available voices for a language
 */
export function getAvailableVoices(language: LanguageCode): Array<{ gender: string; name: string }> {
  if (!isLanguageSupported(language) || !hasTTS(language)) {
    return [];
  }

  return [
    { gender: 'female', name: `Female (${language})` },
    { gender: 'male', name: `Male (${language})` },
  ];
}

/**
 * Estimate speech duration
 */
function estimateDuration(text: string): number {
  const wordCount = text.split(/\s+/).length;
  return (wordCount / 2.5) * 1000;
}

function convertLanguageCodeToBhashini(code: LanguageCode): string {
  const mapping: Record<LanguageCode, string> = {
    en: 'en', hi: 'hi', ta: 'ta', te: 'te', mr: 'mr',
    bn: 'bn', gu: 'gu', kn: 'kn', ml: 'ml', or: 'or', pa: 'pa', as: 'as',
  };
  return mapping[code] || code;
}

export default {
  synthesizeSpeech,
  synthesizeSpeechBatch,
  getAvailableVoices,
};