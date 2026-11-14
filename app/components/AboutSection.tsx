"use client";

import { useRef } from "react";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";

gsap.registerPlugin(ScrollTrigger);

interface AboutSectionProps {
  text: string;
}

function formatExperienceText(text: string): string {
  if (!text) return "";
  const years = new Date().getFullYear() - 2022;

  let formatted = text.replace(/(pengalaman\s+(?:[^]*?))\b\d+\b(\s+tahun)/gi, `$1${years}$2`);
  formatted = formatted.replace(/(experience\s+(?:[^]*?))\b\d+\b(\s+years)/gi, `$1${years}$2`);
  formatted = formatted.replace(/\b4\s*tahun/gi, `${years} tahun`);
  formatted = formatted.replace(/\b4\s*years/gi, `${years} years`);
  return formatted;
}

/**
 * AboutSection — Clean editorial layout
 * Reveal scroll animation on paragraph words, responsive mobile-first.
 */
export function AboutSection({ text }: AboutSectionProps) {
  const { language } = useLanguage();
  const dict = dictionaries[language].about;
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;

      const words = containerRef.current.querySelectorAll(".about-word");
      if (words.length === 0) return;

      const prefersReduced =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (prefersReduced) {
        gsap.set(words, { opacity: 1 });
        return;
      }

      const tween = gsap.to(words, {
        opacity: 1,
        stagger: 0.015,
        ease: "none",
        force3D: true,
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 95%",
          end: "center 52%",
          scrub: true,
        },
      });

      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    },
    { scope: containerRef, dependencies: [text] },
  );

  const yearsExp = Math.max(1, new Date().getFullYear() - 2022);

  return (
    <section ref={containerRef} className="w-full py-10 md:py-16">
      <div className="flex flex-col md:flex-row gap-8 md:gap-16 items-stretch">
        {/* Section label + Editorial Watermark */}
        <div className="md:w-1/4 self-stretch relative">
          <div className="md:sticky md:top-28 z-10 overflow-hidden">
            <span
              aria-hidden="true"
              className="pointer-events-none select-none block font-sans font-extrabold leading-none -mb-6 opacity-[0.045]"
              style={{
                fontSize: "clamp(3.75rem, 7vw, 5.5rem)",
                color: "var(--text-primary)",
                letterSpacing: "-0.04em",
              }}
            >
              01
            </span>
            <span
              style={{
                fontFamily: "var(--font-plus-jakarta), sans-serif",
                fontWeight: 600,
                fontSize: "0.75rem",
                color: "var(--accent)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                display: "block",
                marginBottom: "0.35rem",
              }}
            >
              {dict.sectionNum}
            </span>
            <h2
              style={{
                fontFamily: "var(--font-plus-jakarta), sans-serif",
                fontWeight: 700,
                fontSize: "clamp(1.5rem, 3vw, 2rem)",
                letterSpacing: "-0.02em",
                color: "var(--text-primary)",
                fontStyle: "normal",
                lineHeight: 1.2,
              }}
            >
              {dict.title}
            </h2>

            <div
              className="mt-5 pt-4 hidden md:block"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <span
                className="text-[11px] font-semibold uppercase tracking-widest tabular-nums block"
                style={{ color: "var(--text-muted)" }}
              >
                {yearsExp}+ {language === "id" ? "TAHUN PENGALAMAN" : "YEARS EXPERIENCE"}
              </span>
            </div>
          </div>
        </div>

        {/* Paragraph Text - Smooth GPU Scroll Reveal */}
        <div
          className="md:w-3/4 md:pl-10"
          style={{ borderLeft: "1px solid color-mix(in srgb, var(--border) 60%, transparent)" }}
        >
          <p
            className="about-text"
            style={{
              fontSize: "clamp(1.0625rem, 2vw, 1.375rem)",
              lineHeight: 1.75,
              fontStyle: "normal",
              color: "var(--text-primary)",
            }}
          >
            {formatExperienceText(text).split(" ").map((word, wIndex) => (
              <span
                key={wIndex}
                className="about-word inline-block mr-[0.28em] will-change-[opacity]"
                style={{ opacity: 0.28 }}
              >
                {word}
              </span>
            ))}
          </p>
        </div>
      </div>
    </section>
  );
}
