"use client";

import { useLanguage } from "@/lib/contexts/LanguageContext";
import { dictionaries } from "@/lib/i18n/dictionaries";

interface Award {
  title: string;
  year: string;
  highlight?: boolean;
}

interface AwardsSectionProps {
  awards: Award[];
}

export function AwardsSection({ awards }: AwardsSectionProps) {
  const { language } = useLanguage();
  const dict = dictionaries[language].awards;

  return (
    <section className="w-full">
      {/* Section label */}
      <div className="flex items-center gap-3 mb-6">
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

      <div className="space-y-2">
        {awards.map((award, index) => (
          <div
            key={index}
            className="flex items-start gap-4"
            style={{
              padding: "0.75rem 0",
              borderBottom: "1px solid var(--border)",
            }}
          >
            {/* Year — mono muted */}
            <span
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "0.7rem",
                color: "var(--text-muted)",
                letterSpacing: "0.02em",
                flexShrink: 0,
                marginTop: "0.1rem",
                minWidth: "2.5rem",
              }}
            >
              {award.year}
            </span>

            {/* Title */}
            <p
              style={{
                fontSize: "0.9rem",
                color: award.highlight ? "var(--text-primary)" : "var(--text-secondary)",
                lineHeight: 1.5,
                fontStyle: "normal",
                fontWeight: award.highlight ? 500 : 400,
              }}
            >
              {award.title}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
