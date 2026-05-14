/**
 * Language API Routes
 * Endpoints for language services
 */

import { Router, Request, Response, NextFunction } from 'express';
import { LanguageService } from '@cortex-ai/language-service';
import type { LanguageCode } from '@cortex-ai/types';

const router = Router();

/**
 * Middleware to validate language code
 */
const validateLanguage = (req: Request, res: Response, next: NextFunction) => {
  const { language } = req.body;
  if (!language || typeof language !== 'string') {
    return res.status(400).json({ error: 'Language code required' });
  }
  next();
};

/**
 * POST /api/language/detect
 * Detect language from text
 */
router.post('/detect', validateLanguage, async (req: Request, res: Response) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    const result = await LanguageService.detection.detectLanguage(text);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Language detection error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to detect language',
    });
  }
});

/**
 * POST /api/language/translate
 * Translate text from one language to another
 */
router.post('/translate', validateLanguage, async (req: Request, res: Response) => {
  try {
    const { text, sourceLanguage, targetLanguage } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    if (!sourceLanguage || !targetLanguage) {
      return res.status(400).json({ error: 'Source and target languages required' });
    }

    const result = await LanguageService.translation.translate({
      text,
      sourceLanguage: sourceLanguage as LanguageCode,
      targetLanguage: targetLanguage as LanguageCode,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to translate text',
    });
  }
});

/**
 * POST /api/language/tts
 * Convert text to speech
 */
router.post('/tts', validateLanguage, async (req: Request, res: Response) => {
  try {
    const { text, language, gender, speed } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    const result = await LanguageService.tts.synthesizeSpeech({
      text,
      language: language as LanguageCode,
      gender: gender || 'female',
      speed: speed || 1.0,
    });

    // Send audio as base64
    res.json({
      success: true,
      data: {
        audio: result.audio.toString('base64'),
        duration: result.duration,
        format: result.format,
      },
    });
  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to synthesize speech',
    });
  }
});

/**
 * POST /api/language/asr
 * Convert speech to text
 */
router.post('/asr', async (req: Request, res: Response) => {
  try {
    const { audio, language, format } = req.body;

    if (!audio) {
      return res.status(400).json({ error: 'Audio is required' });
    }

    if (!language) {
      return res.status(400).json({ error: 'Language is required' });
    }

    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audio, 'base64');

    const result = await LanguageService.asr.recognizeSpeech({
      audio: audioBuffer,
      language: language as LanguageCode,
      format: format || 'wav',
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('ASR error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to recognize speech',
    });
  }
});

/**
 * POST /api/language/batch-translate
 * Translate multiple texts at once
 */
router.post('/batch-translate', async (req: Request, res: Response) => {
  try {
    const { texts, sourceLanguage, targetLanguage } = req.body;

    if (!Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({ error: 'Texts array is required' });
    }

    if (!sourceLanguage || !targetLanguage) {
      return res.status(400).json({ error: 'Source and target languages required' });
    }

    const results = await LanguageService.translation.translateBatch(
      texts,
      sourceLanguage as LanguageCode,
      targetLanguage as LanguageCode
    );

    res.json({
      success: true,
      data: {
        original: texts,
        translated: results,
      },
    });
  } catch (error) {
    console.error('Batch translation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to translate texts',
    });
  }
});

/**
 * POST /api/language/process-input
 * Full pipeline: detect language -> translate -> return
 */
router.post('/process-input', async (req: Request, res: Response) => {
  try {
    const { text, targetLanguage = 'en' } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    const result = await LanguageService.processUserInput(text, targetLanguage);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Input processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process input',
    });
  }
});

/**
 * POST /api/language/generate-response
 * Full pipeline: translate response -> synthesize -> return audio
 */
router.post('/generate-response', async (req: Request, res: Response) => {
  try {
    const { text, targetLanguage, gender } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    if (!targetLanguage) {
      return res.status(400).json({ error: 'Target language is required' });
    }

    const result = await LanguageService.generateResponse(text, targetLanguage, gender);

    res.json({
      success: true,
      data: {
        text: result.text,
        audio: result.audio.toString('base64'),
        duration: result.duration,
      },
    });
  } catch (error) {
    console.error('Response generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate response',
    });
  }
});

export default router;
