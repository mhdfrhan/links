"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion, AnimatePresence } from "framer-motion";
import { SocialLink as ISocialLink, getPlatformPrefix } from "./SocialLinks";

gsap.registerPlugin(ScrollTrigger);

interface CvEntry {
  url: string;
  fileName: string;
  fileSize: number;
}

interface ProfileHeaderProps {
  name: string;
  tagline: string;
  avatarUrl?: string;
  about?: string;
  cvData?: { id?: CvEntry; en?: CvEntry } | null;
  email?: string;
  github?: string;
  linkedin?: string;
  socialLinks?: ISocialLink[];
}

function formatExperienceText(text: string): string {
  if (!text) return "";
  const years = new Date().getFullYear() - 2022;
  
  let formatted = text.replace(/(pengalaman\s+(?:[^]*?))\b\d+\b(\s+tahun)/gi, `$1${years}$2`);
  formatted = formatted.replace(/(experience\s+(?:[^]*?))\b\d+\b(\s+years)/gi, `$1${years}$2`);
  formatted = formatted.replace(/\b4\s*tahun/gi, `${years} tahun`);
  formatted = formatted.replace(/\b4\s*years/gi, `${years} years`);
  return formatted;
}

/**
 * ProfileHeader — Vibrant Editorial Hero
 * Full landscape image, rich typography, and GSAP animations.
 */
export function ProfileHeader({
  name = "Muhammad Farhan",
  tagline = "Web Developer",
  avatarUrl = "/img/foto.jpg",
  about = "",
  cvData = null,
  email,
  github,
  linkedin,
  socialLinks,
}: ProfileHeaderProps) {
  const { language } = useLanguage();
  const dict = dictionaries[language];

  const containerRef = useRef<HTMLElement>(null);

  // Clean tagline to be professional and natural (avoiding AI/emoji clutter)
  const cleanTagline = (() => {
    if (language === "id") {
      return "Fullstack Web Developer";
    }
    if (!tagline) return "Fullstack Web Developer";
    if (tagline.includes("🎓") || tagline.includes("💻") || tagline.includes("|")) {
      const parts = tagline.split("|").map(p => p.trim());
      const devPart = parts.find(p => p.toLowerCase().includes("developer") || p.toLowerCase().includes("web") || p.toLowerCase().includes("engineer"));
      if (devPart) {
        return devPart.replace(/[🎓💻🌟]/g, "").trim();
      }
    }
    return tagline.replace(/[🎓💻🌟]/g, "").trim();
  })();

  const [taglineIndex, setTaglineIndex] = useState(0);

  // Generate words to rotate (keeps Firebase database tagline first, then transitions to others)
  const taglineWords = (() => {
    const list = [cleanTagline];
    
    // Add the user requested taglines
    list.push("UI/UX Designer", "Mobile Developer");
    
    if (language === "id") {
      list.push("Programmer Kreatif");
    } else {
      list.push("Creative Programmer");
    }
    return Array.from(new Set(list));
  })();

  useEffect(() => {
    if (taglineWords.length <= 1) return;
    const interval = setInterval(() => {
      setTaglineIndex((prev) => (prev + 1) % taglineWords.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [taglineWords]);

  // GSAP Entrance + Smooth Hero Banner Parallax on Scroll
  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out", duration: 1 } });

      tl.fromTo(
        ".hero-text",
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, stagger: 0.1 },
      )
        .fromTo(
          ".hero-image",
          { opacity: 0, scale: 0.96 },
          { opacity: 1, scale: 1, duration: 1.2 },
          "-=0.6",
        )
        .fromTo(
          ".hero-meta",
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, stagger: 0.1 },
          "-=0.8",
        );

      // Smooth Parallax Window Effect on Scroll
      gsap.fromTo(
        ".hero-parallax-layer",
        { yPercent: -12, scale: 1.1 },
        {
          yPercent: 12,
          scale: 1,
          ease: "none",
          scrollTrigger: {
            trigger: ".hero-image",
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        },
      );
    },
    { scope: containerRef },
  );

  return (
    <section ref={containerRef} className="w-full relative pt-8 md:pt-16 z-10">
      {/* Massive Typography Hero */}
      <h1 
        className="hero-text"
        style={{
          fontFamily: "var(--font-plus-jakarta), sans-serif",
          fontWeight: 700,
          fontSize: "clamp(1.75rem, 4.2vw, 3rem)",
          lineHeight: 1.1,
          color: "var(--text-primary)",
          letterSpacing: "-0.02em",
          maxWidth: "1000px",
          marginBottom: "1.5rem",
          textWrap: "balance"
        }}
      >
        {name} <br/>
        <span className="min-h-[2.2em] md:min-h-0" style={{ color: "var(--accent)", display: "inline-grid", gridTemplateColumns: "1fr", justifyItems: "start", alignItems: "start" }}>
          <AnimatePresence mode="wait">
            <motion.span
              key={taglineIndex}
              initial={{ y: 15, opacity: 0, filter: "blur(4px)" }}
              animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
              exit={{ y: -15, opacity: 0, filter: "blur(4px)" }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              style={{ gridArea: "1/1/2/2", whiteSpace: "normal", wordBreak: "keep-all" }}
            >
              {taglineWords[taglineIndex]}
            </motion.span>
          </AnimatePresence>
        </span>
      </h1>

      {/* Full Width Image Banner with Smooth Scroll Parallax */}
      <div className="w-screen relative left-1/2 -translate-x-1/2 mb-12 overflow-hidden hero-image">
        <div
          className="relative w-full overflow-hidden"
          style={{
            aspectRatio: "21/9",
            background: "var(--bg-tertiary)",
          }}
        >
          <div className="hero-parallax-layer absolute inset-x-0 -top-[16%] h-[132%] will-change-transform">
            <Image
              src={avatarUrl}
              alt={`Photo of ${name}`}
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
          </div>
        </div>
      </div>

      {/* Aligned Editorial Bottom Section under Banner */}
      <div className="hero-meta flex flex-col gap-6 pt-2">
        {/* Top Row: Availability badge on left, Social Links on right */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[var(--border)]/60">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span
                className="animate-ping absolute inline-flex h-full w-full opacity-75"
                style={{ backgroundColor: "var(--green)" }}
              />
              <span
                className="relative inline-flex h-2 w-2"
                style={{ backgroundColor: "var(--green)" }}
              />
            </span>
            <span
              style={{
                fontFamily: "var(--font-plus-jakarta), sans-serif",
                fontSize: "0.75rem",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--text-secondary)",
                fontWeight: 600,
              }}
            >
              {dict.hero.availability || "Available for work"}
            </span>
          </div>

          {/* Social Links Row */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            {socialLinks && socialLinks.length > 0 ? (
              [...socialLinks]
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map((link, idx) => (
                  <SocialLink
                    key={link.platform + idx}
                    href={getPlatformPrefix(link.platform, link.url)}
                    label={link.label || link.platform}
                  />
                ))
            ) : (
              <>
                <SocialLink href={github || "https://github.com/mhdfrhan"} label="GitHub" />
                <SocialLink href={linkedin || "https://linkedin.com"} label="LinkedIn" />
                <SocialLink href={`mailto:${email || "hi.mhdfarhan@gmail.com"}`} label="Email" />
              </>
            )}
          </div>
        </div>

        {/* Bottom Row: Action buttons (Download CV & Scroll to Projects) */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
          <div className="flex flex-wrap items-center gap-3">
            {cvData && (cvData.id || cvData.en) && (
              <CvDownloadButton cvData={cvData} />
            )}
            <a
              href="#projects"
              className="px-5 py-2.5 flex items-center gap-2 text-sm font-semibold transition-all duration-300 border no-underline group"
              style={{
                background: "transparent",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
                fontFamily: "var(--font-sans), system-ui, sans-serif",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
                e.currentTarget.style.color = "var(--accent)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.color = "var(--text-primary)";
              }}
            >
              <span>{language === "id" ? "Lihat Projek" : "Explore Projects"}</span>
              <span className="text-xs transition-transform duration-300 group-hover:translate-y-0.5 font-semibold" style={{ color: "var(--accent)" }}>↓</span>
            </a>
          </div>

          <span
            className="text-xs text-[var(--text-muted)] tracking-wider font-medium"
            style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}
          >
            // PEKANBARU, ID
          </span>
        </div>
      </div>
    </section>
  );
}

/* ---- Simple Social Link with Accent Arrow ---- */
function SocialLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex items-center gap-1.5 text-xs sm:text-[0.8125rem] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors no-underline"
      style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}
    >
      <span>{label}</span>
      <span className="text-[10px] text-[var(--accent)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">↗</span>
    </a>
  );
}

