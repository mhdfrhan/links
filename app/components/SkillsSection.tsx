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
 * SkillsSection — Clean categorized chips
 * JetBrains Mono 400, flexbox wrap layout, iOS hover animation, responsive.
 */
export function SkillsSection({ categories }: SkillsSectionProps) {
  const { language } = useLanguage();
  const dict = dictionaries[language].skills;

  return (
    <section className="w-full">
      {/* Section label */}
      <div className="flex items-center gap-3 mb-8">
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

      {/* Categories Grid */}
      <div className="space-y-8">
        {categories.map((category, catIndex) => (
          <motion.div
            key={catIndex}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{
              duration: 0.4,
              delay: catIndex * 0.08,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className="space-y-3"
          >
            {/* Category header */}
            <h3
              style={{
                fontFamily: "var(--font-inter), system-ui, sans-serif",
                fontWeight: 500,
                fontSize: "1rem",
                letterSpacing: "-0.01em",
                color: "var(--text-secondary)",
              }}
            >
              {category.title}
            </h3>

            {/* Chips wrap */}
            <div className="flex flex-wrap gap-2 md:gap-2.5">
              {category.skills.map((skill, skillIndex) => (
                <motion.span
                  key={skillIndex}
                  whileHover={{ scale: 1.04, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 450, damping: 25 }}
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    fontSize: "0.8125rem",
                    color: "var(--text-secondary)",
                    background: "var(--bg-tertiary)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    padding: "0.4rem 0.8rem",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    userSelect: "none",
                    cursor: "default",
                    transition:
                      "border-color 200ms ease, color 200ms ease, background 200ms ease",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget;
                    el.style.borderColor = "var(--border-hover)";
                    el.style.color = "var(--text-primary)";
                    el.style.background =
                      "color-mix(in srgb, var(--accent) 8%, var(--bg-tertiary))";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget;
                    el.style.borderColor = "var(--border)";
                    el.style.color = "var(--text-secondary)";
                    el.style.background = "var(--bg-tertiary)";
                  }}
                >
                  <span
                    style={{
                      width: "5px",
                      height: "5px",
                      borderRadius: "50%",
                      background: "var(--accent)",
                      opacity: 0.7,
                    }}
                  />
                  {skill.name}
                </motion.span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
