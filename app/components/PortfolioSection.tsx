"use client";

import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export interface Project {
  id: string;
  title: string;
  description: string;
  fullDescription: string;
  imageUrl: string;
  techStack: string[];
  link?: string;
}

interface PortfolioSectionProps {
  projects: Project[];
  showAllButton?: boolean;
}

export function PortfolioSection({ projects, showAllButton = false }: PortfolioSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Scroll Entrance Animation
  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top 85%",
        once: true
      }
    });

    tl.fromTo(sectionRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.1 }
    )
    .fromTo(".portfolio-title-container", 
      { opacity: 0, y: 15, filter: "blur(4px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.6, ease: "power3.out" }
    )
    .fromTo(".portfolio-card", 
      { opacity: 0, y: 20, filter: "blur(4px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.6, stagger: 0.15, ease: "power3.out" }, 
      "-=0.3"
    );
  }, { scope: sectionRef, dependencies: [] });

  const closeBtnRef = useRef<HTMLButtonElement>(null);
  
  // Lock body scroll when modal is open
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
    <section ref={sectionRef} className="w-full gpu opacity-0">
      <div className="portfolio-title-container flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-accent/10 text-accent">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-foreground">Portofolio</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {projects.map((project) => (
          <div
            key={project.id}
            className="portfolio-card group relative flex flex-col overflow-hidden rounded-2xl bg-card border border-border hover:border-accent/50 transition-colors duration-300 cursor-pointer"
            onClick={() => setSelectedProject(project)}
            onMouseEnter={(e) => {
              gsap.to(e.currentTarget.querySelector('.card-img'), { scale: 1.05, duration: 0.5, ease: "power2.out" });
            }}
            onMouseLeave={(e) => {
              gsap.to(e.currentTarget.querySelector('.card-img'), { scale: 1, duration: 0.5, ease: "power2.out" });
            }}
          >
            <div className="relative aspect-video w-full overflow-hidden bg-muted">
              <Image
                src={project.imageUrl}
                alt={project.title}
                fill
                className="card-img object-cover transition-transform"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <div className="p-4 flex flex-col flex-1">
              <h3 className="font-semibold text-foreground text-lg mb-1 group-hover:text-accent transition-colors">
                {project.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {project.description}
              </p>
              <div className="mt-auto flex flex-wrap gap-1.5">
                {project.techStack.slice(0, 3).map((tech, i) => (
                  <span key={i} className="px-2 py-1 text-[10px] font-medium rounded-md bg-accent/10 text-accent">
                    {tech}
                  </span>
                ))}
                {project.techStack.length > 3 && (
                  <span className="px-2 py-1 text-[10px] font-medium rounded-md bg-muted text-muted-foreground">
                    +{project.techStack.length - 3}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAllButton && (
        <div className="mt-8 flex justify-center">
          <a
            href="/portfolio"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-primary-foreground bg-primary rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
            onMouseEnter={(e) => gsap.to(e.currentTarget, { scale: 1.05, duration: 0.2 })}
            onMouseLeave={(e) => gsap.to(e.currentTarget, { scale: 1, duration: 0.2 })}
            onMouseDown={(e) => gsap.to(e.currentTarget, { scale: 0.95, duration: 0.1 })}
            onMouseUp={(e) => gsap.to(e.currentTarget, { scale: 1.05, duration: 0.2 })}
          >
            Lihat Semua Projek
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </a>
        </div>
      )}

      {/* Modal */}
      {selectedProject && (
        <ProjectModal 
          project={selectedProject} 
          onClose={() => setSelectedProject(null)} 
        />
      )}
    </section>
  );
}

// Modal Component
function ProjectModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useGSAP(() => {
    if (!mounted) return;
    
    // Animate overlay fade in
    gsap.fromTo(overlayRef.current, 
      { opacity: 0 }, 
      { opacity: 1, duration: 0.3, ease: "power2.out" }
    );
    
    // Animate modal pop in with bounce
    gsap.fromTo(modalRef.current,
      { scale: 0.8, opacity: 0, y: 20 },
      { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: "back.out(1.5)" }
    );
  }, { dependencies: [mounted] });

  const handleClose = () => {
    // Animate out before closing
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.2, ease: "power2.in" });
    gsap.to(modalRef.current, { 
      scale: 0.9, 
      opacity: 0, 
      y: 10, 
      duration: 0.2, 
      ease: "power2.in",
      onComplete: onClose
    });
  };

  if (!mounted) return null;

  return createPortal(
    <div 
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
      onClick={handleClose}
    >
      <div 
        ref={modalRef}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card rounded-2xl shadow-2xl shadow-black/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/20 text-white hover:bg-black/40 backdrop-blur-md transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal Content */}
        <div className="relative w-full aspect-video bg-muted">
          <Image
            src={project.imageUrl}
            alt={project.title}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 800px"
          />
        </div>
        
        <div className="p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            {project.title}
          </h2>
          
          <div className="flex flex-wrap gap-2 mb-6">
            {project.techStack.map((tech, i) => (
              <span key={i} className="px-3 py-1.5 text-xs font-medium rounded-full bg-accent/10 text-accent border border-accent/20">
                {tech}
              </span>
            ))}
          </div>

          <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none text-muted-foreground mb-8">
            <p className="whitespace-pre-wrap leading-relaxed">
              {project.fullDescription}
            </p>
          </div>

          {project.link && (
            <a 
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-primary-foreground bg-primary rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
              onMouseEnter={(e) => gsap.to(e.currentTarget, { scale: 1.05, duration: 0.2 })}
              onMouseLeave={(e) => gsap.to(e.currentTarget, { scale: 1, duration: 0.2 })}
              onMouseDown={(e) => gsap.to(e.currentTarget, { scale: 0.95, duration: 0.1 })}
              onMouseUp={(e) => gsap.to(e.currentTarget, { scale: 1.05, duration: 0.2 })}
            >
              Lihat Proyek
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
