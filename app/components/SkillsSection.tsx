"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { useRevealOnView } from "@/lib/utils/useRevealOnView";

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
 * SkillsSection — 2026 Awwwards / 21st.dev / Framer Editorial Tech Matrix
 * - Tipografi editorial (Playfair Display + JetBrains Mono) selaras dengan PortfolioSection
 * - Filter tab interaktif dengan sliding indicator (Framer layoutId)
 * - Kartu kategori dengan Cursor Spotlight 21st.dev & animasi GSAP ScrollTrigger
 */
export function SkillsSection({ categories }: SkillsSectionProps) {
  const { language } = useLanguage();
  const dict = dictionaries[language].skills;
  const sectionRef = useRef<HTMLElement>(null);
  const [activeTab, setActiveTab] = useState<string>("all");

  const totalSkills = categories.reduce(
    (sum, cat) => sum + (cat.skills?.length || 0),
    0,
  );

  const visibleCategories =
    activeTab === "all"
      ? categories
      : categories.filter((c) => c.title === activeTab);

  useRevealOnView(sectionRef, ".skill-bento-card", [categories.length]);

  return (
    <section ref={sectionRef} className="w-full py-10 md:py-16">
      {/* Editorial Section Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12 md:mb-16">
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

        {/* 21st.dev / Framer Interactive Filter Strip */}
        {categories.length > 1 && (
          <div
            className="flex flex-wrap items-center gap-1.5 p-1.5 self-start lg:self-auto"
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
            }}
          >
            <FilterTab
              label={language === "id" ? "Semua" : "All"}
              count={totalSkills}
              active={activeTab === "all"}
              onClick={() => setActiveTab("all")}
            />
            {categories.map((cat) => (
              <FilterTab
                key={cat.title}
                label={cat.title}
                count={cat.skills.length}
                active={activeTab === cat.title}
                onClick={() => setActiveTab(cat.title)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Architectural Spotlight Bento Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className={
            visibleCategories.length === 1
              ? "grid grid-cols-1 gap-6"
              : "grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8"
          }
        >
          {visibleCategories.map((category, catIndex) => (
            <SkillCategoryCard
              key={category.title}
              category={category}
              index={catIndex}
            />
          ))}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

/* ─── Framer Sliding Filter Tab ─── */
function FilterTab({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative px-3.5 py-2 text-xs font-medium cursor-pointer transition-colors select-none flex items-center gap-2"
      style={{
        fontFamily: "var(--font-plus-jakarta), sans-serif",
        color: active ? "#ffffff" : "var(--text-secondary)",
      }}
    >
      {active && (
        <motion.span
          layoutId="skills-active-filter"
          transition={{ type: "spring", stiffness: 460, damping: 34 }}
          className="absolute inset-0 z-0"
          style={{ background: "var(--accent)" }}
        />
      )}
      <span className="relative z-10">{label}</span>
      <span
        className="relative z-10 text-[11px] font-semibold tabular-nums"
        style={{
          color: active ? "rgba(255,255,255,0.85)" : "var(--text-muted)",
        }}
      >
        /{String(count).padStart(2, "0")}
      </span>
    </button>
  );
}

/* ─── 21st.dev Spotlight Category Card (Zero Layout-Thrash Rect Caching) ─── */
function SkillCategoryCard({
  category,
  index,
}: {
  category: SkillCategory;
  index: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const rectRef = useRef<DOMRect | null>(null);

  const handleMouseEnter = () => {
    if (cardRef.current) {
      rectRef.current = cardRef.current.getBoundingClientRect();
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    const rect = rectRef.current;
    if (!el || !rect) return;
    el.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
  };

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      className="skill-bento-card group relative overflow-hidden p-6 sm:p-8 flex flex-col justify-between gap-8 transition-colors duration-300"
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border)",
      }}
    >
      {/* 21st.dev Cursor Spotlight Overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background:
            "radial-gradient(420px circle at var(--spot-x, 50%) var(--spot-y, 50%), color-mix(in srgb, var(--accent) 12%, transparent), transparent 70%)",
        }}
      />

      {/* Top Architectural Accent Line (GPU scaleX only) */}
      <div
        className="gpu-sweep-bar absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: "var(--accent)" }}
      />

      {/* Card Header */}
      <div className="relative z-10 flex items-baseline justify-between gap-4 pb-5 border-b border-[var(--border)]/60">
        <div className="flex items-baseline gap-3.5">
          <span
            className="text-xs font-semibold tabular-nums"
            style={{ color: "var(--accent)" }}
          >
            /{String(index + 1).padStart(2, "0")}
          </span>
          <h3
            style={{
              fontFamily: "var(--font-plus-jakarta), sans-serif",
              fontWeight: 700,
              fontSize: "clamp(1.15rem, 1.8vw, 1.35rem)",
              color: "var(--text-primary)",
              letterSpacing: "-0.015em",
              lineHeight: 1.2,
            }}
          >
            {category.title}
          </h3>
        </div>

        <span
          className="text-[11px] font-semibold uppercase tracking-wider tabular-nums"
          style={{ color: "var(--text-muted)" }}
        >
          {category.skills.length} STACK
        </span>
      </div>

      {/* Interactive Tech Nodes (CSS GPU transform + color transitions) */}
      <div className="relative z-10 flex flex-wrap gap-2.5">
        {category.skills.map((skill, skillIndex) => (
          <span
            key={skill.name + skillIndex}
            className="group/chip relative inline-flex items-center gap-2.5 px-3.5 py-2 select-none cursor-default transition-[transform,border-color,color,background-color] duration-200 hover:-translate-y-0.5 active:scale-95 bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
            style={{
              fontFamily: "var(--font-plus-jakarta), sans-serif",
              fontSize: "0.8125rem",
              fontWeight: 500,
            }}
          >
            <span
              className="w-1.5 h-1.5 inline-block transition-transform duration-200 group-hover/chip:scale-125"
              style={{ background: "var(--accent)" }}
            />
            <span>{skill.name}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
