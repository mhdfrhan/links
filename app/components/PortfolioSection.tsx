"use client";

import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

export interface Project {
  id: string;
  title: string;
  description: string;
  fullDescription?: string;
  imageUrl: string;
  techStack: string[];
  link?: string;
  categoryId?: string;
  subCategoryId?: string;
  order?: number;
}

interface PortfolioSectionProps {
  projects: Project[];
  showAllButton?: boolean;
  categories?: any[];
  columns?: number;
  horizontalScroll?: boolean;
}

/**
 * PortfolioSection — Modern Vibrant Showcase
 * Asymmetrical grid, glassmorphism overlays, GSAP animations.
 */
export function PortfolioSection({
  projects,
  showAllButton = false,
  categories = [],
  columns = 2,
  horizontalScroll = false,
}: PortfolioSectionProps) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const { language } = useLanguage();
  const dict = dictionaries[language].projects;
  const sectionRef = useRef<HTMLElement>(null);

  // Lock body & Lenis scroll when modal open
  useEffect(() => {
    if (selectedProject) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      document.documentElement.classList.add("lenis-stopped");
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.documentElement.classList.remove("lenis-stopped");
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.documentElement.classList.remove("lenis-stopped");
    };
  }, [selectedProject]);

  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (horizontalScroll) {
        const section = sectionRef.current;
        const container = containerRef.current;
        if (!section || !container) return;

        // Horizontal scroll animation for the container
        const wrapper = container.parentElement;
        const scrollTween = gsap.to(container, {
          x: () => -(container.scrollWidth - window.innerWidth),
          ease: "none",
          scrollTrigger: {
            trigger: wrapper,
            start: "center 55%", // Pin slightly below the true center to give breathing room for the header
            end: () => `+=${container.scrollWidth - window.innerWidth}`,
            pin: section,
            scrub: true, // Change from 1 to true to prevent double-smoothing conflict with Lenis
            invalidateOnRefresh: true,
          },
        });

        // Coverflow scale effect for each card
        const cards = gsap.utils.toArray<HTMLElement>(".horizontal-project-card");
        cards.forEach((card) => {
          gsap.set(card, { scale: 0.85, opacity: 0.4 });

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: card,
              containerAnimation: scrollTween,
              start: "left right", // Left edge enters screen from right
              end: "right left",   // Right edge leaves screen to left
              scrub: true,
            }
          });

          // Animate to 1 in the first half (center), back to 0.85 in second half
          tl.to(card, { scale: 1, opacity: 1, ease: "power1.inOut", duration: 1, force3D: true })
            .to(card, { scale: 0.85, opacity: 0.4, ease: "power1.inOut", duration: 1, force3D: true });
        });
      } else {
        gsap.fromTo(
          ".project-card",
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            stagger: 0.15,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 75%",
            },
          }
        );
      }
    },
    { scope: sectionRef, dependencies: [horizontalScroll, projects.length] }
  );

  return (
    <section ref={sectionRef} className="w-full py-12 md:py-24">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
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
              fontSize: "clamp(2rem, 4vw, 3rem)",
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
              lineHeight: 1.1,
            }}
          >
            {dict.title}
          </h2>
        </div>
        
        {showAllButton && (
          <Link
            href="/portfolio"
            className="group flex items-center gap-3 text-sm font-medium"
            style={{ color: "var(--text-primary)", textDecoration: "none" }}
          >
            <span className="border-b border-transparent group-hover:border-[var(--accent)] transition-colors duration-300">
              {dict.viewAll}
            </span>
            <div className="w-8 h-8 border border-[var(--border)] flex items-center justify-center group-hover:bg-[var(--accent)] group-hover:border-[var(--accent)] transition-all duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 group-hover:text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" />
              </svg>
            </div>
          </Link>
        )}
      </div>

      {/* Modern Editorial Grid / Horizontal Scroll */}
      {horizontalScroll ? (
        <div className="w-[100vw] overflow-hidden relative left-[50%] right-[50%] -ml-[50vw] -mr-[50vw]">
          <div 
            ref={containerRef}
            className="flex flex-nowrap items-center gap-6 md:gap-12 w-max px-[10vw] sm:px-[20vw] lg:px-[30vw] will-change-transform"
          >
            {projects.map((project, index) => (
              <div 
                key={project.id} 
                className="horizontal-project-card w-[80vw] sm:w-[60vw] lg:w-[40vw] flex-shrink-0 origin-center will-change-transform"
              >
                <ProjectCard
                  project={project}
                  index={index}
                  categories={categories}
                  onClick={() => setSelectedProject(project)}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div 
          className={
            columns === 3
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10 md:gap-x-8 md:gap-y-12"
              : "grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12 md:gap-x-12 md:gap-y-16"
          }
        >
          {projects.map((project, index) => (
            <div key={project.id} className="project-card">
              <ProjectCard
                project={project}
                index={index}
                categories={categories}
                onClick={() => setSelectedProject(project)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Modern Sleek Modal */}
      <AnimatePresence>
        {selectedProject && (
          <ProjectModal
            project={selectedProject}
            onClose={() => setSelectedProject(null)}
            categories={categories}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

/* ---- Modern Editorial Project Card ---- */
function ProjectCard({
  project,
  index,
  categories,
  onClick,
}: {
  project: Project;
  index: number;
  categories: any[];
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="group relative w-full overflow-hidden cursor-pointer flex flex-col transition-all duration-300"
      style={{ background: "transparent" }}
    >
      {/* Image Container with Sharp Border */}
      <div 
        className="relative w-full overflow-hidden border border-[var(--border)] transition-colors duration-300 group-hover:border-[var(--accent)]"
        style={{ aspectRatio: "16/10", background: "var(--bg-tertiary)" }}
      >
        <Image
          src={project.imageUrl}
          alt={project.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        {/* Accent hover glow */}
        <div className="absolute inset-0 bg-[var(--accent)]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>
      
      {/* Content Area Below Image */}
      <div className="pt-5 flex flex-col flex-1">
        <div className="flex justify-between items-center mb-2.5">
          <span className="text-[0.75rem] uppercase tracking-wider text-[var(--accent)] font-semibold">
            {project.categoryId ? categories.find(c => c.id === project.categoryId)?.name || "Project" : "Project"}
          </span>
          <span className="text-[0.75rem] text-[var(--text-muted)] font-medium">
            /{String(index + 1).padStart(2, "0")}
          </span>
        </div>

        <h3
          className="font-sans text-xl md:text-2xl text-[var(--text-primary)] mb-2.5 group-hover:text-[var(--accent)] transition-colors duration-300"
          style={{ fontWeight: 600, fontStyle: "normal", lineHeight: 1.25 }}
        >
          {project.title}
        </h3>

        <p className="text-[0.9rem] text-[var(--text-secondary)] line-clamp-2 mb-4 leading-relaxed">
          {project.description}
        </p>

        <div className="mt-auto pt-3 border-t border-[var(--border)]/40 flex justify-between items-center">
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[0.75rem] text-[var(--text-muted)] font-medium">
            {project.techStack.slice(0, 3).map(tech => (
              <span key={tech}>#{tech}</span>
            ))}
          </div>
          <span className="text-[0.75rem] font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors flex items-center gap-1">
            details ↗
          </span>
        </div>
      </div>
    </div>
  );
}

/* ---- Smart Textarea Formatter (Paragraphs, Section Headers, Bullet Lists & Numbered Lists) ---- */
type ParsedBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: Array<{ num: string; text: string }> };

function parseProjectDescription(raw: string): ParsedBlock[] {
  if (!raw) return [];

  // 1. Normalize line endings and break inline bullets (•, ●, ▪, ◦) onto new lines
  let normalized = raw
    .replace(/\r\n/g, "\n")
    .replace(/\s*[•●▪◦]\s+/g, "\n• ");

  // 2. Break inline numbered items (e.g. "1. Foo 2. Bar" after start/newline/punctuation)
  normalized = normalized.replace(
    /(^|\n|[.!?:;])\s+(\d{1,2}[.)])\s+(?=[A-ZÀ-Ža-z0-9])/g,
    "$1\n$2 ",
  );

  // 3. Break inline dash bullets when preceded by newline or colon (e.g. "Fitur: - Item A - Item B")
  normalized = normalized.replace(/(^|\n|:)\s+-\s+/g, "$1\n- ");

  // 4. Separate trailing short section headings before a list (e.g. "...berantakan. Fitur Utama:\n•")
  normalized = normalized.replace(
    /([.!?])\s+([A-ZÀ-Ž][A-Za-zÀ-ž0-9\s&/()-]{2,42}:)\s*(?=\n|$)/g,
    "$1\n$2",
  );

  const lines = normalized
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const blocks: ParsedBlock[] = [];

  for (const line of lines) {
    // Bullet item: starts with •, -, or *
    const bulletMatch = line.match(/^(?:[•●▪◦]|[-*])\s+(.+)$/);
    if (bulletMatch) {
      const itemText = bulletMatch[1].trim();
      const prev = blocks[blocks.length - 1];
      if (prev && prev.type === "ul") {
        prev.items.push(itemText);
      } else {
        blocks.push({ type: "ul", items: [itemText] });
      }
      continue;
    }

    // Numbered item: starts with 1. or 1)
    const numMatch = line.match(/^(\d{1,2})[.)]\s+(.+)$/);
    if (numMatch) {
      const num = numMatch[1];
      const itemText = numMatch[2].trim();
      const prev = blocks[blocks.length - 1];
      if (prev && prev.type === "ol") {
        prev.items.push({ num, text: itemText });
      } else {
        blocks.push({ type: "ol", items: [{ num, text: itemText }] });
      }
      continue;
    }

    // Short heading line ending with ":" (e.g. "Fitur Utama:", "Key Features:")
    if (line.endsWith(":") && line.length <= 55) {
      blocks.push({ type: "heading", text: line });
      continue;
    }

    blocks.push({ type: "paragraph", text: line });
  }

  return blocks;
}

function renderFormattedItemText(text: string) {
  const colonIdx = text.indexOf(":");
  if (colonIdx > 0 && colonIdx <= 48) {
    const label = text.slice(0, colonIdx);
    const rest = text.slice(colonIdx + 1).trim();
    if (rest.length > 0) {
      return (
        <>
          <strong
            className="font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {label}:
          </strong>{" "}
          <span>{rest}</span>
        </>
      );
    }
  }
  return <span>{text}</span>;
}

function FormattedProjectDescription({ text }: { text: string }) {
  const blocks = parseProjectDescription(text);

  return (
    <div className="space-y-4">
      {blocks.map((block, idx) => {
        if (block.type === "heading") {
          return (
            <h4
              key={idx}
              className="pt-2 text-xs uppercase tracking-wider font-semibold"
              style={{ color: "var(--accent)" }}
            >
              {block.text}
            </h4>
          );
        }

        if (block.type === "ul") {
          return (
            <ul key={idx} className="space-y-2.5 pl-1">
              {block.items.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-[0.9375rem] leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <span
                    className="w-1.5 h-1.5 mt-2 flex-shrink-0 inline-block"
                    style={{ background: "var(--accent)" }}
                  />
                  <div className="flex-1">{renderFormattedItemText(item)}</div>
                </li>
              ))}
            </ul>
          );
        }

        if (block.type === "ol") {
          return (
            <ol key={idx} className="space-y-2.5 pl-1">
              {block.items.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 text-[0.9375rem] leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <span
                    className="text-xs font-semibold tabular-nums mt-0.5 flex-shrink-0"
                    style={{ color: "var(--accent)", minWidth: "1.5rem" }}
                  >
                    {item.num.padStart(2, "0")}.
                  </span>
                  <div className="flex-1">
                    {renderFormattedItemText(item.text)}
                  </div>
                </li>
              ))}
            </ol>
          );
        }

        return (
          <p
            key={idx}
            className="text-[0.95rem] leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            {block.text}
          </p>
        );
      })}
    </div>
  );
}

/* ---- Sleek Editorial Modal (Top Image + Bottom Content & Scroll Lock) ---- */
function ProjectModal({
  project,
  onClose,
  categories = [],
}: {
  project: Project;
  onClose: () => void;
  categories?: Array<{ id: string; name: string }>;
}) {
  const [mounted, setMounted] = useState(false);
  const { language } = useLanguage();
  const dict = dictionaries[language].projects;

  useEffect(() => {
    setMounted(true);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!mounted) return null;

  const categoryName = project.categoryId
    ? categories.find((c) => c.id === project.categoryId)?.name
    : undefined;

  return createPortal(
    <motion.div
      data-lenis-prevent
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-10"
      style={{
        background: "rgba(9, 9, 11, 0.82)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
      onClick={onClose}
      onWheel={(e) => e.stopPropagation()}
    >
      <motion.div
        data-lenis-prevent
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-3xl max-h-[88dvh] flex flex-col overflow-hidden"
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          boxShadow: "0 24px 60px -15px rgba(0, 0, 0, 0.65)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pinned Top-Right Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 z-30 flex items-center justify-center border border-[var(--border)] bg-[var(--bg-primary)]/85 backdrop-blur-md text-[var(--text-primary)] hover:text-white hover:bg-[var(--accent)] hover:border-[var(--accent)] transition-all duration-300 w-10 h-10 cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18 18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Scrollable Modal Container (Image on Top, Content Below) */}
        <div
          data-lenis-prevent
          className="modal-scroll flex-1 overflow-y-auto flex flex-col"
        >
          {/* Top Full-Width Project Image */}
          <div
            className="relative w-full flex-shrink-0 overflow-hidden"
            style={{
              aspectRatio: "16/9",
              background: "var(--bg-tertiary)",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <Image
              src={project.imageUrl}
              alt={project.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
              priority
            />
          </div>

          {/* Bottom Content Area: Category -> Title -> Formatted Description -> Tech Stack -> Action */}
          <div className="p-6 sm:p-8 md:p-10 flex flex-col gap-6">
            <div>
              {categoryName && (
                <span
                  className="mb-2.5 inline-block text-[0.75rem] tracking-wider uppercase font-semibold"
                  style={{ color: "var(--accent)" }}
                >
                  // {categoryName}
                </span>
              )}

              <h2
                style={{
                  fontFamily: "var(--font-plus-jakarta), sans-serif",
                  fontSize: "clamp(1.65rem, 3.2vw, 2.35rem)",
                  color: "var(--text-primary)",
                  lineHeight: 1.18,
                  fontWeight: 700,
                }}
              >
                {project.title}
              </h2>
            </div>

            {/* Formatted Description (Supports bullets, numbered lists & paragraphs) */}
            <FormattedProjectDescription
              text={project.fullDescription || project.description}
            />

            {/* Tech Stack & Action Footer */}
            <div
              className="pt-6 mt-2 space-y-6"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <div>
                <h4
                  className="text-[0.75rem] uppercase tracking-widest mb-3 font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {dict.techLabel}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {project.techStack.map((tech, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 text-xs font-medium"
                      style={{
                        background: "var(--bg-primary)",
                        color: "var(--text-secondary)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {project.link && (
                <a
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-center gap-3 w-full py-4 text-[0.8125rem] font-semibold uppercase tracking-wider transition-all duration-300 border border-[var(--accent)] no-underline"
                  style={{
                    background: "var(--accent)",
                    color: "#fff",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--accent)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--accent)";
                    e.currentTarget.style.color = "#fff";
                  }}
                >
                  <span>{dict.viewProject}</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3"
                    />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
      </motion.div>
      <style>{`
        .modal-scroll::-webkit-scrollbar { width: 5px; }
        .modal-scroll::-webkit-scrollbar-track { background: transparent; }
        .modal-scroll::-webkit-scrollbar-thumb { background: var(--border); }
        .modal-scroll { scrollbar-width: thin; scrollbar-color: var(--border) transparent; }
      `}</style>
    </motion.div>,
    document.body,
  );
}
