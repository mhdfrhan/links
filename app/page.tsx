"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { ProfileHeader } from "./components/ProfileHeader";
import { AboutSection } from "./components/AboutSection";
import { RunningText } from "./components/RunningText";
import { PortfolioSection } from "./components/PortfolioSection";
import { SkillsSection } from "./components/SkillsSection";
import { ExperienceSection } from "./components/ExperienceSection";
import { EducationSection } from "./components/EducationSection";
import { AwardsSection } from "./components/AwardsSection";
import { CertificationsSection } from "./components/CertificationsSection";
import { Footer } from "./components/Footer";
import { ThemeToggle } from "./components/ThemeToggle";
import { LanguageToggle } from "./components/LanguageToggle";
import { ChatWidget } from "./components/ChatWidget";
import { usePortfolioData } from "../lib/hooks/usePortfolioData";
import { useLanguage } from "../lib/contexts/LanguageContext";
import { dictionaries } from "../lib/i18n/dictionaries";

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

  const navRef = useRef<HTMLElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const [navScrolled, setNavScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Helper untuk mengambil field bahasa
  const l = (item: any, field: string, fallback: string = "") => {
    if (!item) return fallback;
    return language === "en" && item[`${field}_en`]
      ? item[`${field}_en`]
      : item[field] || fallback;
  };

  // Close menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 640) setIsMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMenuOpen &&
        navRef.current &&
        !navRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  // Animasi Mobile Menu
  useGSAP(
    () => {
      if (!mobileMenuRef.current) return;

      if (isMenuOpen) {
        gsap.fromTo(
          mobileMenuRef.current,
          {
            opacity: 0,
            y: -10,
            scale: 0.95,
            pointerEvents: "none",
            display: "none",
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            pointerEvents: "auto",
            display: "block",
            duration: 0.2,
            ease: "power2.out",
          },
        );
      } else {
        gsap.to(mobileMenuRef.current, {
          opacity: 0,
          y: -10,
          scale: 0.95,
          pointerEvents: "none",
          duration: 0.15,
          ease: "power2.in",
          onComplete: () => {
            if (mobileMenuRef.current)
              mobileMenuRef.current.style.display = "none";
          },
        });
      }
    },
    { dependencies: [isMenuOpen] },
  );

  // Nav scroll effect: transparent → solid
  useEffect(() => {
    const handleScroll = () => {
      setNavScrolled(window.scrollY > 60);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
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
              fontFamily: "var(--font-serif), serif",
              fontSize: "3rem",
              fontWeight: 400,
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
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: "0.65rem",
              color: "var(--text-muted)",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            Memuat Data
          </span>
        </div>
        <style>{`
          @keyframes revealText {
            0% { width: 0%; }
            100% { width: 100%; }
          }
          @keyframes slideLine {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
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

      {/* ==================== NAVBAR ==================== */}
      <nav
        ref={navRef}
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 pointer-events-auto"
        style={{
          background:
            navScrolled || isMenuOpen
              ? "color-mix(in srgb, var(--bg-primary) 80%, transparent)"
              : "transparent",
          backdropFilter: navScrolled || isMenuOpen ? "blur(16px)" : "none",
          WebkitBackdropFilter:
            navScrolled || isMenuOpen ? "blur(16px)" : "none",
          borderBottom:
            navScrolled || isMenuOpen
              ? "1px solid var(--border)"
              : "1px solid transparent",
          boxShadow: navScrolled ? "0 4px 24px -8px rgba(0,0,0,0.05)" : "none",
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
              className="flex items-center gap-1 group"
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

          {/* MIDDLE: Desktop Nav Links */}
          <div className="hidden md:flex items-center justify-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 gap-2">
            {(
              [
                [dict.nav.about, "#about"],
                [dict.nav.projects, "#projects"],
                [dict.nav.skills, "#skills"],
                [dict.nav.contact, "#contact"],
              ] as const
            ).map(([label, href]) => (
              <NavLink key={label} href={href}>
                {label}
              </NavLink>
            ))}
          </div>

          {/* RIGHT: Toggles & Mobile Menu */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center gap-2 mr-2">
              <div
                className="flex items-center gap-2 px-3 py-1.5  border border-border/50 bg-background/30"
                title="Available for work"
              >
                <span className="relative flex h-2 w-2">
                  <span
                    className="animate-ping absolute inline-flex h-full w-full  opacity-75"
                    style={{ backgroundColor: "var(--green)" }}
                  ></span>
                  <span
                    className="relative inline-flex  h-2 w-2"
                    style={{ backgroundColor: "var(--green)" }}
                  ></span>
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    fontSize: "0.65rem",
                    color: "var(--text-muted)",
                    letterSpacing: "0.03em",
                  }}
                >
                  {dict.nav.available}
                </span>
              </div>
              <div className="h-4 w-[1px] bg-border mx-1" />
              <LanguageToggle />
            </div>

            {/* Common Theme Toggle */}
            <ThemeToggle />

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex md:hidden items-center justify-center w-10 h-10  border border-border bg-card hover:bg-muted transition-colors focus:outline-none ml-1"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <XMarkIcon className="w-5 h-5 text-foreground" />
              ) : (
                <Bars3Icon className="w-5 h-5 text-foreground" />
              )}
            </button>
          </div>

          {/* MOBILE DROPDOWN MENU */}
          <div
            ref={mobileMenuRef}
            className="absolute top-[calc(100%+12px)] right-6 w-[240px] bg-card border border-border  shadow-2xl p-2 z-50 hidden md:hidden"
            style={{
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
            }}
          >
            <div className="flex flex-col gap-1">
              {(
                [
                  [dict.nav.about, "#about"],
                  [dict.nav.projects, "#projects"],
                  [dict.nav.skills, "#skills"],
                  [dict.nav.contact, "#contact"],
                ] as const
              ).map(([label, href]) => (
                <a
                  key={label}
                  href={href}
                  onClick={() => setIsMenuOpen(false)}
                  className="px-4 py-3 text-sm  hover:bg-muted transition-colors flex items-center justify-between group"
                  style={{
                    fontFamily: "var(--font-plus-jakarta), sans-serif",
                    fontWeight: 500,
                    color: "var(--text-muted)",
                    textDecoration: "none",
                  }}
                >
                  {label}
                  <span
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px]"
                    style={{ color: "var(--accent)" }}
                  >
                    →
                  </span>
                </a>
              ))}

              <div className="h-[1px] bg-border/50 my-2 mx-2" />

              <div className="px-4 py-2 flex items-center justify-between">
                <span
                  className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider"
                  style={{ color: "var(--text-muted)" }}
                >
                  {dict.misc.languageLabel}
                </span>
                <LanguageToggle />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* ==================== MAIN CONTENT ==================== */}
      <main className="max-w-[1080px] mx-auto px-[1.5rem] pt-[150px] sm:pt-24 pb-0">
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

        {/* ===== SKILLS SECTION ===== */}
        <section id="skills" style={{ paddingBottom: "2rem" }}>
          <SkillsSection categories={data.skills} />
        </section>

        <SectionDivider />

        {/* ===== EXPERIENCE SECTION ===== */}
        <section style={{ paddingBottom: "2rem" }}>
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

        {/* ===== FOOTER / CONTACT ===== */}
        <section id="contact">
          <Footer
            name={data.profile?.name || "Muhammad Farhan"}
            email={data.profile?.email}
            github={data.profile?.github}
            linkedin={data.profile?.linkedin}
          />
        </section>
      </main>

      <ChatWidget />
    </div>
  );
}

/* ---- Navbar Link ---- */
function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="px-4 py-2  transition-all duration-300"
      style={{
        fontFamily: "var(--font-plus-jakarta), system-ui, sans-serif",
        fontSize: "0.8125rem",
        fontWeight: 500,
        color: "var(--text-muted)",
        textDecoration: "none",
        fontStyle: "normal",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
        (e.currentTarget as HTMLElement).style.backgroundColor =
          "color-mix(in srgb, var(--text-primary) 5%, transparent)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
        (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
      }}
    >
      {children}
    </a>
  );
}

/* ---- Section Divider ---- */
function SectionDivider() {
  return <div style={{ height: "4rem" }} />;
}
