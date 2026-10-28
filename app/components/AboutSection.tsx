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

      const tween = gsap.to(words, {
        opacity: 1,
        stagger: 0.02,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 75%",
          end: "+=500",
          scrub: true,
        },
      });

      requestAnimationFrame(() => ScrollTrigger.refresh());

      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    },
    { scope: containerRef, dependencies: [text] },
  );

  return (
    <section ref={containerRef} className="w-full py-8 md:py-16">
      <div className="flex flex-col md:flex-row gap-6 md:gap-16 items-start">
        {/* Section label */}
        <div className="md:w-1/4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="md:sticky md:top-24"
          >
            <span
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "0.75rem",
                color: "var(--accent)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                fontWeight: 500,
                display: "block",
                marginBottom: "0.35rem",
              }}
            >
              {dict.sectionNum}
            </span>
            <h2
              style={{
                fontWeight: 500,
                fontSize: "clamp(1.5rem, 3vw, 2rem)",
                letterSpacing: "-0.02em",
                color: "var(--text-primary)",
                fontStyle: "normal",
                lineHeight: 1.2,
              }}
            >
              {dict.title}
            </h2>
          </motion.div>
        </div>

        {/* Paragraph Text - Smooth Scroll Reveal */}
        <div className="md:w-3/4">
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
                className="about-word inline-block mr-[0.28em] will-change-opacity"
                style={{ opacity: 0.2 }}
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
