"use client";

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
 * JetBrains Mono, bg-tertiary, rounded-md
 * Tidak ada progress bar, tidak ada persentase
 */
export function SkillsSection({ categories }: SkillsSectionProps) {
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
          04.
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
          Kemampuan
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
            <div className="flex flex-wrap gap-2">
              {category.skills.map((skill, skillIndex) => (
                <SkillChip key={skillIndex} name={skill.name} />
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
        fontFamily: "var(--font-jetbrains-mono), monospace",
        fontSize: "0.75rem",
        color: "var(--text-secondary)",
        background: "var(--bg-tertiary)",
        border: "1px solid var(--border)",
        borderRadius: "6px",
        padding: "0.25rem 0.625rem",
        letterSpacing: "0.01em",
        fontStyle: "normal",
        fontWeight: 400,
        display: "inline-block",
        transition: "border-color 150ms ease, color 150ms ease",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = "var(--border-hover)";
        el.style.color = "var(--text-primary)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = "var(--border)";
        el.style.color = "var(--text-secondary)";
      }}
    >
      {name}
    </span>
  );
}
