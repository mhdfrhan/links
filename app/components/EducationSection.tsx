"use client";

import { useLanguage } from "@/lib/contexts/LanguageContext";
import { dictionaries } from "@/lib/i18n/dictionaries";

interface Education {
  institution: string;
  period: string;
  degree: string;
  score?: string;
  note?: string;
}

interface EducationSectionProps {
  items: Education[];
}

export function EducationSection({ items }: EducationSectionProps) {
  const { language } = useLanguage();
  const dict = dictionaries[language].education;

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

      {/* List */}
      <div className="flex flex-col gap-12 mt-8">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex flex-col md:flex-row gap-4 md:gap-12"
          >
            {/* Period */}
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
                {item.period}
              </span>
            </div>

            {/* Content */}
            <div className="md:w-3/4">
              <h3
                style={{
                  fontFamily: "var(--font-serif), serif",
                  fontWeight: 400,
                  fontSize: "1.5rem",
                  color: "var(--text-primary)",
                  marginBottom: "0.25rem",
                }}
              >
                {item.institution}
              </h3>
              <p
                style={{
                  fontFamily: "var(--font-sans), system-ui, sans-serif",
                  fontSize: "1rem",
                  color: "var(--text-secondary)",
                  marginBottom: item.score || item.note ? "0.5rem" : "0",
                }}
              >
                {item.degree}
              </p>
              {item.score && (
                <p
                  style={{
                    fontFamily: "var(--font-sans), system-ui, sans-serif",
                    fontSize: "0.9375rem",
                    color: "var(--text-primary)",
                    marginBottom: item.note ? "0.5rem" : "0",
                  }}
                >
                  {item.score}
                </p>
              )}
              {item.note && (
                <p
                  style={{
                    fontFamily: "var(--font-sans), system-ui, sans-serif",
                    fontSize: "0.9375rem",
                    color: "var(--text-secondary)",
                    lineHeight: 1.6,
                  }}
                >
                  {item.note}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
