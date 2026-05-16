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

      <div className="space-y-3">
        {certifications.map((cert, index) => (
          <div
            key={index}
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "0.875rem 1rem",
              transition: "border-color 200ms ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                "var(--border-hover)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor =
                "var(--border)";
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h3
                  style={{
                    fontWeight: 500,
                    fontSize: "0.9rem",
                    color: "var(--text-primary)",
                    fontStyle: "normal",
                    marginBottom: "0.15rem",
                  }}
                >
                  {cert.title}
                </h3>
                <p
                  style={{
                    fontSize: "0.8125rem",
                    color: "var(--text-secondary)",
                    fontStyle: "normal",
                    marginBottom: "0.2rem",
                  }}
                >
                  {cert.issuer}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    style={{
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                      fontSize: "0.7rem",
                      color: "var(--text-muted)",
                      letterSpacing: "0.01em",
                    }}
                  >
                    {cert.date}
                  </span>
                  {cert.validUntil && (
                    <span
                      style={{
                        fontFamily: "var(--font-jetbrains-mono), monospace",
                        fontSize: "0.7rem",
                        color: "var(--text-muted)",
                        letterSpacing: "0.01em",
                      }}
                    >
                      · s/d {cert.validUntil}
                    </span>
                  )}
                </div>
              </div>

              {/* Verify link jika ada */}
              {cert.verifyUrl && (
                <a
                  href={cert.verifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Verifikasi sertifikat"
                  style={{
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "30px",
                    height: "30px",
                    borderRadius: "6px",
                    background: "var(--bg-tertiary)",
                    border: "1px solid var(--border)",
                    color: "var(--text-muted)",
                    transition: "color 150ms ease, border-color 150ms ease",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.color = "var(--accent)";
                    el.style.borderColor = "var(--border-hover)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.color = "var(--text-muted)";
                    el.style.borderColor = "var(--border)";
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    style={{ width: "14px", height: "14px" }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                    />
                  </svg>
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
