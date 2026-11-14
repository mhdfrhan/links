"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ProfileHeader } from "./components/ProfileHeader";
import { AboutSection } from "./components/AboutSection";
import { RunningText } from "./components/RunningText";
import { PortfolioSection } from "./components/PortfolioSection";
import { SkillsSection } from "./components/SkillsSection";
import { ExperienceSection } from "./components/ExperienceSection";
import { EducationSection } from "./components/EducationSection";
import { AwardsSection } from "./components/AwardsSection";
import { CertificationsSection } from "./components/CertificationsSection";
import { GithubActivitySection } from "./components/GithubActivitySection";
import { Footer } from "./components/Footer";
import { SoftwareAgencyCta } from "./components/SoftwareAgencyCta";
import { ThemeToggle } from "./components/ThemeToggle";
import { LanguageToggle } from "./components/LanguageToggle";
import { ChatWidget } from "./components/ChatWidget";
import { RulerNav, type RulerSection } from "./components/RulerNav";
import { usePortfolioData } from "../lib/hooks/usePortfolioData";
import { useLanguage } from "../lib/contexts/LanguageContext";
import { dictionaries } from "../lib/i18n/dictionaries";
import { smoothScrollTo } from "@/lib/utils/smoothScroll";

/**
 * Home — Halaman utama portfolio
 *
 * Layout: Navbar sticky → Hero → Terminal → About → Projects → Skills
 *         → Experience → Education → Awards → Certifications → Footer
 *
 * Semua data dari usePortfolioData (Firebase) — TIDAK ADA data manual
 * Yang diubah hanya cara data ditampilkan, bukan data itu sendiri
 */
