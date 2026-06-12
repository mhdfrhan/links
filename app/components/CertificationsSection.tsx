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

      <div className="flex flex-col gap-8 mt-8">
        {certifications.map((cert, index) => (
          <div
            key={index}
            className="flex flex-col md:flex-row gap-2 md:gap-12 items-start"
          >
            {/* Date */}
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
                {cert.date}
              </span>
            </div>

            {/* Content */}
            <div className="md:w-3/4 flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3
                  style={{
                    fontFamily: "var(--font-serif), serif",
                    fontWeight: 400,
                    fontSize: "1.25rem",
                    color: "var(--text-primary)",
                    marginBottom: "0.25rem",
                  }}
                >
                  {cert.title}
                </h3>
                <p
                  style={{
                    fontFamily: "var(--font-sans), system-ui, sans-serif",
                    fontSize: "0.9375rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  {cert.issuer}
                </p>
                {cert.validUntil && (
                  <p
                    style={{
                      fontFamily: "var(--font-sans), system-ui, sans-serif",
                      fontSize: "0.8125rem",
                      color: "var(--text-muted)",
                      marginTop: "0.25rem"
                    }}
                  >
                    {dictionaries[language].misc.until} {cert.validUntil}
                  </p>
                )}
              </div>

              {/* Verify link jika ada */}
              {cert.verifyUrl && (
                <a
                  href={cert.verifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Verifikasi sertifikat"
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    fontSize: "0.75rem",
                    color: "var(--text-secondary)",
                    textDecoration: "underline",
                    textDecorationColor: "var(--border)",
                    textUnderlineOffset: "4px",
                    transition: "color 150ms ease, text-decoration-color 150ms ease",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.color = "var(--text-primary)";
                    el.style.textDecorationColor = "var(--text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.color = "var(--text-secondary)";
                    el.style.textDecorationColor = "var(--border)";
                  }}
                >
                  View
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