/* ---- Format file size ---- */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ---- CV Download Button with Dropdown ---- */
function CvDownloadButton({ cvData }: { cvData: { id?: CvEntry; en?: CvEntry } }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { language } = useLanguage();
  const dict = dictionaries[language];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-5 py-2.5  flex items-center justify-center gap-2 transition-all duration-300 relative group overflow-hidden border"
        style={{
          background: "color-mix(in srgb, var(--accent) 10%, transparent)",
          borderColor: "color-mix(in srgb, var(--accent) 30%, transparent)",
          color: "var(--accent)",
          fontFamily: "var(--font-sans), system-ui, sans-serif",
          fontSize: "0.875rem",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        <span className="relative z-10">{dict.hero.downloadCv}</span>
        <span className="relative z-10 transition-transform duration-300" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
        <div className="absolute inset-0 bg-[var(--accent)] opacity-0 group-hover:opacity-15 transition-opacity duration-300 z-0"></div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-[calc(100%+12px)] left-0 z-[100] min-w-[180px]  overflow-hidden shadow-2xl border border-border"
            style={{
              background: "var(--bg-secondary)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
            }}
          >
            {cvData.id && (
              <a
                href={cvData.id.url}
                download={cvData.id.fileName}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors group/item"
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.875rem",
                  color: "var(--text-primary)",
                  textDecoration: "none",
                  borderBottom: cvData.en ? "1px solid var(--border)" : "none",
                }}
              >
                <span className="font-medium group-hover/item:text-accent transition-colors">Indonesia</span>
                <span style={{color: "var(--text-muted)", fontSize: "0.7rem", fontFamily: "var(--font-plus-jakarta), sans-serif"}}>{formatSize(cvData.id.fileSize)}</span>
              </a>
            )}
            {cvData.en && (
              <a
                href={cvData.en.url}
                download={cvData.en.fileName}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors group/item"
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "0.875rem",
                  color: "var(--text-primary)",
                  textDecoration: "none",
                }}
              >
                <span className="font-medium group-hover/item:text-accent transition-colors">English</span>
                <span style={{color: "var(--text-muted)", fontSize: "0.7rem", fontFamily: "var(--font-plus-jakarta), sans-serif"}}>{formatSize(cvData.en.fileSize)}</span>
              </a>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
