"use client";

import { useLanguage } from "@/lib/contexts/LanguageContext";
import { dictionaries } from "@/lib/i18n/dictionaries";

interface Award {
  title: string;
  year?: string;
  date?: string;
  issuer?: string;
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

      <div className="flex flex-col mt-12 border-t border-[var(--border)]">
        {awards.map((award, index) => (
          <div
            key={index}
            className="group relative flex flex-col md:flex-row md:items-center justify-between py-6 md:py-8 border-b border-[var(--border)] hover:bg-[var(--bg-secondary)] transition-colors duration-500 px-4"
          >
            {/* Left/Date */}
            <div className="md:w-1/4 mb-4 md:mb-0">
              <span
                className="transition-colors duration-300 group-hover:text-[var(--text-primary)]"
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: "0.85rem",
                  color: "var(--text-secondary)",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase"
                }}
              >
                {award.date || award.year}
              </span>
            </div>

            {/* Middle/Title */}
            <div className="md:w-2/4 pr-4">
              <h3
                className="transition-colors duration-300 group-hover:text-[var(--accent)]"
                style={{
                  fontFamily: "var(--font-serif), serif",
                  fontWeight: 400,
                  fontSize: "1.75rem",
                  color: "var(--text-primary)",
                  marginBottom: "0.25rem",
                  lineHeight: 1.2,
                  letterSpacing: "-0.01em"
                }}
              >
                {award.title}
              </h3>
              {award.issuer && (
                <p
                  style={{
                    fontFamily: "var(--font-sans), system-ui, sans-serif",
                    fontSize: "1.05rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  {award.issuer}
                </p>
              )}
            </div>

            {/* Right/Action */}
            <div className="md:w-1/4 flex justify-end mt-6 md:mt-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
