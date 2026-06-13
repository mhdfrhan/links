"use client";

import { motion } from "framer-motion";

import { useLanguage } from "@/lib/contexts/LanguageContext";
import { dictionaries } from "@/lib/i18n/dictionaries";

interface Skill {
  name: string;
  icon?: string;
}

interface SkillCategory {
  title: string;
  skills: Skill[];
}

interface SkillsSectionProps {
  categories: SkillCategory[];
}

/**
 * SkillsSection — Chips grouped by kategori
 * JetBrains Mono, bg-tertiary, 
 * Tidak ada progress bar, tidak ada persentase
 */
export function SkillsSection({ categories }: SkillsSectionProps) {
  const { language } = useLanguage();
  const dict = dictionaries[language].skills;

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

      <div className="flex flex-col gap-16 mt-16 overflow-hidden">
        {categories.map((category, catIndex) => {
          // Duplicate skills to create seamless loop
          const infiniteSkills = [...category.skills, ...category.skills, ...category.skills];
          const isEven = catIndex % 2 === 0;

          return (
            <div key={catIndex} className="relative flex flex-col group">
              {/* Category Title overlaying the marquee or above it */}
              <h3
                className="mb-6 px-4 md:px-8 flex items-center gap-4 z-10"
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: "0.85rem",
                  color: "var(--text-muted)",
                  letterSpacing: "0.05em",
                  fontWeight: 400,
                  textTransform: "uppercase",
                }}
              >
                <div className="w-12 h-[1px] bg-[var(--border)]" />
                {category.title}
              </h3>

              {/* Marquee Wrapper */}
              <div className="relative w-full overflow-hidden flex items-center pointer-events-none select-none">
                {/* Left/Right Fades for smooth entry/exit */}
                <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-[var(--bg-primary)] to-transparent z-10" />
                <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-[var(--bg-primary)] to-transparent z-10" />

                <motion.div
                  className="flex gap-8 md:gap-16 items-center px-4"
                  animate={{
                    x: isEven ? ["0%", "-33.33%"] : ["-33.33%", "0%"],
                  }}
                  transition={{
                    ease: "linear",
                    duration: Math.max(10, category.skills.length * 3.5), // Constant speed based on number of items
                    repeat: Infinity,
                  }}
                  style={{ width: "fit-content" }}
                >
                  {infiniteSkills.map((skill, skillIndex) => (
                    <span
                      key={skillIndex}
                      className="whitespace-nowrap transition-colors duration-500 group-hover:text-[var(--text-primary)]"
                      style={{
                        fontFamily: "var(--font-serif), serif",
                        fontSize: "clamp(2rem, 6vw, 3rem)",
                        fontWeight: 400,
                        color: "var(--text-secondary)",
                        opacity: 0.6,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {skill.name}
                    </span>
                  ))}
                </motion.div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
