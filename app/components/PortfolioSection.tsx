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

  // Lock body scroll when modal open
  useEffect(() => {
    if (selectedProject) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
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
            scrub: 1,
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
          tl.to(card, { scale: 1, opacity: 1, ease: "power1.inOut", duration: 1 })
            .to(card, { scale: 0.85, opacity: 0.4, ease: "power1.inOut", duration: 1 });
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
            className="flex flex-nowrap items-center gap-6 md:gap-12 w-max px-[10vw] sm:px-[20vw] lg:px-[30vw]"
          >
            {projects.map((project, index) => (
              <div 
                key={project.id} 
                className="horizontal-project-card w-[80vw] sm:w-[60vw] lg:w-[40vw] flex-shrink-0 origin-center"
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
          <span className="font-mono text-[0.75rem] uppercase tracking-wider text-[var(--accent)] font-semibold">
            {project.categoryId ? categories.find(c => c.id === project.categoryId)?.name || "Project" : "Project"}
          </span>
          <span className="font-mono text-[0.75rem] text-[var(--text-muted)]">
            /{String(index + 1).padStart(2, "0")}
          </span>
        </div>

        <h3
          className="font-serif text-xl md:text-2xl text-[var(--text-primary)] mb-2.5 group-hover:text-[var(--accent)] transition-colors duration-300"
          style={{ fontWeight: 400, fontStyle: "normal", lineHeight: 1.25 }}
        >
          {project.title}
        </h3>

        <p className="text-[0.9rem] text-[var(--text-secondary)] line-clamp-2 mb-4 leading-relaxed">
          {project.description}
        </p>

        <div className="mt-auto pt-3 border-t border-[var(--border)]/40 flex justify-between items-center">
          <div className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-[0.7rem] text-[var(--text-muted)]">
            {project.techStack.slice(0, 3).map(tech => (
              <span key={tech}>#{tech}</span>
            ))}
          </div>
          <span className="font-mono text-[0.75rem] text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors flex items-center gap-1">
            details ↗
          </span>
        </div>
      </div>
    </div>
  );
}

/* ---- Sleek Glass Modal ---- */
function ProjectModal({
  project,
  onClose,
  categories = [],
}: {
  project: Project;
  onClose: () => void;
  categories?: any[];
}) {
  const [mounted, setMounted] = useState(false);
  const { language } = useLanguage();
  const dict = dictionaries[language].projects;

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-12"
      style={{ background: "rgba(11, 17, 32, 0.85)", backdropFilter: "blur(16px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 15, scale: 0.98 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-5xl max-h-[85vh] overflow-y-auto flex flex-col md:flex-row hide-scrollbar"
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          boxShadow: "0 30px 60px -15px rgba(0,0,0,0.6)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button with Accent Hover */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-20 flex items-center justify-center border border-[var(--border)] bg-[var(--bg-primary)]/80 backdrop-blur-md text-[var(--text-primary)] hover:text-white hover:bg-[var(--accent)] hover:border-[var(--accent)] transition-all duration-300 w-10 h-10 cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Left Side: Image Cover */}
        <div className="w-full md:w-1/2 relative min-h-[300px] md:min-h-full">
          <Image
            src={project.imageUrl}
            alt={project.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[var(--bg-secondary)] opacity-0 md:opacity-100" />
        </div>

        {/* Right Side: Content */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col">
          {/* Category */}
          {project.categoryId && categories.find((c) => c.id === project.categoryId) && (
            <span
              className="mb-4 inline-block font-mono text-[0.75rem] tracking-wider uppercase font-semibold"
              style={{ color: "var(--accent)" }}
            >
              {categories.find((c) => c.id === project.categoryId)?.name}
            </span>
          )}

          <h2
            style={{
              fontFamily: "var(--font-serif), serif",
              fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)",
              color: "var(--text-primary)",
              lineHeight: 1.15,
              marginBottom: "1.5rem",
              fontWeight: 400,
            }}
          >
            {project.title}
          </h2>

          <p
            className="text-[0.95rem] leading-relaxed mb-8"
            style={{ color: "var(--text-secondary)" }}
          >
            {project.fullDescription || project.description}
          </p>

          <div className="mt-auto space-y-8">
            {/* Tech Stack */}
            <div>
              <h4 className="text-[0.75rem] font-mono uppercase tracking-widest mb-3" style={{ color: "var(--text-primary)" }}>
                {dict.techLabel}
              </h4>
              <div className="flex flex-wrap gap-2">
                {project.techStack.map((tech, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 text-xs font-mono"
                    style={{
                      background: "var(--bg-tertiary)",
                      color: "var(--text-secondary)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* View Button (Editorial Style) */}
            {project.link && (
              <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-center gap-3 w-full py-4 font-mono text-[0.8rem] uppercase tracking-wider transition-all duration-300 border border-[var(--accent)]"
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
                {dict.viewProject}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 group-hover:translate-x-1 transition-transform">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" />
                </svg>
              </a>
            )}
          </div>
        </div>
      </motion.div>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </motion.div>,
    document.body
  );
}
