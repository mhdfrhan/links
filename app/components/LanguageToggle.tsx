"use client";

import { useLanguage } from "@/lib/contexts/LanguageContext";

export function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      className="relative flex items-center p-1 rounded-full border border-border/50 bg-background/50 hover:bg-muted/50 transition-colors"
      aria-label="Toggle language"
    >
      <div
        className="absolute w-[30px] h-[30px] bg-accent/20 border border-accent/30 rounded-full transition-transform duration-300 ease-in-out"
        style={{
          transform: language === "id" ? "translateX(0)" : "translateX(30px)",
        }}
      />
      <div className="relative z-10 flex items-center justify-center w-[30px] h-[30px] text-xs font-semibold">
        ID
      </div>
      <div className="relative z-10 flex items-center justify-center w-[30px] h-[30px] text-xs font-semibold">
        EN
      </div>
    </button>
  );
}
