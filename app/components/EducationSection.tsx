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

      <div className="space-y-4">
        {items.map((item, index) => (
          <div
            key={index}
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "1rem 1.25rem",
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3
                  style={{
                    fontWeight: 500,
                    fontSize: "1rem",
                    color: "var(--text-primary)",
                    fontStyle: "normal",
                    marginBottom: "0.2rem",
                  }}
                >
                  {item.institution}
                </h3>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--accent)",
                    fontStyle: "normal",
                    marginBottom: (item.score || item.note) ? "0.5rem" : 0,
                  }}
                >
                  {item.degree}
                </p>
                {item.score && (
                  <p
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--text-secondary)",
                      marginBottom: item.note ? "0.5rem" : 0,
                      fontWeight: 500,
                    }}
                  >
                    {item.score}
                  </p>
                )}
                {item.note && (
                  <p
                    style={{
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                      fontSize: "0.7rem",
                      color: "var(--text-muted)",
                      letterSpacing: "0.01em",
                    }}
                  >
                    {item.note}
                  </p>
                )}
              </div>
              <span
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: "0.7rem",
                  color: "var(--text-muted)",
                  whiteSpace: "nowrap",
                  letterSpacing: "0.02em",
                }}
              >
                {item.period}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
