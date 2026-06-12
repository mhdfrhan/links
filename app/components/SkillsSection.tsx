"use client";

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

      <div className="space-y-6">
        {categories.map((category, catIndex) => (
          <div key={catIndex}>
            {/* Kategori label */}
            <h3
              className="mb-3"
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                letterSpacing: "0.04em",
                fontWeight: 400,
                textTransform: "uppercase",
                fontStyle: "normal",
              }}
            >
              {category.title}
            </h3>

            {/* Skill chips */}
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {category.skills.map((skill, skillIndex) => (
                <div key={skillIndex} className="flex items-center gap-4">
                  <SkillChip name={skill.name} />
                  {skillIndex < category.skills.length - 1 && (
                    <span style={{ color: "var(--border)", fontSize: "0.8rem" }}>/</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SkillChip({ name }: { name: string }) {
  return (
    <span
      style={{
        fontFamily: "var(--font-sans), system-ui, sans-serif",
        fontSize: "1rem",
        color: "var(--text-secondary)",
        fontStyle: "normal",
        fontWeight: 400,
        display: "inline-block",
        transition: "color 150ms ease",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
      }}
    >
      {name}
    </span>
  );
}
