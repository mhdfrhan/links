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
    <section className="w-full relative flex flex-col md:flex-row gap-8 md:gap-16 items-start mt-8">
      
      {/* Sticky Section Label */}
      <div className="md:w-1/4 md:sticky md:top-32 flex flex-col gap-2">
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
            fontSize: "1.75rem",
            letterSpacing: "-0.015em",
            color: "var(--text-primary)",
            fontStyle: "normal",
          }}
        >
          {dict.title}
        </h2>
        <div className="w-12 h-[1px] bg-[var(--border)] mt-4" />
      </div>

      {/* List */}
      <div className="md:w-3/4 flex flex-col">
        {items.map((item, index) => (
          <div
            key={index}
            className="group relative flex flex-col py-10 border-b border-[var(--border)] first:border-t"
          >
            {/* Massive Background Year */}
            <div 
              className="absolute right-0 top-1/2 -translate-y-1/2 text-[4rem] md:text-[6rem] font-black opacity-[0.02] group-hover:opacity-[0.05] group-hover:-translate-x-4 transition-all duration-700 pointer-events-none select-none z-0 whitespace-nowrap"
              style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}
            >
              {item.period.split(" ")[0]}
            </div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-baseline justify-between gap-4">
              <div className="flex-1">
                <span
                  className="inline-block mb-3"
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    fontSize: "0.85rem",
                    color: "var(--text-muted)",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase"
                  }}
                >
                  {item.period}
                </span>
                <h3
                  className="transition-colors duration-300 group-hover:text-[var(--text-primary)]"
                  style={{
                    fontFamily: "var(--font-serif), serif",
                    fontWeight: 400,
                    fontSize: "1.75rem",
                    color: "var(--text-secondary)",
                    marginBottom: "0.5rem",
                  }}
                >
                  {item.institution}
                </h3>
                <p
                  style={{
                    fontFamily: "var(--font-sans), system-ui, sans-serif",
                    fontSize: "1.05rem",
                    color: "var(--text-muted)",
                  }}
                >
                  {item.degree}
                </p>
              </div>

              {/* Right Side Info */}
              <div className="flex flex-col md:items-end md:text-right mt-4 md:mt-0">
                {item.score && (
                  <div className="mb-2">
                    <span className="text-[0.7rem] uppercase tracking-widest text-[var(--text-muted)] font-mono block mb-1">Score / GPA</span>
                    <span className="text-[1.25rem] font-semibold text-[var(--text-primary)]">{item.score}</span>
                  </div>
                )}
                {item.note && (
                  <p
                    className="mt-2"
                    style={{
                      fontFamily: "var(--font-sans), system-ui, sans-serif",
                      fontSize: "0.875rem",
                      color: "var(--text-muted)",
                      lineHeight: 1.5,
                      maxWidth: "250px",
                    }}
                  >
                    {item.note}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
