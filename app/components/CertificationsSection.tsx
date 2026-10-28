"use client";

import { motion } from "framer-motion";
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

      {/* Certifications List */}
      <div className="flex flex-col gap-3">
        {certifications.map((cert, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-20px" }}
            transition={{
              duration: 0.35,
              delay: index * 0.05,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            whileHover={{ y: -2 }}
            style={{
              borderRadius: "12px",
              border: "1px solid var(--border)",
              background: "var(--bg-secondary)",
              padding: "1.1rem 1.35rem",
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    style={{
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                      fontSize: "0.75rem",
                      color: "var(--accent)",
                      background:
                        "color-mix(in srgb, var(--accent) 10%, transparent)",
                      border:
                        "1px solid color-mix(in srgb, var(--accent) 25%, transparent)",
                      padding: "0.15rem 0.5rem",
                      borderRadius: "6px",
                    }}
                  >
                    {cert.date}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-inter), system-ui, sans-serif",
                      fontSize: "0.8125rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    {cert.issuer}
                  </span>
                </div>

                <h3
                  style={{
                    fontFamily: "var(--font-inter), system-ui, sans-serif",
                    fontWeight: 500,
                    fontSize: "1.0625rem",
                    color: "var(--text-primary)",
                    letterSpacing: "-0.01em",
                    lineHeight: 1.4,
                  }}
                >
                  {cert.title}
                </h3>

                {cert.validUntil && (
                  <p
                    style={{
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                      fontSize: "0.7rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    Valid until {cert.validUntil}
                  </p>
                )}
              </div>

              {/* Verify Link */}
              {cert.verifyUrl && (
                <div className="flex-shrink-0 pt-2 md:pt-0">
                  <motion.a
                    href={cert.verifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                      fontSize: "0.75rem",
                      color: "var(--accent)",
                      background:
                        "color-mix(in srgb, var(--accent) 8%, transparent)",
                      border:
                        "1px solid color-mix(in srgb, var(--accent) 25%, transparent)",
                      padding: "0.35rem 0.75rem",
                      borderRadius: "8px",
                      textDecoration: "none",
                      transition: "background 150ms ease, border-color 150ms ease",
                    }}
                  >
                    <span>Verify</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-3.5 h-3.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                      />
                    </svg>
                  </motion.a>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
