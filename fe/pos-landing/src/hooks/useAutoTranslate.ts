import { useState, useEffect, useCallback } from 'react';

interface TranslatorInstance {
  translate: (text: string) => Promise<string>;
  destroy: () => void;
}

interface TranslatorAPI {
  create: (options: {
    sourceLanguage: string;
    targetLanguage: string;
    signal?: AbortSignal;
  }) => Promise<TranslatorInstance>;
  availability: (options: {
    sourceLanguage: string;
    targetLanguage: string;
  }) => Promise<'available' | 'downloadable' | 'downloading' | 'unavailable'>;
}

declare global {
  interface Window {
    Translator?: TranslatorAPI;
  }
}

interface UseAutoTranslateOptions {
  sourceLanguage: 'es' | 'en';
  targetLanguage: 'es' | 'en';
  enabled?: boolean;
}

interface TranslationCache {
  [key: string]: string;
}

/**
 * Hook to auto-translate text using the browser's built-in Translator API
 * Falls back to showing original text if translation is unavailable
 */
export function useAutoTranslate({ sourceLanguage, targetLanguage, enabled = true }: UseAutoTranslateOptions) {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [translator, setTranslator] = useState<TranslatorInstance | null>(null);
  const [cache, setCache] = useState<TranslationCache>({});

  // Check if Translator API is available
  useEffect(() => {
    if (!enabled || !window.Translator) {
      setIsAvailable(false);
      return;
    }

    // Captured after the guard. The narrowing above does not reach inside the
    // async closure — TypeScript cannot assume a mutable global still holds a
    // value by the time the promise runs, and it is right not to: this is a
    // browser API that may not exist.
    const translatorApi = window.Translator;

    const checkAvailability = async () => {
      try {
        const availability = await translatorApi.availability({
          sourceLanguage,
          targetLanguage,
        });
        setIsAvailable(availability === 'available' || availability === 'downloadable');
      } catch (error) {
        console.warn('Translator API not available:', error);
        setIsAvailable(false);
      }
    };

    checkAvailability();
  }, [sourceLanguage, targetLanguage, enabled]);

  // Create translator instance
  useEffect(() => {
    if (!isAvailable || !enabled || !window.Translator) {
      return;
    }

    const translatorApi = window.Translator;

    let mounted = true;
    const controller = new AbortController();

    const createTranslator = async () => {
      try {
        setIsLoading(true);
        const instance = await translatorApi.create({
          sourceLanguage,
          targetLanguage,
          signal: controller.signal,
        });
        
        if (mounted) {
          setTranslator(instance);
          setIsLoading(false);
        }
      } catch (error) {
        if (mounted && error instanceof Error && error.name !== 'AbortError') {
          console.warn('Failed to create translator:', error);
          setIsLoading(false);
        }
      }
    };

    createTranslator();

    return () => {
      mounted = false;
      controller.abort();
      if (translator) {
        translator.destroy();
      }
    };
  }, [isAvailable, sourceLanguage, targetLanguage, enabled]);

  /**
   * Translate text with caching
   */
  const translate = useCallback(async (text: string): Promise<string> => {
    if (!text || !enabled) return text;
    
    // Return from cache if available
    const cacheKey = `${sourceLanguage}-${targetLanguage}-${text}`;
    if (cache[cacheKey]) {
      return cache[cacheKey];
    }

    // If translator not available, return original text
    if (!translator || !isAvailable) {
      return text;
    }

    try {
      const translation = await translator.translate(text);
      
      // Cache the result
      setCache(prev => ({
        ...prev,
        [cacheKey]: translation,
      }));
      
      return translation;
    } catch (error) {
      console.warn('Translation failed:', error);
      return text; // Fallback to original text
    }
  }, [translator, isAvailable, sourceLanguage, targetLanguage, cache, enabled]);

  /**
   * Translate an object recursively
   */
  const translateObject = useCallback(async <T extends Record<string, any>>(obj: T): Promise<T> => {
    if (!obj || !enabled) return obj;

    const translated: any = Array.isArray(obj) ? [] : {};

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        translated[key] = await translate(value);
      } else if (typeof value === 'object' && value !== null) {
        translated[key] = await translateObject(value);
      } else {
        translated[key] = value;
      }
    }

    return translated as T;
  }, [translate, enabled]);

  return {
    translate,
    translateObject,
    isAvailable,
    isLoading,
    isReady: isAvailable && !isLoading && translator !== null,
  };
}
