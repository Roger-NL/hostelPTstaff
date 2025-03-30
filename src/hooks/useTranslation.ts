import { useStore } from '../store/useStore';
import { translations } from '../i18n/translations';

type TranslationKey = string;
type TranslationParams = Record<string, string | number | undefined>;

export const useTranslation = () => {
  const { language } = useStore();

  const t = (key: TranslationKey, params?: TranslationParams): string => {
    const keys = key.split('.');
    let value: any = translations[language];

    // Navigate through the translation object
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) {
        console.warn(`Translation key "${key}" not found for language "${language}"`);
        return key;
      }
    }

    // Replace parameters if they exist
    if (params) {
      return value.replace(/\{(\w+)\}/g, (match: string, key: string) => {
        const paramValue = params[key];
        return paramValue !== undefined ? paramValue.toString() : match;
      });
    }

    return value;
  };

  return { t, language };
}; 