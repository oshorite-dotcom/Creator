/**
 * Language Router Middleware
 * Automatically detects user language and routes responses
 */

import { Request, Response, NextFunction } from 'express';
import { LanguageService } from '@cortex-ai/language-service';
import type { LanguageCode } from '@cortex-ai/types';

/**
 * Extended Express Request with language info
 */
declare global {
  namespace Express {
    interface Request {
      userLanguage?: LanguageCode;
      languageConfidence?: number;
    }
  }
}

/**
 * Detect user language from request
 */
export const detectUserLanguage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Priority: header > query > cookie > body
    let language = req.headers['x-language'] as string;
    
    if (!language) {
      language = req.query.lang as string;
    }
    
    if (!language) {
      language = req.cookies?.language;
    }

    // If no language found, try to detect from text in body
    if (!language && req.body?.text) {
      const detection = await LanguageService.detection.detectLanguage(req.body.text);
      req.userLanguage = detection.language;
      req.languageConfidence = detection.confidence;
    } else if (language) {
      req.userLanguage = language as LanguageCode;
      req.languageConfidence = 1.0; // User explicitly set
    } else {
      req.userLanguage = 'en'; // Default
      req.languageConfidence = 0;
    }

    next();
  } catch (error) {
    console.error('Language detection middleware error:', error);
    req.userLanguage = 'en';
    next();
  }
};

/**
 * Language Router Middleware
 * Wraps response methods to automatically translate responses
 */
export const languageRouter = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method
    res.json = function (data: any) {
      // If response has content field and user language is not English
      if (data?.content && req.userLanguage && req.userLanguage !== 'en') {
        // Queue translation
        setImmediate(async () => {
          try {
            const translated = await LanguageService.translation.translateFromEnglish(
              data.content,
              req.userLanguage!
            );
            data.content = translated;
            data.translatedTo = req.userLanguage;
            originalJson(data);
          } catch (error) {
            console.error('Translation in middleware failed:', error);
            originalJson(data);
          }
        });
      } else {
        originalJson(data);
      }

      return res;
    };

    next();
  } catch (error) {
    console.error('Language router middleware error:', error);
    next();
  }
};

/**
 * Translate request body from user language to English
 */
export const translateRequestInput = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (
      req.userLanguage &&
      req.userLanguage !== 'en' &&
      req.body?.text &&
      typeof req.body.text === 'string'
    ) {
      const translated = await LanguageService.translation.translateToEnglish(
        req.body.text,
        req.userLanguage
      );
      req.body.originalText = req.body.text;
      req.body.text = translated;
      req.body.originalLanguage = req.userLanguage;
    }

    next();
  } catch (error) {
    console.error('Request translation middleware error:', error);
    next();
  }
};

/**
 * Set language cookie from user preference
 */
export const setLanguageCookie = (req: Request, res: Response, next: NextFunction) => {
  if (req.userLanguage) {
    res.cookie('language', req.userLanguage, {
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      httpOnly: true,
      sameSite: 'lax',
    });
  }

  next();
};

export default {
  detectUserLanguage,
  languageRouter,
  translateRequestInput,
  setLanguageCookie,
};
