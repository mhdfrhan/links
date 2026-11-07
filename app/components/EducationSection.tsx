"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { dictionaries } from "@/lib/i18n/dictionaries";

gsap.registerPlugin(ScrollTrigger);

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

/**
 * EducationSection — 2026 Awwwards / 21st.dev Architectural Split Ledger
 * - Editorial header (JetBrains Mono + Playfair Display)
 * - Spotlight hover card with oversized watermark index & GPA architectural block
 */
export function EducationSection({ items }: EducationSectionProps) {
  const { language } = useLanguage();
  const dict = dictionaries[language].education;
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!sectionRef.current) return;
      const cards = sectionRef.current.querySelectorAll(".edu-editorial-card");
      if (cards.length === 0) return;

      gsap.fromTo(
        cards,
        { opacity: 0, y: 36 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.12,
          duration: 0.85,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
          },
        },
      );
    },
    { scope: sectionRef, dependencies: [items.length] },
  );

  return (
    <section ref={sectionRef} className="w-full py-10 md:py-16">
      {/* Editorial Section Header */}
      <div className="mb-12 md:mb-16">
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
            fontFamily: "var(--font-serif), serif",
            fontWeight: 400,
            fontSize: "clamp(2rem, 4vw, 3rem)",
            letterSpacing: "-0.02em",
            color: "var(--text-primary)",
            lineHeight: 1.1,
          }}
        >
          {dict.title}
        </h2>
      </div>

      {/* Architectural Education Cards */}
      <div className="flex flex-col gap-6">
        {items.map((item, index) => (
          <div
            key={item.institution + index}
            className="edu-editorial-card group relative overflow-hidden p-6 sm:p-9 transition-colors duration-300"
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
            }}
          >
            {/* Top Animated Accent Sweep */}
            <div
              className="absolute top-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-500 ease-out"
              style={{ background: "var(--accent)" }}
            />

            {/* Subtle Background Index Watermark */}
            <span
              aria-hidden="true"
              className="pointer-events-none select-none absolute -bottom-6 right-4 font-serif leading-none opacity-[0.04] group-hover:opacity-[0.08] transition-opacity duration-500"
              style={{
                fontSize: "clamp(5rem, 12vw, 9rem)",
                color: "var(--text-primary)",
              }}
            >
              {String(index + 1).padStart(2, "0")}
            </span>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left: Index & Period (3 cols) */}
              <div className="lg:col-span-3 flex lg:flex-col items-center lg:items-start justify-between gap-2">
                <span
                  className="text-xs font-semibold tabular-nums"
                  style={{ color: "var(--accent)", fontFamily: "var(--font-plus-jakarta), sans-serif" }}
                >
                  /{String(index + 1).padStart(2, "0")}
                </span>
                <span
                  className="text-xs font-medium tabular-nums px-3 py-1"
                  style={{
                    color: "var(--text-muted)",
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border)",
                    fontFamily: "var(--font-plus-jakarta), sans-serif",
                  }}
                >
                  {item.period}
                </span>
              </div>

              {/* Center: Institution, Degree & Note (6 cols) */}
              <div className="lg:col-span-6 space-y-2.5">
                <h3
                  className="transition-colors duration-300 group-hover:text-[var(--accent)]"
                  style={{
                    fontFamily: "var(--font-serif), serif",
                    fontWeight: 400,
                    fontSize: "clamp(1.4rem, 2.5vw, 1.9rem)",
                    color: "var(--text-primary)",
                    letterSpacing: "-0.015em",
                    lineHeight: 1.2,
                  }}
                >
                  {item.institution}
                </h3>

                <p
                  style={{
                    fontFamily: "var(--font-plus-jakarta), sans-serif",
                    fontSize: "1rem",
                    fontWeight: 500,
                    color: "var(--text-secondary)",
                  }}
                >
                  {item.degree}
                </p>

                {item.note && (
                  <p
                    className="pt-2 text-sm leading-relaxed"
                    style={{
                      fontFamily: "var(--font-plus-jakarta), sans-serif",
                      color: "var(--text-muted)",
                    }}
                  >
                    {item.note}
                  </p>
                )}
              </div>

              {/* Right: Architectural Score / GPA Callout (3 cols) */}
              {item.score && (
                <div className="lg:col-span-3 flex lg:justify-end">
                  <div
                    className="px-4 py-3 inline-flex flex-col lg:items-end"
                    style={{
                      background:
                        "color-mix(in srgb, var(--accent) 8%, var(--bg-primary))",
                      border:
                        "1px solid color-mix(in srgb, var(--accent) 35%, transparent)",
                    }}
                  >
                    <span
                      className="text-[10px] font-semibold uppercase tracking-widest mb-1"
                      style={{ color: "var(--text-muted)", fontFamily: "var(--font-plus-jakarta), sans-serif" }}
                    >
                      {language === "id" ? "CAPAIAN AKADEMIK" : "ACADEMIC SCORE"}
                    </span>
                    <span
                      className="text-base sm:text-lg font-bold tabular-nums"
                      style={{ color: "var(--accent)", fontFamily: "var(--font-plus-jakarta), sans-serif" }}
                    >
                      {item.score}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
