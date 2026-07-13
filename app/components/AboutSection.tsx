"use client";

import { useRef } from "react";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface AboutSectionProps {
  text: string;
}

/**
 * AboutSection — Bold Typography layout
 * Oversized text to make it feel less empty, animated character by character on scroll.
 */
export function AboutSection({ text }: AboutSectionProps) {
  const { language } = useLanguage();
  const dict = dictionaries[language].about;
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;

      const chars = containerRef.current.querySelectorAll(".about-char");
      if (chars.length === 0) return;

      const tween = gsap.to(chars, {
        opacity: 1,
        stagger: 0.05,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 70%",
          end: "+=600",
          scrub: 1,
        },
      });

      // Make sure ScrollTrigger recalculates positions after layout/fonts settle
      requestAnimationFrame(() => ScrollTrigger.refresh());

      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    },
    { scope: containerRef, dependencies: [text] }
  );

  return (
    <section ref={containerRef} className="w-full py-12 md:py-24">
      <div className="flex flex-col md:flex-row gap-12 md:gap-24 items-start">
        {/* Section label */}
        <div className="md:w-1/4">
          <div className="sticky top-24">
            <span
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
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
                fontSize: "2.5rem",
                letterSpacing: "-0.02em",
                color: "var(--text-primary)",
                fontStyle: "normal",
                lineHeight: 1.1,
              }}
            >
              {dict.title}
            </h2>
          </div>
        </div>

        {/* Paragraph Text - Character Reveal */}
        <div className="md:w-3/4">
          <p
            className="about-text"
            style={{
              fontFamily: "var(--font-serif), serif",
              fontSize: "clamp(1.25rem, 2.5vw, 1.75rem)",
              lineHeight: 1.6,
              fontStyle: "normal",
              fontWeight: 400,
            }}
          >
            {text.split(" ").map((word, wIndex) => (
              <span key={wIndex} style={{ display: "inline-block", marginRight: "0.25em" }}>
                {word.split("").map((char, cIndex) => (
                  <span
                    key={cIndex}
                    className="about-char"
                    style={{ opacity: 0.15 }}
                  >
                    {char}
                  </span>
                ))}
              </span>
            ))}
          </p>
        </div>
      </div>
    </section>
  );
}