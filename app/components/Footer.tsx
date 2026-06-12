"use client";

import { useLanguage } from "@/lib/contexts/LanguageContext";
import { dictionaries } from "@/lib/i18n/dictionaries";

interface FooterProps {
  name?: string;
  email?: string;
  github?: string;
  linkedin?: string;
}

/**
 * Footer — Bold Call to Action
 * Vibrant block for contact to match the new aesthetic
 */
export function Footer({
  name = "Muhammad Farhan",
  email,
  github,
  linkedin,
}: FooterProps) {
  const { language } = useLanguage();
  const dict = dictionaries[language].footer;
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full mt-24">
      {/* Contact block */}
      <div 
        className="w-full relative overflow-hidden flex flex-col items-center justify-center py-20 px-6 text-center border-t border-border"
        style={{
          background: "transparent",
        }}
      >
        {/* Decorative glow */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-full blur-[100px] pointer-events-none opacity-[0.07]"
          style={{ background: "radial-gradient(ellipse at top, var(--accent) 0%, transparent 70%)" }}
        />

        <h2
          style={{
            fontWeight: 500,
            fontSize: "clamp(2rem, 5vw, 4rem)",
            letterSpacing: "-0.02em",
            color: "var(--text-primary)",
            fontFamily: "var(--font-serif), serif",
            lineHeight: 1.1,
            marginBottom: "1rem",
            position: "relative",
            zIndex: 1,
          }}
        >
          {dict.title}
        </h2>
        
        <p
          style={{
            fontSize: "1.125rem",
            color: "var(--text-secondary)",
            maxWidth: "500px",
            lineHeight: 1.6,
            marginBottom: "2.5rem",
            position: "relative",
            zIndex: 1,
          }}
        >
          {dict.subtitle}
        </p>

        {/* Action Button */}
        <a
          href={`mailto:${email || "hi.mhdfarhan@gmail.com"}`}
          className="group relative inline-flex items-center justify-center overflow-hidden  p-4 px-8 font-medium"
          style={{
            background: "var(--accent)",
            color: "#fff",
            textDecoration: "none",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
            zIndex: 1,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 10px 25px -5px var(--accent)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
            (e.currentTarget as HTMLElement).style.boxShadow = "none";
          }}
        >
          <span className="relative z-10" style={{ fontFamily: "var(--font-sans)", fontSize: "1rem" }}>
            Get in touch
          </span>
        </a>

        {/* Social Links */}
        <div className="flex items-center justify-center gap-6 mt-12 relative z-1">
          <FooterSocialLink href={github || "https://github.com/mhdfrhan"} label="GitHub">
            GitHub
          </FooterSocialLink>
          <FooterSocialLink href={linkedin || "https://www.linkedin.com/in/muhammad-farhan-79ba79294/"} label="LinkedIn">
            LinkedIn
          </FooterSocialLink>
          <FooterSocialLink href="https://instagram.com/mhdfarhan04" label="Instagram">
            Instagram
          </FooterSocialLink>
        </div>
      </div>

      {/* Copyright & Back to Top */}
      <div className="py-8 mt-8 flex flex-col sm:flex-row items-center justify-between border-t border-[var(--border)]/20 pt-6">
        <p
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: "0.75rem",
            color: "var(--text-muted)",
            letterSpacing: "0.02em",
          }}
          className="mb-4 sm:mb-0"
        >
          © {currentYear} {name}. {dict.copyright}
        </p>

        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="group flex items-center gap-2"
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: "0.75rem",
            color: "var(--text-secondary)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            transition: "color 0.2s ease",
            padding: "0.5rem 0",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--accent)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
          }}
        >
          <span>back to top</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-3.5 h-3.5 transform group-hover:-translate-y-0.5 transition-transform duration-200"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
          </svg>
        </button>
      </div>
    </footer>
  );
}

function FooterSocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      style={{
        color: "var(--text-secondary)",
        transition: "color 150ms ease",
        fontFamily: "var(--font-jetbrains-mono), monospace",
        fontSize: "0.875rem",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
      }}
    >
      {children}
    </a>
  );
}
