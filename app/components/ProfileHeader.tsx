"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion, AnimatePresence } from "framer-motion";
import { SocialLink as ISocialLink, getPlatformPrefix } from "./SocialLinks";
import { smoothScrollTo } from "@/lib/utils/smoothScroll";

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
  const taglineWords = useMemo(() => {
    const list = [cleanTagline];

    // Add the user requested taglines
    list.push("UI/UX Designer", "Mobile Developer");

    if (language === "id") {
      list.push("Programmer Kreatif");
    } else {
      list.push("Creative Programmer");
    }
    return Array.from(new Set(list));
  }, [cleanTagline, language]);

  useEffect(() => {
    if (taglineWords.length <= 1) return;
    const interval = setInterval(() => {
      setTaglineIndex((prev) => (prev + 1) % taglineWords.length);
    }, 3200);
    return () => clearInterval(interval);
  }, [taglineWords.length]);

  // GSAP Entrance + Smooth Hero Banner Parallax on Scroll (100% GPU transforms)
  useGSAP(
    () => {
      const prefersReduced =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (prefersReduced) {
        gsap.set(".hero-text, .hero-image, .hero-meta", {
          opacity: 1,
          y: 0,
          scale: 1,
          clipPath: "inset(0% 0 0% 0)",
        });
        return;
      }

      const tl = gsap.timeline({
        defaults: { ease: "power3.out", duration: 0.9, force3D: true },
      });

      tl.fromTo(
        ".hero-text",
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, stagger: 0.08 },
      )
        .fromTo(
          ".hero-image",
          { opacity: 0, clipPath: "inset(6% 0 6% 0)" },
          { opacity: 1, clipPath: "inset(0% 0 0% 0)", duration: 1.05, ease: "power4.out" },
          "-=0.55",
        )
        .fromTo(
          ".hero-meta",
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, stagger: 0.08 },
          "-=0.7",
        );

      // Smooth Parallax Window Effect on Scroll (GPU translate3d only)
      gsap.fromTo(
        ".hero-parallax-layer",
        { yPercent: -10, scale: 1.08 },
        {
          yPercent: 10,
          scale: 1,
          ease: "none",
          force3D: true,
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

  const currentYear = new Date().getFullYear();

  return (
    <section ref={containerRef} className="w-full relative pt-6 md:pt-12 z-10">
      {/* Architectural Telemetry Top Strip (Sam Goddard / Brandon Yasin inspired) */}
      <div
        className="hero-text flex flex-wrap items-center justify-between gap-3 pb-4 mb-6 md:mb-8"
        style={{ borderBottom: "1px solid color-mix(in srgb, var(--border) 65%, transparent)" }}
      >
        <div className="flex items-center gap-2.5">
          <span
            className="w-1.5 h-1.5 inline-block"
            style={{ background: "var(--accent)" }}
          />
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.12em] tabular-nums"
            style={{
              color: "var(--text-muted)",
              fontFamily: "var(--font-plus-jakarta), sans-serif",
            }}
          >
            PORTFOLIO // EDITION {currentYear}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <LiveClock />
        </div>
      </div>

      {/* Massive Typography Hero */}
      <h1
        className="hero-text"
        style={{
          fontFamily: "var(--font-plus-jakarta), sans-serif",
          fontWeight: 700,
          fontSize: "clamp(2.25rem, 8vw, 4.75rem)",
          lineHeight: 1.06,
          color: "var(--text-primary)",
          letterSpacing: "-0.025em",
          maxWidth: "100%",
          marginBottom: "1.75rem",
        }}
      >
        <span className="block">{name}</span>
        <span
          className="block mt-1.5 min-h-[2.3em] sm:min-h-[1.2em] overflow-hidden"
          style={{
            color: "var(--accent)",
            fontSize: "clamp(1.6rem, 5vw, 3.75rem)",
            lineHeight: 1.15,
            display: "grid",
            gridTemplateColumns: "1fr",
            justifyItems: "start",
            alignItems: "start",
          }}
        >
          <AnimatePresence initial={false}>
            <motion.span
              key={taglineIndex % taglineWords.length}
              initial={{ y: "105%", opacity: 0 }}
              animate={{ y: "0%", opacity: 1 }}
              exit={{ y: "-105%", opacity: 0 }}
              transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
              className="sm:whitespace-nowrap will-change-transform"
              style={{
                gridArea: "1/1/2/2",
                wordBreak: "keep-all",
              }}
            >
              {taglineWords[taglineIndex % taglineWords.length]}
            </motion.span>
          </AnimatePresence>
        </span>
      </h1>

      {/* Full Width Image Banner with 1px Hairline Frame & Smooth Scroll Parallax */}
      <div
        className="w-screen relative left-1/2 -translate-x-1/2 mb-10 overflow-hidden hero-image"
        style={{
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
        }}
      >
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
          {/* Subtle architectural corner index */}
          <div
            aria-hidden="true"
            className="hidden sm:flex items-center gap-2 absolute bottom-4 right-6 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] pointer-events-none"
            style={{
              background: "color-mix(in srgb, var(--bg-primary) 78%, transparent)",
              color: "var(--text-primary)",
              border: "1px solid var(--border)",
            }}
          >
            <span className="w-1.5 h-1.5 inline-block" style={{ background: "var(--accent)" }} />
            21:9 // VISUAL FRAME
          </div>
        </div>
      </div>

      {/* Aligned Editorial Bottom Section under Banner */}
      <div className="hero-meta flex flex-col gap-6 pt-2">
        {/* Top Row: Availability badge on left, Social Links on right */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[var(--border)]/60">
          <div className="flex items-center gap-2.5">
            <span
              className="inline-flex h-2 w-2"
              style={{ backgroundColor: "var(--green)" }}
            />
            <span
              style={{
                fontFamily: "var(--font-plus-jakarta), sans-serif",
                fontSize: "0.75rem",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
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
              onClick={(e) => {
                e.preventDefault();
                smoothScrollTo("#projects");
              }}
              className="px-5 py-2.5 flex items-center gap-2.5 text-sm font-semibold transition-colors duration-200 border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] text-[var(--text-primary)] no-underline group cursor-pointer relative overflow-hidden"
              style={{
                background: "transparent",
                fontFamily: "var(--font-sans), system-ui, sans-serif",
              }}
            >
              <span className="relative z-10">{language === "id" ? "Lihat Projek" : "Explore Projects"}</span>
              <span className="relative z-10 text-xs transition-transform duration-300 group-hover:translate-y-0.5 font-semibold" style={{ color: "var(--accent)" }}>↓</span>
            </a>
          </div>

          <span
            className="text-xs text-[var(--text-muted)] tracking-wider font-medium uppercase"
            style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}
          >
            {"// "}{language === "id" ? "SCROLL KE BAWAH" : "SCROLL DOWN"}
          </span>
        </div>
      </div>
    </section>
  );
}

/* ---- Live WIB Clock (Isolated component so hero doesn't re-render every second) ---- */
function LiveClock() {
  const [localTime, setLocalTime] = useState<string>("");

  useEffect(() => {
    const formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });

    const updateClock = () => {
      try {
        setLocalTime(`${formatter.format(new Date())} WIB`);
      } catch {
        setLocalTime("UTC+7");
      }
    };

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const scheduleNextTick = () => {
      updateClock();
      const delay = 1000 - (Date.now() % 1000) + 10;
      timeoutId = setTimeout(scheduleNextTick, delay);
    };

    const handleVisibility = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (!document.hidden) {
        scheduleNextTick();
      }
    };

    scheduleNextTick();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return (
    <span
      className="text-[11px] font-semibold uppercase tracking-[0.1em] tabular-nums"
      style={{
        color: "var(--text-secondary)",
        fontFamily: "var(--font-plus-jakarta), sans-serif",
      }}
    >
      PEKANBARU, ID {localTime ? `— ${localTime}` : ""}
    </span>
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
        className="px-5 py-2.5 flex items-center justify-center gap-2 transition-colors duration-200 relative group overflow-hidden border"
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
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-[calc(100%+12px)] left-0 z-[100] min-w-[180px] overflow-hidden shadow-2xl border border-border"
            style={{
              background: "color-mix(in srgb, var(--bg-secondary) 96%, transparent)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
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
