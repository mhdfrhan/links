"use client";

import { motion } from "framer-motion";
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

      {/* Awards List */}
      <div className="flex flex-col gap-3">
        {awards.map((award, index) => (
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
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
                    {award.date || award.year}
                  </span>
                  {award.issuer && (
                    <span
                      style={{
                        fontFamily: "var(--font-inter), system-ui, sans-serif",
                        fontSize: "0.8125rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      {award.issuer}
                    </span>
                  )}
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
                  {award.title}
                </h3>
              </div>

              {/* Award Trophy Icon */}
              <div className="hidden md:flex text-[var(--text-muted)] flex-shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5 opacity-60"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.504-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.004 0A4.125 4.125 0 0 0 18 9.75V4.5a.75.75 0 0 0-.75-.75h-10.5a.75.75 0 0 0-.75.75v5.25a4.125 4.125 0 0 0 4.496 4.125Z"
                  />
                </svg>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