export default function Home() {
  const { data, loading } = usePortfolioData();
  const { language } = useLanguage();
  const dict = dictionaries[language];

  // Update dynamic page title on language change
  useEffect(() => {
    document.title = dict.metadata.title;
  }, [language, dict.metadata.title]);

  // Clean any initial hash from URL to keep address bar pristine
  useEffect(() => {
    if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, []);

  const navRef = useRef<HTMLElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [navScrolled, setNavScrolled] = useState(false);

  const rulerSections: RulerSection[] = useMemo(
    () => [
      { id: "about", href: "#about", label: dict.nav.about, code: "01" },
      { id: "projects", href: "#projects", label: dict.nav.projects, code: "02" },
      { id: "skills", href: "#skills", label: dict.nav.skills, code: "03" },
      { id: "experience", href: "#experience", label: dict.nav.experience, code: "04" },
      { id: "contact", href: "#contact", label: dict.nav.contact, code: "05" },
    ],
    [dict.nav],
  );

  // Helper untuk mengambil field bahasa
  const l = (item: any, field: string, fallback: string = "") => {
    if (!item) return fallback;
    return language === "en" && item[`${field}_en`]
      ? item[`${field}_en`]
      : item[field] || fallback;
  };

  // Nav scroll effect + zero-rerender GPU progress line
  useEffect(() => {
    let rafId = 0;
    const updateScrollMetrics = () => {
      rafId = 0;
      const y = window.scrollY;
      setNavScrolled((prev) => {
        const next = y > 60;
        return prev === next ? prev : next;
      });
      if (progressBarRef.current) {
        const docHeight =
          document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? Math.min(1, Math.max(0, y / docHeight)) : 0;
        progressBarRef.current.style.transform = `scaleX(${progress})`;
      }
    };

    const handleScroll = () => {
      if (!rafId) {
        rafId = window.requestAnimationFrame(updateScrollMetrics);
      }
    };

    updateScrollMetrics();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  // Loading state
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center fixed inset-0 z-[9999]"
        style={{ background: "var(--bg-primary)" }}
        suppressHydrationWarning
      >
        <div className="flex flex-col items-center justify-center gap-6">
          {/* Typographic Logo */}
          <div
            style={{
              fontFamily: "var(--font-plus-jakarta), sans-serif",
              fontSize: "3rem",
              fontWeight: 700,
              color: "var(--text-primary)",
              letterSpacing: "-0.04em",
              position: "relative",
            }}
          >
            <span style={{ opacity: 0.15 }}>Farhan.</span>
            <span
              className="absolute top-0 left-0 whitespace-nowrap"
              style={{
                color: "var(--text-primary)",
                overflow: "hidden",
                animation:
                  "revealText 1.8s cubic-bezier(0.77, 0, 0.175, 1) infinite alternate",
              }}
            >
              Farhan.
            </span>
          </div>

          {/* Minimalist Progress Line */}
          <div
            className="w-32 h-[1px] relative overflow-hidden"
            style={{
              background: "color-mix(in srgb, var(--border) 50%, transparent)",
            }}
          >
            <div
              className="absolute top-0 left-0 h-full w-full"
              style={{
                background: "var(--accent)",
                animation:
                  "slideLine 1.8s cubic-bezier(0.77, 0, 0.175, 1) infinite",
              }}
            />
          </div>

          <span
            style={{
              fontFamily: "var(--font-plus-jakarta), sans-serif",
              fontSize: "0.7rem",
              fontWeight: 600,
              color: "var(--text-muted)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Memuat Data
          </span>
        </div>
        <style>{`
          @keyframes revealText {
            0% { clip-path: inset(0 100% 0 0); }
            100% { clip-path: inset(0 0% 0 0); }
          }
          @keyframes slideLine {
            0% { transform: translate3d(-100%, 0, 0); }
            100% { transform: translate3d(100%, 0, 0); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "var(--bg-primary)",
        minHeight: "100vh",
        position: "relative",
        isolation:
          "isolate" /* own stacking context — content always above z-index:-1 grid */,
      }}
      suppressHydrationWarning
    >
      {/* Grain overlay — opacity 0.02, hampir tidak terlihat */}
      <div className="grain-overlay" aria-hidden="true" />

      {/* ==================== MINIMAL TOP UTILITY BAR ==================== */}
      <header
        ref={navRef}
        className="fixed top-0 left-0 right-0 z-50 transition-colors duration-200 pointer-events-auto"
        style={{
          background: navScrolled
            ? "color-mix(in srgb, var(--bg-primary) 90%, transparent)"
            : "transparent",
          backdropFilter: navScrolled ? "blur(8px)" : "none",
          WebkitBackdropFilter: navScrolled ? "blur(8px)" : "none",
          borderBottom: navScrolled
            ? "1px solid var(--border)"
            : "1px solid transparent",
        }}
      >
        <div
          className="relative flex items-center justify-between"
          style={{
            maxWidth: "1080px",
            margin: "0 auto",
            padding: "10px 1.5rem",
            minHeight: "56px",
          }}
        >
          {/* LEFT: Logo */}
          <div className="flex items-center shrink-0">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                smoothScrollTo(0);
              }}
              className="flex items-center gap-1 group cursor-pointer"
              style={{ textDecoration: "none" }}
            >
              <span
                style={{
                  fontFamily: "var(--font-plus-jakarta), sans-serif",
                  fontSize: "1.125rem",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.02em",
                }}
              >
                Farhan<span style={{ color: "var(--accent)" }}>.</span>
              </span>
            </a>
          </div>

          {/* RIGHT: Utility Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center gap-2 mr-1">
              <div
                className="flex items-center gap-2 px-3 py-1.5 border border-border/50 bg-background/30"
                title="Available for work"
              >
                <span
                  className="inline-flex h-2 w-2"
                  style={{ backgroundColor: "var(--green)" }}
                />
                <span
                  style={{
                    fontFamily: "var(--font-plus-jakarta), sans-serif",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    letterSpacing: "0.03em",
                  }}
                >
                  {dict.nav.available}
                </span>
              </div>
              <div className="h-4 w-[1px] bg-border mx-1" />
            </div>

            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>

        {/* GPU Scroll Progress Hairline */}
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 right-0 h-[1px] pointer-events-none overflow-hidden"
        >
          <div
            ref={progressBarRef}
            className="h-full w-full origin-left will-change-transform"
            style={{
              background: "var(--accent)",
              transform: "scaleX(0)",
            }}
          />
        </div>
      </header>

      {/* ==================== RIGHT DESIGNER RULER & MOBILE DIAL NAV ==================== */}
      <RulerNav sections={rulerSections} />

      {/* ==================== MAIN CONTENT ==================== */}
      <main className="max-w-[1080px] mx-auto px-[1.5rem] md:pr-16 lg:pr-[168px] min-[1440px]:px-[1.5rem] pt-24 pb-0">
        {/* ===== HERO SECTION ===== */}
        <section id="about" style={{ paddingBottom: "2rem" }}>
          <ProfileHeader
            name={data.profile?.name || "Muhammad Farhan"}
            tagline={l(data.profile, "tagline", "Fullstack Web Developer")}
            avatarUrl={data.profile?.avatarUrl || "/img/foto.jpg"}
            about={l(data.aboutObj, "text")}
            cvData={data.cvData}
            email={data.profile?.email}
            github={data.profile?.github}
            linkedin={data.profile?.linkedin}
            socialLinks={data.profile?.socialLinks}
          />
        </section>

        <RunningText />

        {/* ===== ABOUT SECTION ===== */}
        <section style={{ paddingBottom: "2rem" }}>
          <AboutSection text={l(data.aboutObj, "text", "Belum ada teks...")} />
        </section>

        <SectionDivider />

        {/* ===== PROJECTS SECTION ===== */}
        <section id="projects" style={{ paddingBottom: "2rem" }}>
          <PortfolioSection
            projects={data.projects.slice(0, 5).map((p: any) => ({
              ...p,
              title: l(p, "title"),
              description: l(p, "description"),
              fullDescription: l(p, "fullDescription"),
            }))}
            showAllButton={true}
            horizontalScroll={true}
            categories={data.categories.map((c: any) => ({
              ...c,
              name: l(c, "name"),
            }))}
          />
        </section>

        <SectionDivider />

        {/* ===== GITHUB ACTIVITY SECTION ===== */}
        <section style={{ paddingBottom: "2rem" }}>
          <GithubActivitySection />
        </section>

        <SectionDivider />

        {/* ===== SKILLS SECTION ===== */}
        <section id="skills" style={{ paddingBottom: "2rem" }}>
          <SkillsSection categories={data.skills} />
        </section>

        <SectionDivider />

        {/* ===== EXPERIENCE SECTION ===== */}
        <section id="experience" style={{ paddingBottom: "2rem" }}>
          <ExperienceSection
            title={dict.experience.workTitle}
            sectionNumber="04."
            items={data.experiences.map((exp: any) => ({
              ...exp,
              title: l(exp, "title"),
              company: l(exp, "company"),
              period: l(exp, "period"),
              points:
                language === "en" && exp.points_en ? exp.points_en : exp.points,
            }))}
          />
        </section>

        {/* ===== ORGANISATION EXPERIENCE ===== */}
        {data.organizationExperience &&
          data.organizationExperience.length > 0 && (
            <>
              <SectionDivider />
              <section style={{ paddingBottom: "2rem" }}>
                <ExperienceSection
                  title={dict.experience.orgTitle}
                  sectionNumber="04b."
                  items={data.organizationExperience.map((exp: any) => ({
                    ...exp,
                    title: l(exp, "title"),
                    company: l(exp, "company"),
                    period: l(exp, "period"),
                    points:
                      language === "en" && exp.points_en
                        ? exp.points_en
                        : exp.points,
                  }))}
                />
              </section>
            </>
          )}

        {/* ===== COMMITTEE EXPERIENCE ===== */}
        {data.committeeExperience && data.committeeExperience.length > 0 && (
          <>
            <SectionDivider />
            <section style={{ paddingBottom: "2rem" }}>
              <ExperienceSection
                title={dict.experience.comTitle}
                sectionNumber="04c."
                items={data.committeeExperience.map((exp: any) => ({
                  ...exp,
                  title: l(exp, "title"),
                  company: l(exp, "company"),
                  period: l(exp, "period"),
                  points:
                    language === "en" && exp.points_en
                      ? exp.points_en
                      : exp.points,
                }))}
              />
            </section>
          </>
        )}

        <SectionDivider />

        <section style={{ paddingBottom: "2rem" }}>
          <EducationSection
            items={data.education.map((edu: any) => ({
              ...edu,
              institution: l(edu, "institution"),
              degree: l(edu, "degree"),
              period: l(edu, "period"),
              note: l(edu, "note"),
            }))}
          />
        </section>

        <SectionDivider />

        <section style={{ paddingBottom: "2rem" }}>
          <AwardsSection
            awards={data.awards.map((aw: any) => ({
              ...aw,
              title: l(aw, "title"),
              issuer: l(aw, "issuer"),
              date: l(aw, "date"),
            }))}
          />
        </section>

        <SectionDivider />

        <section style={{ paddingBottom: "2rem" }}>
          <CertificationsSection
            certifications={data.certifications.map((cert: any) => ({
              ...cert,
              title: l(cert, "title"),
              issuer: l(cert, "issuer"),
              date: l(cert, "date"),
            }))}
          />
        </section>

        <SectionDivider />

        {/* ===== SOFTWARE DEVELOPMENT AGENCY CTA (handigital.biz.id) ===== */}
        <SoftwareAgencyCta />

        {/* ===== FOOTER / CONTACT ===== */}
        <section id="contact">
          <Footer
            name={data.profile?.name || "Muhammad Farhan"}
            email={data.profile?.email}
            github={data.profile?.github}
            linkedin={data.profile?.linkedin}
            socialLinks={data.profile?.socialLinks}
          />
        </section>
      </main>

      <ChatWidget />
    </div>
  );
}

/* ---- Section Divider ---- */
function SectionDivider() {
  return (
    <div
      className="my-12 w-full h-[1px]"
      style={{
        background: "color-mix(in srgb, var(--border) 55%, transparent)",
      }}
    />
  );
}
