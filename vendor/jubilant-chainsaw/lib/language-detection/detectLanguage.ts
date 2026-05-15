/**
 * Language detection helper for the Cortex Omni blueprint.
 */
export type LanguageCode =
  | 'en'
  | 'hi'
  | 'ta'
  | 'te'
  | 'mr'
  | 'bn'
  | 'gu'
  | 'kn'
  | 'ml'
  | 'or'
  | 'pa'
  | 'as';

export interface DetectionResult {
  language: LanguageCode;
  confidence: number;
  alternatives: Array<{ language: LanguageCode; confidence: number }>;
}

export async function detectLanguage(text: string): Promise<DetectionResult> {
  if (!text || text.trim().length === 0) {
    return { language: 'en', confidence: 0, alternatives: [] };
  }

  const charDetection = detectByCharacters(text);
  if (charDetection.confidence > 0.7) {
    return charDetection;
  }

  const keywordDetection = detectByKeywords(text);
  if (keywordDetection.confidence > 0.6) {
    return keywordDetection;
  }

  return charDetection;
}

export async function detectLanguageBatch(texts: string[]): Promise<LanguageCode[]> {
  const results = await Promise.all(texts.map(detectLanguage));
  return results.map((result) => result.language);
}

function detectByCharacters(text: string): DetectionResult {
  const scripts = {
    devanagari: /[\u0900-\u097F]/g,
    tamil: /[\u0B80-\u0BFF]/g,
    telugu: /[\u0C00-\u0C7F]/g,
    kannada: /[\u0C80-\u0CFF]/g,
    malayalam: /[\u0D00-\u0D7F]/g,
    gujarati: /[\u0A80-\u0AFF]/g,
    bengali: /[\u0980-\u09FF]/g,
    odia: /[\u0B00-\u0B7F]/g,
    gurmukhi: /[\u0A00-\u0A7F]/g,
    assamese: /[\u0980-\u09FF]/g,
  } as const;

  const languageMap: Record<keyof typeof scripts, LanguageCode> = {
    devanagari: 'hi',
    tamil: 'ta',
    telugu: 'te',
    kannada: 'kn',
    malayalam: 'ml',
    gujarati: 'gu',
    bengali: 'bn',
    odia: 'or',
    gurmukhi: 'pa',
    assamese: 'as',
  };

  const scores: Record<LanguageCode, number> = {
    en: 0,
    hi: 0,
    ta: 0,
    te: 0,
    mr: 0,
    bn: 0,
    gu: 0,
    kn: 0,
    ml: 0,
    or: 0,
    pa: 0,
    as: 0,
  };

  for (const [script, regex] of Object.entries(scripts)) {
    const matches = (text.match(regex) || []).length;
    if (matches > 0) {
      const lang = languageMap[script as keyof typeof scripts];
      scores[lang] += matches;
    }
  }

  const latinMatches = (text.match(/[a-zA-Z]/g) || []).length;
  if (latinMatches > 0) {
    scores.en += latinMatches;
  }

  const sorted = Object.entries(scores)
    .filter(([, score]) => score > 0)
    .sort(([, a], [, b]) => b - a);

  if (sorted.length === 0) {
    return { language: 'en', confidence: 0.5, alternatives: [] };
  }

  const total = sorted.reduce((sum, [, score]) => sum + score, 0);
  const topLanguage = sorted[0][0] as LanguageCode;
  const confidence = sorted[0][1] / total;
  const alternatives = sorted.slice(1, 4).map(([language, score]) => ({
    language: language as LanguageCode,
    confidence: score / total,
  }));

  return { language: topLanguage, confidence, alternatives };
}

function detectByKeywords(text: string): DetectionResult {
  const keywordMap: Record<LanguageCode, string[]> = {
    en: ['the', 'is', 'and', 'to', 'of', 'a', 'in', 'that', 'it', 'for', 'hello', 'hi', 'welcome'],
    hi: ['है', 'को', 'कि', 'का', 'नहीं', 'और', 'में', 'से', 'हैं', 'यह', 'नमस्ते'],
    ta: ['என்', 'ஆ', 'ஐ', 'உ', 'ஊ', 'வணக்கம்', 'நன்றி'],
    te: ['ఆ', 'ఇ', 'ఈ', 'ఉ', 'ఊ', 'నమస్కారం'],
    mr: ['आहे', 'को', 'मी', 'तु', 'हेलो', 'नमस्कार'],
    bn: ['আছে', 'আমি', 'তুমি', 'তাই', 'এটি', 'নমস্কার'],
    gu: ['છે', 'અમે', 'તમે', 'તો', 'આ', 'નમસ્તે'],
    kn: ['ಆಗಿದೆ', 'ನಾನು', 'ನೀನು', 'ಇದು', 'ನಮಸ್ಕಾರ'],
    ml: ['ആണ്', 'ഞാൻ', 'നീ', 'ഇത്', 'നമസ്കാരം'],
    or: ['ଅଛି', 'ମୁଁ', 'ତୁ', 'ଏହି', 'ନମସ୍କାର'],
    pa: ['ਹੈ', 'ਮੈ', 'ਤੂ', 'ਇਹ', 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ'],
    as: ['আছে', 'মই', 'তুমি', 'এই', 'নমস্কাৰ'],
  };

  const scores: Record<LanguageCode, number> = {
    en: 0,
    hi: 0,
    ta: 0,
    te: 0,
    mr: 0,
    bn: 0,
    gu: 0,
    kn: 0,
    ml: 0,
    or: 0,
    pa: 0,
    as: 0,
  };

  const lowerText = text.toLowerCase();

  for (const [language, words] of Object.entries(keywordMap)) {
    for (const word of words) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      scores[language as LanguageCode] += (lowerText.match(regex) || []).length * 10;
    }
  }

  const sorted = Object.entries(scores)
    .filter(([, score]) => score > 0)
    .sort(([, a], [, b]) => b - a);

  if (sorted.length === 0) {
    return { language: 'en', confidence: 0.3, alternatives: [] };
  }

  const topLanguage = sorted[0][0] as LanguageCode;
  const confidence = Math.min(0.8, sorted[0][1] / 100);
  const alternatives = sorted.slice(1, 4).map(([language, score]) => ({
    language: language as LanguageCode,
    confidence: Math.min(0.6, score / 100),
  }));

  return { language: topLanguage, confidence, alternatives };
}

export default { detectLanguage, detectLanguageBatch };