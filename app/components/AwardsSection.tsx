"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { dictionaries } from "@/lib/i18n/dictionaries";

gsap.registerPlugin(ScrollTrigger);

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

/**
 * AwardsSection — 2026 Awwwards Interactive Recognition Ledger
 * - Baris pengakuan & penghargaan bergaya tabel Awwwards
 * - Hover menggeser tipografi Playfair Display, menyalakan aksen & lencana trofi
 * - GSAP ScrollTrigger staggered entrance
 */
export function AwardsSection({ awards }: AwardsSectionProps) {
  const { language } = useLanguage();
  const dict = dictionaries[language].awards;
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!sectionRef.current) return;
      const rows = sectionRef.current.querySelectorAll(".award-ledger-row");
      if (rows.length === 0) return;

      gsap.fromTo(
        rows,
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.08,
          duration: 0.75,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
          },
        },
      );
    },
    { scope: sectionRef, dependencies: [awards.length] },
  );

  return (
    <section ref={sectionRef} className="w-full py-10 md:py-16">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12 md:mb-16">
        <div>
          <span
            style={{
              fontFamily: "var(--font-plus-jakarta), sans-serif",
              fontSize: "0.875rem",
              color: "var(--accent)",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              fontWeight: 600,
              display: "block",
              marginBottom: "0.5rem",
            }}
          >
            {dict.sectionNum}
          </span>
          <h2
            style={{
              fontFamily: "var(--font-plus-jakarta), sans-serif",
              fontWeight: 700,
              fontSize: "clamp(1.5rem, 2.8vw, 2rem)",
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
              lineHeight: 1.1,
            }}
          >
            {dict.title}
          </h2>
        </div>

        <span
          className="text-xs font-semibold uppercase tracking-wider tabular-nums px-3 py-1.5 self-start sm:self-auto"
          style={{
            color: "var(--text-muted)",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            fontFamily: "var(--font-plus-jakarta), sans-serif",
          }}
        >
          /{String(awards.length).padStart(2, "0")} HONORS
        </span>
      </div>

      {/* Awwwards Interactive Hover Ledger */}
      <div
        className="w-full"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        {awards.map((award, index) => (
          <div
            key={award.title + index}
            className="award-ledger-row group relative overflow-hidden py-6 sm:py-7 px-3 sm:px-6 transition-colors duration-300"
            style={{
              borderBottom: "1px solid var(--border)",
              background: "transparent",
            }}
          >
            {/* Hover Subtle Background Wash */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                background:
                  "linear-gradient(90deg, color-mix(in srgb, var(--accent) 8%, transparent) 0%, transparent 100%)",
              }}
            />

            {/* Left Hover Indicator Bar */}
            <div
              aria-hidden="true"
              className="absolute left-0 top-0 bottom-0 w-[3px] scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-center"
              style={{ background: "var(--accent)" }}
            />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Left: Index + Award Title */}
              <div className="flex items-baseline gap-4 sm:gap-6">
                <span
                  className="text-xs font-semibold tabular-nums flex-shrink-0"
                  style={{ color: "var(--accent)", fontFamily: "var(--font-plus-jakarta), sans-serif" }}
                >
                  /{String(index + 1).padStart(2, "0")}
                </span>

                <h3
                  className="transition-all duration-300 group-hover:translate-x-2 group-hover:text-[var(--accent)]"
                  style={{
                    fontFamily: "var(--font-plus-jakarta), sans-serif",
                    fontWeight: 700,
                    fontSize: "clamp(1.1rem, 1.8vw, 1.3rem)",
                    color: "var(--text-primary)",
                    letterSpacing: "-0.015em",
                    lineHeight: 1.3,
                  }}
                >
                  {award.title}
                </h3>
              </div>

              {/* Right: Issuer + Year + Architectural Trophy Box */}
              <div className="flex items-center justify-between md:justify-end gap-4 sm:gap-6 pl-9 md:pl-0 flex-shrink-0">
                {award.issuer && (
                  <span
                    className="text-xs sm:text-sm font-medium"
                    style={{
                      fontFamily: "var(--font-plus-jakarta), sans-serif",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {award.issuer}
                  </span>
                )}

                <span
                  className="text-xs font-semibold tabular-nums px-2.5 py-1"
                  style={{
                    color: "var(--accent)",
                    background:
                      "color-mix(in srgb, var(--accent) 10%, transparent)",
                    border:
                      "1px solid color-mix(in srgb, var(--accent) 30%, transparent)",
                    fontFamily: "var(--font-plus-jakarta), sans-serif",
                  }}
                >
                </span>

                <div className="hidden sm:flex w-9 h-9 items-center justify-center border border-[var(--border)] text-[var(--text-muted)] transition-all duration-300 group-hover:bg-[var(--accent)] group-hover:border-[var(--accent)] group-hover:text-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.6}
                    stroke="currentColor"
                    className="w-4 h-4 transition-colors duration-300 group-hover:text-white"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.504-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.004 0A4.125 4.125 0 0 0 18 9.75V4.5a.75.75 0 0 0-.75-.75h-10.5a.75.75 0 0 0-.75.75v5.25a4.125 4.125 0 0 0 4.496 4.125Z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
