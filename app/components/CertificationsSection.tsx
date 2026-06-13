"use client";

import { useLanguage } from "@/lib/contexts/LanguageContext";
import { dictionaries } from "@/lib/i18n/dictionaries";

interface Certification {
  title: string;
  issuer: string;
  date: string;
  verifyUrl?: string;
  validUntil?: string;
}

interface CertificationsSectionProps {
  certifications: Certification[];
}

export function CertificationsSection({
  certifications,
}: CertificationsSectionProps) {
  const { language } = useLanguage();
  const dict = dictionaries[language].certifications;

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
        {certifications.map((cert, index) => (
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
                {cert.date}
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
                {cert.title}
              </h3>
              <p
                style={{
                  fontFamily: "var(--font-sans), system-ui, sans-serif",
                  fontSize: "1.05rem",
                  color: "var(--text-secondary)",
                }}
              >
                {cert.issuer}
              </p>
              {cert.validUntil && (
                <p
                  className="mt-2"
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    fontSize: "0.75rem",
                    color: "var(--text-muted)",
                    textTransform: "uppercase"
                  }}
                >
                  Valid until {cert.validUntil}
                </p>
              )}
            </div>

            {/* Right/Action */}
            <div className="md:w-1/4 flex justify-end mt-6 md:mt-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {cert.verifyUrl ? (
                <a
                  href={cert.verifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
                >
                  <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "0.85rem", textTransform: "uppercase" }}>View</span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 -rotate-45 group-hover:rotate-0 transition-transform duration-300">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </a>
              ) : (
                <div className="text-[var(--text-muted)]">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
