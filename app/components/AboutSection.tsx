"use client";

import { useLanguage } from "@/lib/contexts/LanguageContext";
import { dictionaries } from "@/lib/i18n/dictionaries";

interface AboutSectionProps {
  text: string;
}

/**
 * AboutSection — Teks paragraf natural, single column
 * max-width 680px, centered
 * Tidak ada animasi GSAP blur — sudah cukup clean
 */
export function AboutSection({ text }: AboutSectionProps) {
  const { language } = useLanguage();
  const dict = dictionaries[language].about;

  return (
    <section className="w-full">
      {/* Section label */}
      <div className="flex items-center gap-3 mb-5">
        <span
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: "0.75rem",
            color: "var(--accent)",
            letterSpacing: "0.04em",
          }}
        >
          {dict.sectionNum.split(" ")[0]}
        </span>
        <h2
          style={{
            fontWeight: 500,
            fontSize: "1.5rem",
            letterSpacing: "-0.015em",
            color: "var(--text-primary)",
            fontStyle: "normal",
          }}
        >
          {dict.title}
        </h2>
        <div
          className="flex-1"
          style={{ height: "1px", background: "var(--border)" }}
        />
      </div>

      {/* Teks paragraf */}
      <div
        style={{
          maxWidth: "680px",
        }}
      >
        <p
          style={{
            fontSize: "0.9375rem",
            color: "var(--text-secondary)",
            lineHeight: 1.75,
            fontStyle: "normal",
            fontWeight: 400,
          }}
        >
          {text}
        </p>
      </div>
    </section>
  );
}
