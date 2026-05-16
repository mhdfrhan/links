"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { ProfileHeader } from "./components/ProfileHeader";
import { TerminalBlock } from "./components/TerminalBlock";
import { AboutSection } from "./components/AboutSection";
import { PortfolioSection } from "./components/PortfolioSection";
import { SkillsSection } from "./components/SkillsSection";
import { ExperienceSection } from "./components/ExperienceSection";
import { EducationSection } from "./components/EducationSection";
import { AwardsSection } from "./components/AwardsSection";
import { CertificationsSection } from "./components/CertificationsSection";
import { Footer } from "./components/Footer";
import { ThemeToggle } from "./components/ThemeToggle";
import { LanguageToggle } from "./components/LanguageToggle";
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
    return language === "en" && item[`${field}_en`] ? item[`${field}_en`] : (item[field] || fallback);
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
  useGSAP(() => {
    if (!mobileMenuRef.current) return;

    if (isMenuOpen) {
      gsap.fromTo(
        mobileMenuRef.current,
        { opacity: 0, y: -10, scale: 0.95, pointerEvents: "none", display: "none" },
        { 
          opacity: 1, 
          y: 0, 
          scale: 1, 
          pointerEvents: "auto", 
          display: "block",
          duration: 0.2, 
          ease: "power2.out" 
        }
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
          if (mobileMenuRef.current) mobileMenuRef.current.style.display = "none";
        }
      });
    }
  }, { dependencies: [isMenuOpen] });

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
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg-primary)" }}
        suppressHydrationWarning
      >
        <div className="flex flex-col items-center gap-3">
          {/* Spinner tipis */}
          <div
            className="rounded-full"
            style={{
              width: "24px",
              height: "24px",
              border: "1px solid var(--border)",
              borderTopColor: "var(--accent)",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: "0.7rem",
              color: "var(--text-muted)",
              letterSpacing: "0.03em",
            }}
          >
            loading...
          </span>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div
      style={{ background: "var(--bg-primary)", minHeight: "100vh" }}
      suppressHydrationWarning
    >
      {/* Grain overlay — opacity 0.02, hampir tidak terlihat */}
      <div className="grain-overlay" aria-hidden="true" />

      {/* ==================== NAVBAR ==================== */}
      <nav
        ref={navRef}
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: navScrolled || isMenuOpen
            ? "color-mix(in srgb, var(--bg-primary) 85%, transparent)"
            : "transparent",
          backdropFilter: navScrolled || isMenuOpen ? "blur(12px)" : "none",
          borderBottom: navScrolled || isMenuOpen
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
          <div className="flex items-center">
            <span
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "0.8125rem",
                color: "var(--text-muted)",
                letterSpacing: "0.02em",
              }}
            >
              ~/mhdfarhan
            </span>
          </div>

          {/* RIGHT: Desktop Nav & Mobile Toggles */}
          <div className="flex items-center gap-2 sm:gap-6">
            {/* Desktop Nav Links */}
            <div className="hidden sm:flex items-center gap-6">
              <div className="flex items-center gap-1.5 mr-2">
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "var(--green)",
                    display: "block",
                  }}
                />
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
              
              <div className="h-4 w-[1px] bg-border/50 mx-1" />
              <LanguageToggle />
            </div>

            {/* Common Theme Toggle */}
            <ThemeToggle />

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex sm:hidden items-center justify-center w-8 h-8 rounded-full border border-border bg-card hover:bg-muted transition-colors focus:outline-none"
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
            className="absolute top-[calc(100%+8px)] right-6 w-[200px] bg-card border border-border rounded-2xl shadow-2xl p-2 z-50 hidden sm:hidden"
            style={{ backdropFilter: "blur(16px)" }}
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
                  className="px-4 py-2.5 text-sm rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground flex items-center justify-between group"
                >
                  {label}
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-accent">
                    →
                  </span>
                </a>
              ))}
              
              <div className="h-[1px] bg-border/50 my-1 mx-2" />
              
              <div className="px-4 py-2 flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">{dict.misc.languageLabel}</span>
                <LanguageToggle />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* ==================== MAIN CONTENT ==================== */}
      <main
        className="max-w-[1080px] mx-auto px-[1.5rem] pt-[150px] sm:pt-24 pb-0"
      >
        {/* ===== HERO SECTION ===== */}
        <section id="about" style={{ paddingBottom: "5rem" }}>
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

        <SectionDivider />

        {/* ===== TERMINAL SECTION ===== */}
        <section style={{ paddingBottom: "5rem" }}>
          <TerminalBlock
            name={data.profile?.name || "Muhammad Farhan"}
            role={l(data.profile, "tagline", "Web Developer").split("|")[0].trim()}
            about={l(data.aboutObj, "text")}
            skills={data.skills}
            status={language === "id" ? "Terbuka untuk peluang baru" : "Open to opportunities"}
          />
        </section>

        <SectionDivider />

        {/* ===== ABOUT SECTION ===== */}
        <section style={{ paddingBottom: "5rem" }}>
          <AboutSection text={l(data.aboutObj, "text", "Belum ada teks...")} />
        </section>

        <SectionDivider />

        {/* ===== PROJECTS SECTION ===== */}
        <section id="projects" style={{ paddingBottom: "5rem" }}>
          <PortfolioSection
            projects={data.projects.slice(0, 4).map((p: any) => ({
              ...p,
              title: l(p, "title"),
              description: l(p, "description"),
              fullDescription: l(p, "fullDescription"),
            }))}
            showAllButton={true}
            categories={data.categories.map((c: any) => ({
              ...c,
              name: l(c, "name"),
            }))}
          />
        </section>

        <SectionDivider />

        {/* ===== SKILLS SECTION ===== */}
        <section id="skills" style={{ paddingBottom: "5rem" }}>
          <SkillsSection categories={data.skills} />
        </section>

        <SectionDivider />

        {/* ===== EXPERIENCE SECTION ===== */}
        <section style={{ paddingBottom: "5rem" }}>
          <ExperienceSection
            title={dict.experience.workTitle}
            sectionNumber="04."
            items={data.experiences.map((exp: any) => ({
              ...exp,
              title: l(exp, "title"),
              company: l(exp, "company"),
              period: l(exp, "period"),
              points: language === "en" && exp.points_en ? exp.points_en : exp.points,
            }))}
          />
        </section>

        {/* ===== ORGANISATION EXPERIENCE ===== */}
        {data.organizationExperience && data.organizationExperience.length > 0 && (
          <>
            <SectionDivider />
            <section style={{ paddingBottom: "5rem" }}>
              <ExperienceSection
                title={dict.experience.orgTitle}
                sectionNumber="04b."
                items={data.organizationExperience.map((exp: any) => ({
                  ...exp,
                  title: l(exp, "title"),
                  company: l(exp, "company"),
                  period: l(exp, "period"),
                  points: language === "en" && exp.points_en ? exp.points_en : exp.points,
                }))}
              />
            </section>
          </>
        )}

        {/* ===== COMMITTEE EXPERIENCE ===== */}
        {data.committeeExperience && data.committeeExperience.length > 0 && (
          <>
            <SectionDivider />
            <section style={{ paddingBottom: "5rem" }}>
              <ExperienceSection
                title={dict.experience.comTitle}
                sectionNumber="04c."
                items={data.committeeExperience.map((exp: any) => ({
                  ...exp,
                  title: l(exp, "title"),
                  company: l(exp, "company"),
                  period: l(exp, "period"),
                  points: language === "en" && exp.points_en ? exp.points_en : exp.points,
                }))}
              />
            </section>
          </>
        )}

        <SectionDivider />

        <section style={{ paddingBottom: "5rem" }}>
          <EducationSection items={data.education.map((edu: any) => ({
            ...edu,
            institution: l(edu, "institution"),
            degree: l(edu, "degree"),
            period: l(edu, "period"),
            note: l(edu, "note"),
          }))} />
        </section>

        <SectionDivider />

        <section style={{ paddingBottom: "5rem" }}>
          <AwardsSection awards={data.awards.map((aw: any) => ({
            ...aw,
            title: l(aw, "title"),
            issuer: l(aw, "issuer"),
            date: l(aw, "date"),
          }))} />
        </section>

        <SectionDivider />

        <section style={{ paddingBottom: "5rem" }}>
          <CertificationsSection certifications={data.certifications.map((cert: any) => ({
            ...cert,
            title: l(cert, "title"),
            issuer: l(cert, "issuer"),
            date: l(cert, "date"),
          }))} />
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
      style={{
        fontFamily: "var(--font-inter), system-ui, sans-serif",
        fontSize: "0.875rem",
        fontWeight: 400,
        color: "var(--text-muted)",
        textDecoration: "none",
        fontStyle: "normal",
        transition: "color 150ms ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
      }}
    >
      {children}
    </a>
  );
}

/* ---- Section Divider ---- */
function SectionDivider() {
  return (
    <div
      style={{
        height: "1px",
        background: "var(--border)",
        marginBottom: "5rem",
      }}
    />
  );
}
