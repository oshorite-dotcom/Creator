/**
 * Language Service Module
 * Aggregates all language-related services
 */

export * from './detect';
export * from './translate';
export * from './tts';
export * from './asr';

import * as detectService from './detect';
import * as translateService from './translate';
import * as ttsService from './tts';
import * as asrService from './asr';

/**
 * Complete Language Service Interface
 */
export const LanguageService = {
  detection: detectService,
  translation: translateService,
  tts: ttsService,
  asr: asrService,

  /**
   * Full pipeline: detect -> translate -> process -> translate back
   */
  async processUserInput(text: string, targetLanguage: string = 'en') {
    // Detect user's language
    const detection = await detectService.detectLanguage(text);

    // Translate to processing language (English)
    let processText = text;
    if (detection.language !== targetLanguage) {
      const translated = await translateService.translate({
        text,
        sourceLanguage: detection.language,
        targetLanguage: targetLanguage as any,
      });
      processText = translated.translated;
    }

    return {
      detected: {
        language: detection.language,
        confidence: detection.confidence,
      },
      processed: processText,
    };
  },

  /**
   * Full pipeline: process -> translate -> synthesize
   */
  async generateResponse(text: string, targetLanguage: string, gender?: 'male' | 'female') {
    // Translate to user's language
    let responseText = text;
    if (targetLanguage !== 'en') {
      const translated = await translateService.translate({
        text,
        sourceLanguage: 'en',
        targetLanguage: targetLanguage as any,
      });
      responseText = translated.translated;
    }

    // Synthesize speech
    const audio = await ttsService.synthesizeSpeech({
      text: responseText,
      language: targetLanguage as any,
      gender: gender || 'female',
    });

    return {
      text: responseText,
      audio: audio.audio,
      duration: audio.duration,
    };
  },
};

export default LanguageService;