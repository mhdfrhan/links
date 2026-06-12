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

      <div className="flex flex-col gap-6 mt-8">
        {awards.map((award, index) => (
          <div
            key={index}
            className="flex flex-col md:flex-row gap-2 md:gap-12 items-start"
          >
            {/* Year */}
            <div className="md:w-1/4 flex-shrink-0 md:text-right pt-1 md:pr-4">
              <span
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: "0.8125rem",
                  color: "var(--text-secondary)",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase"
                }}
              >
                {award.year}
              </span>
            </div>

            {/* Title */}
            <div className="md:w-3/4">
              <h3
                style={{
                  fontFamily: "var(--font-serif), serif",
                  fontWeight: 400,
                  fontSize: "1.25rem",
                  color: "var(--text-primary)",
                  marginBottom: "0.25rem",
                }}
              >
                {award.title}
              </h3>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
