/**
 * Automatic Speech Recognition (ASR) Service
 * Converts speech to text
 */

import type { ASRRequest, ASRResponse, LanguageCode } from '@cortex-ai/types';
import { isLanguageSupported, hasASR } from '@cortex-ai/config/languages';

interface BhashiniASRRequest {
  serviceId: string;
  userId?: string;
  language: string;
  audio: string; // base64 encoded
}

interface BhashiniASRResponse {
  text: string;
  confidence?: number;
}

/**
 * Recognize speech from audio
 */
export async function recognizeSpeech(request: ASRRequest): Promise<ASRResponse> {
  const { audio, language, format } = request;

  // Validate language
  if (!isLanguageSupported(language)) {
    throw new Error(`Language not supported: ${language}`);
  }

  // Check if ASR is available for this language
  if (!hasASR(language)) {
    throw new Error(`ASR not available for language: ${language}`);
  }

  try {
    const audioBase64 = audio instanceof Buffer
      ? audio.toString('base64')
      : Buffer.from(audio as any).toString('base64');

    const result = await recognizeViaBhashini(audioBase64, language);
    const audioDuration = estimateAudioDuration(audio);

    return {
      success: true,
      text: result.text,
      language,
      confidence: result.confidence || 0.85,
      duration: audioDuration,
      alternatives: [],
    };
  } catch (error) {
    console.error('ASR error:', error);
    throw error;
  }
}

/**
 * Recognize via Bhashini API
 */
async function recognizeViaBhashini(
  audioBase64: string,
  language: LanguageCode
): Promise<{ text: string; confidence?: number }> {
  const apiKey = process.env.BHASHINI_API_KEY;
  const userId = process.env.BHASHINI_USER_ID;
  const baseUrl = process.env.BHASHINI_BASE_URL;

  if (!apiKey || !userId || !baseUrl) {
    throw new Error('Bhashini credentials not configured');
  }

  try {
    const payload: BhashiniASRRequest = {
      serviceId: 'ai4bharat/asr',
      userId,
      language: convertLanguageCodeToBhashini(language),
      audio: audioBase64,
    };

    const response = await fetch(`${baseUrl}/bhasini/asr`, {
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

    const data: BhashiniASRResponse = await response.json();
    return { text: data.text, confidence: data.confidence };
  } catch (error) {
    console.error('Bhashini ASR error:', error);
    throw error;
  }
}

/**
 * Convert language codes to Bhashini format
 */
function convertLanguageCodeToBhashini(code: LanguageCode): string {
  const mapping: Record<LanguageCode, string> = {
    en: 'en', hi: 'hi', ta: 'ta', te: 'te', mr: 'mr',
    bn: 'bn', gu: 'gu', kn: 'kn', ml: 'ml', or: 'or', pa: 'pa', as: 'as',
  };
  return mapping[code] || code;
}

/**
 * Estimate audio duration
 */
function estimateAudioDuration(audio: Buffer | Blob): number {
  const bytesPerSecond = 32000;
  const audioSize = audio instanceof Buffer ? audio.length : audio.size;
  return Math.round(audioSize / bytesPerSecond * 100) / 100;
}

export function getSupportedFormats(language: LanguageCode) {
  if (isLanguageSupported(language) && hasASR(language)) {
    return ['wav', 'mp3', 'flac', 'ogg'];
  }
  return [];
}

export default { recognizeSpeech, getSupportedFormats };