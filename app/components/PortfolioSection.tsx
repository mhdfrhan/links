"use client";

import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

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
}

/**
 * PortfolioSection — Grid 2 kolom, card clean
 * bg-secondary, border 1px, hover translateY(-2px)
 * Tech tags: JetBrains Mono, bg-tertiary, rounded-md
 * Modal tetap berfungsi
 */
export function PortfolioSection({
  projects,
  showAllButton = false,
  categories = [],
}: PortfolioSectionProps) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

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
          03.
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
          Portofolio
        </h2>
        <div
          className="flex-1"
          style={{ height: "1px", background: "var(--border)" }}
        />
      </div>

      {/* Grid 2 kolom */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            categories={categories}
            onClick={() => setSelectedProject(project)}
          />
        ))}
      </div>

      {/* Button lihat semua */}
      {showAllButton && (
        <div className="mt-8 flex justify-center">
          <Link
            href="/portfolio"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm"
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: "0.8125rem",
              color: "var(--accent)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              background: "transparent",
              transition: "border-color 200ms ease, background 200ms ease",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.borderColor = "var(--border-hover)";
              el.style.background = "var(--bg-secondary)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.borderColor = "var(--border)";
              el.style.background = "transparent";
            }}
          >
            lihat semua project
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-3.5 h-3.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
              />
            </svg>
          </Link>
        </div>
      )}

      {/* Modal */}
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

/* ---- Project Card ---- */
function ProjectCard({
  project,
  categories,
  onClick,
}: {
  project: Project;
  categories: any[];
  onClick: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      className="flex flex-col overflow-hidden cursor-pointer"
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        transition: "border-color 200ms ease, transform 200ms ease",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = "var(--border-hover)";
        el.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = "var(--border)";
        el.style.transform = "translateY(0)";
      }}
    >
      {/* Thumbnail */}
      <div
        className="relative overflow-hidden"
        style={{ aspectRatio: "16/9", background: "var(--bg-tertiary)" }}
      >
        <Image
          src={project.imageUrl}
          alt={project.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Title */}
        <h3
          style={{
            fontWeight: 500,
            fontSize: "1rem",
            color: "var(--text-primary)",
            fontStyle: "normal",
            marginBottom: "0.375rem",
          }}
        >
          {project.title}
        </h3>

        {/* Description */}
        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--text-secondary)",
            lineHeight: 1.6,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            marginBottom: "0.875rem",
            flex: 1,
            fontStyle: "normal",
          }}
        >
          {project.description}
        </p>

        {/* Tech tags — JetBrains Mono */}
        <div className="flex flex-wrap gap-1.5 mt-auto">
          {project.techStack.slice(0, 4).map((tech, i) => (
            <span
              key={i}
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "0.6875rem",
                color: "var(--text-muted)",
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border)",
                borderRadius: "4px",
                padding: "0.15rem 0.4rem",
                fontStyle: "normal",
                fontWeight: 400,
              }}
            >
              {tech}
            </span>
          ))}
          {project.techStack.length > 4 && (
            <span
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "0.6875rem",
                color: "var(--text-muted)",
                background: "var(--bg-tertiary)",
                borderRadius: "4px",
                padding: "0.15rem 0.4rem",
              }}
            >
              +{project.techStack.length - 4}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---- Project Modal ---- */
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

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.3, ease: [0.2, 0.9, 0.3, 1] }}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          boxShadow: "0 20px 40px -10px rgba(0,0,0,0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 flex items-center justify-center"
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "6px",
            background: "var(--bg-tertiary)",
            border: "1px solid var(--border)",
            color: "var(--text-secondary)",
            cursor: "pointer",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18 18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Image */}
        <div
          className="relative w-full"
          style={{ aspectRatio: "16/9", background: "var(--bg-tertiary)" }}
        >
          <Image
            src={project.imageUrl}
            alt={project.title}
            fill
            className="object-cover"
            style={{ borderRadius: "12px 12px 0 0" }}
            sizes="(max-width: 1024px) 100vw, 800px"
          />
        </div>

        {/* Modal content */}
        <div className="p-6 md:p-8">
          <h2
            style={{
              fontWeight: 500,
              fontSize: "1.5rem",
              color: "var(--text-primary)",
              fontStyle: "normal",
              marginBottom: "1rem",
            }}
          >
            {project.title}
          </h2>

          {/* Category tags jika ada */}
          {project.categoryId && categories.find((c) => c.id === project.categoryId) && (
            <div className="flex flex-wrap gap-2 mb-5">
              <span
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: "0.7rem",
                  color: "var(--accent)",
                  background: "var(--bg-tertiary)",
                  border: "1px solid var(--border)",
                  borderRadius: "4px",
                  padding: "0.2rem 0.5rem",
                }}
              >
                {categories.find((c) => c.id === project.categoryId)?.name}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Deskripsi */}
            <div className="lg:col-span-2">
              <h3
                style={{
                  fontWeight: 500,
                  fontSize: "0.9375rem",
                  color: "var(--text-primary)",
                  fontStyle: "normal",
                  marginBottom: "0.75rem",
                }}
              >
                Tentang Projek
              </h3>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "var(--text-secondary)",
                  lineHeight: 1.7,
                  whiteSpace: "pre-wrap",
                  fontStyle: "normal",
                }}
              >
                {project.fullDescription || project.description}
              </p>
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
              {/* Tech stack */}
              {project.techStack && project.techStack.length > 0 && (
                <div>
                  <h3
                    style={{
                      fontWeight: 500,
                      fontSize: "0.9375rem",
                      color: "var(--text-primary)",
                      fontStyle: "normal",
                      marginBottom: "0.625rem",
                    }}
                  >
                    Teknologi
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {project.techStack.map((tech, i) => (
                      <span
                        key={i}
                        style={{
                          fontFamily: "var(--font-jetbrains-mono), monospace",
                          fontSize: "0.7rem",
                          color: "var(--text-secondary)",
                          background: "var(--bg-tertiary)",
                          border: "1px solid var(--border)",
                          borderRadius: "4px",
                          padding: "0.2rem 0.5rem",
                        }}
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Link */}
              {project.link && (
                <div>
                  <h3
                    style={{
                      fontWeight: 500,
                      fontSize: "0.9375rem",
                      color: "var(--text-primary)",
                      fontStyle: "normal",
                      marginBottom: "0.625rem",
                    }}
                  >
                    Tautan
                  </h3>
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2"
                    style={{
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                      fontSize: "0.8125rem",
                      color: "var(--accent)",
                      textDecoration: "none",
                      border: "1px solid var(--border)",
                      borderRadius: "6px",
                      padding: "0.4rem 0.75rem",
                      background: "var(--bg-tertiary)",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.375rem",
                      width: "100%",
                      justifyContent: "center",
                    }}
                  >
                    Kunjungi Projek
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-3.5 h-3.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                      />
                    </svg>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}
