"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Language } from "../i18n/dictionaries";

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("id");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check local storage on mount
    const savedLang = localStorage.getItem("portfolio_lang") as Language;
    if (savedLang === "en" || savedLang === "id") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLanguageState(savedLang);
    } else {
      // Deteksi bahasa browser jika belum ada preferensi tersimpan
      const browserLang = typeof navigator !== "undefined" 
        ? (navigator.language || (navigator as unknown as { userLanguage?: string }).userLanguage) 
        : "";
      if (browserLang && browserLang.toLowerCase().startsWith("id")) {
        setLanguageState("id");
      } else {
        setLanguageState("en");
      }
    }
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("portfolio_lang", lang);
    // document.documentElement.lang = lang; // optional, but good for SEO/accessibility
  };

  const toggleLanguage = () => {
    setLanguage(language === "id" ? "en" : "id");
  };

  useEffect(() => {
    if (mounted) {
      document.documentElement.lang = language;
    }
  }, [language, mounted]);

  // To prevent hydration mismatch, we don't render children until mounted
  // BUT to prevent layout shift, we can just render it. The initial render might have wrong lang
  // if savedLang is different, but it's acceptable for language switchers.

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
