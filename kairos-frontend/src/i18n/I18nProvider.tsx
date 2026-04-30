import { createContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { en } from "./translations/en";
import { fr } from "./translations/fr";

export type Language = "en" | "fr";
export type TranslationKey = keyof typeof en;

type TranslationValues = Record<string, string | number>;

type I18nContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, values?: TranslationValues) => string;
};

export const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = "kairos_language";
const translations = { en, fr } as const;

function detectLanguage(): Language {
  if (typeof window === "undefined") return "en";

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "en" || saved === "fr") return saved;

  const browserLanguage = window.navigator.language.toLowerCase();
  return browserLanguage.startsWith("fr") ? "fr" : "en";
}

function interpolate(text: string, values?: TranslationValues) {
  if (!values) return text;
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    text
  );
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(detectLanguage);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo<I18nContextValue>(() => {
    return {
      language,
      setLanguage: setLanguageState,
      t: (key, values) => {
        const text = translations[language][key] ?? translations.en[key] ?? key;
        return interpolate(text, values);
      },
    };
  }, [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
