"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ThemeToggle } from "./components/ThemeToggle";
import { ProfileHeader } from "./components/ProfileHeader";
import { SocialLinks } from "./components/SocialLinks";
import { AboutSection } from "./components/AboutSection";
import { ExperienceSection } from "./components/ExperienceSection";
import { EducationSection } from "./components/EducationSection";
import { AwardsSection } from "./components/AwardsSection";
import { SkillsSection } from "./components/SkillsSection";
import { CertificationsSection } from "./components/CertificationsSection";
import { PortfolioSection } from "./components/PortfolioSection";
import { Footer } from "./components/Footer";
import { usePortfolioData } from "../lib/hooks/usePortfolioData";
import { AcademicCapIcon, TrophyIcon, CheckBadgeIcon } from "@heroicons/react/24/outline";

// Icons
const BriefcaseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" />
  </svg>
);

const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
  </svg>
);

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
  </svg>
);


export default function Home() {
  const { data, loading } = usePortfolioData();
  const container = useRef<HTMLDivElement>(null);
  const bubble1 = useRef<HTMLDivElement>(null);
  const bubble2 = useRef<HTMLDivElement>(null);
  const themeToggleContainer = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (loading) return;

    gsap.to(bubble1.current, {
      scale: 1.05,
      opacity: 0.15,
      x: 20,
      y: -20,
      duration: 15,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

    gsap.to(bubble2.current, {
      scale: 1.05,
      opacity: 0.2,
      x: -30,
      y: 30,
      duration: 18,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

    gsap.from(themeToggleContainer.current, {
      opacity: 0,
      scale: 0.8,
      duration: 0.6,
      ease: "back.out(1.7)",
      delay: 0.5
    });
  }, { scope: container, dependencies: [loading] });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" suppressHydrationWarning>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500" suppressHydrationWarning></div>
      </div>
    );
  }

  return (
    <div ref={container} className="relative min-h-screen bg-background overflow-hidden" suppressHydrationWarning>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          ref={bubble1}
          className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl"
          style={{ willChange: "transform, opacity" }}
        />
        <div
          ref={bubble2}
          className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-emerald-400/10 dark:bg-emerald-400/15 rounded-full blur-3xl"
          style={{ willChange: "transform, opacity" }}
        />
        <div
          className="absolute inset-0 opacity-[0.3] dark:opacity-[0.2]"
          style={{
            backgroundImage: `radial-gradient(circle, var(--accent) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      <main className="relative flex flex-col items-center min-h-screen px-4 py-8 md:py-12">
        <div
          ref={themeToggleContainer}
          className="fixed top-4 right-4 md:top-6 md:right-6 z-50"
        >
          <ThemeToggle />
        </div>

        <div className="flex flex-col items-center w-full max-w-2xl mx-auto gap-10 pt-8 pb-12">
          <ProfileHeader
            name={data.profile?.name || "Muhammad Farhan"}
            tagline={data.profile?.tagline || "🎓 Teknik Informatika Student | 💻 Freelance Fullstack Developer 🌟"}
            avatarUrl={data.profile?.avatarUrl || "/img/foto.jpg"}
          />

          <SocialLinks
            links={data.profile?.socialLinks || []}
          />

          <AboutSection text={data.about || "Belum ada teks..."} />

          <PortfolioSection projects={data.projects.slice(0, 2)} showAllButton={true} />

          <ExperienceSection
            title="Pengalaman Kerja"
            icon={<BriefcaseIcon />}
            items={data.experiences}
          />

          <ExperienceSection
            title="Pengalaman Organisasi"
            icon={<UsersIcon />}
            items={data.organizationExperience}
          />

          <ExperienceSection
            title="Pengalaman Kepanitiaan"
            icon={<CalendarIcon />}
            items={data.committeeExperience}
          />

          <EducationSection
            items={data.education}
          />

          <AwardsSection
            awards={data.awards}
          />

          <CertificationsSection
            certifications={data.certifications}
          />

          <SkillsSection 
            categories={data.skills} 
          />
        </div>

        <Footer name="Muhammad Farhan" />
      </main>
    </div>
  );
}
