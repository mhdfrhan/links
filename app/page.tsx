"use client";

import { useEffect, useRef, useState } from "react";
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
import { usePortfolioData } from "../lib/hooks/usePortfolioData";

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
  const navRef = useRef<HTMLElement>(null);
  const [navScrolled, setNavScrolled] = useState(false);

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
          background: navScrolled
            ? "color-mix(in srgb, var(--bg-primary) 85%, transparent)"
            : "transparent",
          backdropFilter: navScrolled ? "blur(12px)" : "none",
          borderBottom: navScrolled
            ? "1px solid var(--border)"
            : "1px solid transparent",
        }}
      >
        <div
          className="sm:flex items-center justify-between"
          style={{
            maxWidth: "1080px",
            margin: "0 auto",
            padding: "10px 1.5rem",
            height: "56px",
          }}
        >
          {/* Logo monospace kiri */}
          <span className="text-center sm:text-left block sm:inline"
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: "0.8125rem",
              color: "var(--text-muted)",
              letterSpacing: "0.02em",
            }}
          >
            ~/mhdfarhan
          </span>

          {/* Nav links kanan */}
          <div className="flex justify-center sm:justify-start items-center gap-6">
            {/* Status dot */}
            <div className="hidden sm:flex items-center gap-1.5">
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
                available
              </span>
            </div>

            {/* Nav links */}
            <div className="flex items-center gap-4 sm:gap-6 shrink-0">
              {(
                [
                  ["about", "#about"],
                  ["projects", "#projects"],
                  ["skills", "#skills"],
                  ["contact", "#contact"],
                ] as const
              ).map(([label, href]) => (
                <NavLink key={label} href={href}>
                  {label}
                </NavLink>
              ))}
            </div>

            {/* Theme Toggle */}
            <div className="shrink-0">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      {/* ==================== MAIN CONTENT ==================== */}
      <main
        style={{
          maxWidth: "1080px",
          margin: "0 auto",
          padding: "0 1.5rem",
          paddingTop: "96px",  /* offset navbar */
          paddingBottom: "0",
        }}
      >
        {/* ===== HERO SECTION ===== */}
        <section id="about" style={{ paddingBottom: "5rem" }}>
          <ProfileHeader
            name={data.profile?.name || "Muhammad Farhan"}
            tagline={data.profile?.tagline || "Fullstack Web Developer"}
            avatarUrl={data.profile?.avatarUrl || "/img/foto.jpg"}
            about={data.about}
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
            role="Web Developer"
            about={data.about}
            skills={data.skills}
            status="Open to opportunities"
          />
        </section>

        <SectionDivider />

        {/* ===== ABOUT SECTION ===== */}
        <section style={{ paddingBottom: "5rem" }}>
          <AboutSection text={data.about || "Belum ada teks..."} />
        </section>

        <SectionDivider />

        {/* ===== PROJECTS SECTION ===== */}
        <section id="projects" style={{ paddingBottom: "5rem" }}>
          <PortfolioSection
            projects={data.projects.slice(0, 4)}
            showAllButton={true}
            categories={data.categories}
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
            title="Pengalaman Kerja"
            sectionNumber="05."
            items={data.experiences}
          />
        </section>

        {/* ===== ORGANISATION EXPERIENCE ===== */}
        {data.organizationExperience && data.organizationExperience.length > 0 && (
          <>
            <SectionDivider />
            <section style={{ paddingBottom: "5rem" }}>
              <ExperienceSection
                title="Pengalaman Organisasi"
                sectionNumber="05b."
                items={data.organizationExperience}
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
                title="Pengalaman Kepanitiaan"
                sectionNumber="05c."
                items={data.committeeExperience}
              />
            </section>
          </>
        )}

        <SectionDivider />

        {/* ===== EDUCATION SECTION ===== */}
        <section style={{ paddingBottom: "5rem" }}>
          <EducationSection items={data.education} />
        </section>

        <SectionDivider />

        {/* ===== AWARDS SECTION ===== */}
        <section style={{ paddingBottom: "5rem" }}>
          <AwardsSection awards={data.awards} />
        </section>

        <SectionDivider />

        {/* ===== CERTIFICATIONS SECTION ===== */}
        <section style={{ paddingBottom: "5rem" }}>
          <CertificationsSection certifications={data.certifications} />
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
