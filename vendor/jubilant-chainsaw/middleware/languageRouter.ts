/**
 * Language router middleware for Cortex Omni.
 */
import { Request, Response, NextFunction } from 'express';
import { detectLanguage } from '../lib/language-detection/detectLanguage';
import {
  translateFromEnglish,
  translateToEnglish,
} from '../services/translation/translate';

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

declare global {
  namespace Express {
    interface Request {
      userLanguage?: LanguageCode;
      languageConfidence?: number;
    }
  }
}

export const detectUserLanguage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let language = req.headers['x-language'] as string;

    if (!language) {
      language = req.query.lang as string;
    }

    if (!language) {
      language = req.cookies?.language as string;
    }

    if (!language && req.body?.text) {
      const detection = await detectLanguage(req.body.text);
      req.userLanguage = detection.language;
      req.languageConfidence = detection.confidence;
    } else if (language) {
      req.userLanguage = language as LanguageCode;
      req.languageConfidence = 1.0;
    } else {
      req.userLanguage = 'en';
      req.languageConfidence = 0;
    }

    next();
  } catch (error) {
    console.error('Language detection middleware error:', error);
    req.userLanguage = 'en';
    next();
  }
};

export const languageRouter = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const originalJson = res.json.bind(res);

    res.json = function (data: any) {
      if (data?.content && req.userLanguage && req.userLanguage !== 'en') {
        setImmediate(async () => {
          try {
            const translated = await translateFromEnglish(
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
      const translated = await translateToEnglish(req.body.text, req.userLanguage);
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

export const setLanguageCookie = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.userLanguage) {
    res.cookie('language', req.userLanguage, {
      maxAge: 365 * 24 * 60 * 60 * 1000,
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