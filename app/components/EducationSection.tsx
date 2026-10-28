"use client";

import { motion } from "framer-motion";
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

      {/* Cards List */}
      <div className="flex flex-col gap-3">
        {items.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-20px" }}
            transition={{
              duration: 0.35,
              delay: index * 0.06,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            whileHover={{ y: -2 }}
            style={{
              borderRadius: "12px",
              border: "1px solid var(--border)",
              background: "var(--bg-secondary)",
              padding: "1.25rem 1.5rem",
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
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
              <div className="space-y-1">
                <span
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    fontSize: "0.75rem",
                    color: "var(--text-muted)",
                    display: "block",
                  }}
                >
                  {item.period}
                </span>
                <h3
                  style={{
                    fontFamily: "var(--font-inter), system-ui, sans-serif",
                    fontWeight: 500,
                    fontSize: "1.125rem",
                    color: "var(--text-primary)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {item.institution}
                </h3>
                <p
                  style={{
                    fontFamily: "var(--font-inter), system-ui, sans-serif",
                    fontSize: "0.875rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  {item.degree}
                </p>
              </div>

              {/* Score & Note */}
              {(item.score || item.note) && (
                <div className="flex flex-col md:items-end text-left md:text-right pt-1 md:pt-0">
                  {item.score && (
                    <span
                      style={{
                        fontFamily: "var(--font-jetbrains-mono), monospace",
                        fontSize: "0.8125rem",
                        color: "var(--accent)",
                        background:
                          "color-mix(in srgb, var(--accent) 10%, transparent)",
                        border:
                          "1px solid color-mix(in srgb, var(--accent) 25%, transparent)",
                        padding: "0.2rem 0.55rem",
                        borderRadius: "6px",
                        display: "inline-block",
                      }}
                    >
                      {item.score}
                    </span>
                  )}
                  {item.note && (
                    <p
                      style={{
                        fontFamily: "var(--font-inter), system-ui, sans-serif",
                        fontSize: "0.8125rem",
                        color: "var(--text-muted)",
                        marginTop: "0.35rem",
                        maxWidth: "320px",
                        lineHeight: 1.5,
                      }}
                    >
                      {item.note}
                    </p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
