"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { dictionaries } from "@/lib/i18n/dictionaries";

gsap.registerPlugin(ScrollTrigger);

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

  useGSAP(
    () => {
      if (!sectionRef.current) return;
      const cards = sectionRef.current.querySelectorAll(".skill-bento-card");
      if (cards.length === 0) return;

      gsap.fromTo(
        cards,
        { opacity: 0, y: 36 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.1,
          duration: 0.85,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
          },
        },
      );
    },
    { scope: sectionRef, dependencies: [activeTab, categories.length] },
  );

  return (
    <section ref={sectionRef} className="w-full py-10 md:py-16">
      {/* Editorial Section Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12 md:mb-16">
        <div>
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
              fontSize: "clamp(2rem, 4vw, 3rem)",
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
        className="relative z-10 font-mono text-[10px] tabular-nums"
        style={{
          color: active ? "rgba(255,255,255,0.85)" : "var(--text-muted)",
        }}
      >
        /{String(count).padStart(2, "0")}
      </span>
    </button>
  );
}

/* ─── 21st.dev Spotlight Category Card ─── */
function SkillCategoryCard({
  category,
  index,
}: {
  category: SkillCategory;
  index: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
  };

  return (
    <div
      ref={cardRef}
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

      {/* Top Architectural Accent Line */}
      <div
        className="absolute top-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-500 ease-out"
        style={{ background: "var(--accent)" }}
      />

      {/* Card Header */}
      <div className="relative z-10 flex items-baseline justify-between gap-4 pb-5 border-b border-[var(--border)]/60">
        <div className="flex items-baseline gap-3.5">
          <span
            className="font-mono text-xs tabular-nums"
            style={{ color: "var(--accent)", fontWeight: 600 }}
          >
            /{String(index + 1).padStart(2, "0")}
          </span>
          <h3
            style={{
              fontFamily: "var(--font-serif), serif",
              fontWeight: 400,
              fontSize: "clamp(1.35rem, 2.2vw, 1.65rem)",
              color: "var(--text-primary)",
              letterSpacing: "-0.015em",
              lineHeight: 1.2,
            }}
          >
            {category.title}
          </h3>
        </div>

        <span
          className="font-mono text-[11px] uppercase tracking-wider tabular-nums"
          style={{ color: "var(--text-muted)" }}
        >
          {category.skills.length} STACK
        </span>
      </div>

      {/* Interactive Tech Nodes */}
      <div className="relative z-10 flex flex-wrap gap-2.5">
        {category.skills.map((skill, skillIndex) => (
          <motion.span
            key={skill.name + skillIndex}
            whileHover={{ y: -3, scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 480, damping: 24 }}
            className="group/chip relative inline-flex items-center gap-2.5 px-3.5 py-2 select-none cursor-default transition-colors duration-200"
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: "0.8125rem",
              color: "var(--text-secondary)",
              background: "var(--bg-primary)",
              border: "1px solid var(--border)",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.borderColor = "var(--accent)";
              el.style.color = "var(--text-primary)";
              el.style.background =
                "color-mix(in srgb, var(--accent) 8%, var(--bg-primary))";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.borderColor = "var(--border)";
              el.style.color = "var(--text-secondary)";
              el.style.background = "var(--bg-primary)";
            }}
          >
            <span
              className="w-1.5 h-1.5 inline-block transition-transform duration-200 group-hover/chip:scale-125"
              style={{ background: "var(--accent)" }}
            />
            <span>{skill.name}</span>
          </motion.span>
        ))}
      </div>
    </div>
  );
}
