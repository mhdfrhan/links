"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { smoothScrollTo } from "@/lib/utils/smoothScroll";
import { SocialLink as ISocialLink, getPlatformPrefix } from "./SocialLinks";

interface FooterProps {
  name?: string;
  email?: string;
  github?: string;
  linkedin?: string;
  socialLinks?: ISocialLink[];
}

/**
 * Footer — Modern Editorial Sign-off & Telemetry Bar
 * Zero blur-heavy overhead (pure radial gradient), crisp 1px hairlines, and one-click email copy.
 */
export function Footer({
  name = "Muhammad Farhan",
  email,
  github,
  linkedin,
  socialLinks,
}: FooterProps) {
  const { language } = useLanguage();
  const dict = dictionaries[language].footer;
  const currentYear = new Date().getFullYear();
  const [copied, setCopied] = useState(false);

  const emailItem = socialLinks?.find(
    (s) => s.platform.toLowerCase() === "email"
  );
  const contactEmail = emailItem?.url || email || "hi.mhdfarhan@gmail.com";
  const cleanEmail = contactEmail.replace(/^mailto:/i, "");
  const mailtoHref = contactEmail.startsWith("mailto:")
    ? contactEmail
    : `mailto:${contactEmail}`;

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(cleanEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.location.href = mailtoHref;
    }
  };

  return (
    <footer className="w-full mt-24">
      {/* Editorial Contact Block */}
      <div
        className="w-full relative overflow-hidden flex flex-col items-center justify-center py-20 sm:py-24 px-6 text-center border-t border-[var(--border)]"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 0%, color-mix(in srgb, var(--accent) 9%, transparent) 0%, transparent 72%)",
        }}
      >
        <span
          className="relative z-10 text-[11px] font-semibold uppercase tracking-[0.14em] mb-4 inline-flex items-center gap-2"
          style={{
            color: "var(--accent)",
            fontFamily: "var(--font-plus-jakarta), sans-serif",
          }}
        >
          <span className="w-1.5 h-1.5 inline-block" style={{ background: "var(--accent)" }} />
          // {language === "id" ? "TERBUKA UNTUK KOLABORASI" : "OPEN FOR COLLABORATION"}
        </span>

        <h2
          style={{
            fontWeight: 700,
            fontSize: "clamp(1.85rem, 3.8vw, 2.75rem)",
            letterSpacing: "-0.025em",
            color: "var(--text-primary)",
            fontFamily: "var(--font-plus-jakarta), sans-serif",
            lineHeight: 1.08,
            marginBottom: "1rem",
            position: "relative",
            zIndex: 1,
          }}
        >
          {dict.title}
        </h2>

        <p
          style={{
            fontSize: "1.0625rem",
            color: "var(--text-secondary)",
            maxWidth: "520px",
            lineHeight: 1.65,
            marginBottom: "2.25rem",
            position: "relative",
            zIndex: 1,
          }}
        >
          {dict.subtitle}
        </p>

        {/* Action Buttons: Direct Email CTA + Copy Address Micro-interaction */}
        <div className="relative z-10 flex flex-wrap items-center justify-center gap-3">
          <a
            href={mailtoHref}
            className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 text-sm font-semibold uppercase tracking-wider border border-[var(--accent)] bg-[var(--accent)] text-white hover:bg-transparent hover:text-[var(--accent)] transition-colors duration-200 no-underline"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            <span>{language === "id" ? "Hubungi Saya" : "Get in touch"}</span>
            <span className="text-xs transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
              ↗
            </span>
          </a>

          <button
            type="button"
            onClick={handleCopyEmail}
            className="inline-flex items-center gap-2 px-5 py-4 text-xs font-semibold tracking-wider border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-200 cursor-pointer"
            style={{
              background: "var(--bg-secondary)",
              fontFamily: "var(--font-plus-jakarta), sans-serif",
            }}
            title={language === "id" ? "Salin alamat email" : "Copy email address"}
          >
            <span>{copied ? (language === "id" ? "Email Disalin ✓" : "Copied ✓") : cleanEmail}</span>
          </button>
        </div>

        {/* Social Links */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-12 relative z-1">
          {socialLinks && socialLinks.length > 0 ? (
            [...socialLinks]
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
              .map((link, idx) => (
                <FooterSocialLink
                  key={link.platform + idx}
                  href={getPlatformPrefix(link.platform, link.url)}
                  label={link.label || link.platform}
                >
                  {link.label || link.platform}
                </FooterSocialLink>
              ))
          ) : (
            <>
              <FooterSocialLink href={github || "https://github.com/mhdfrhan"} label="GitHub">
                GitHub
              </FooterSocialLink>
              <FooterSocialLink href={linkedin || "https://www.linkedin.com/in/muhammad-farhan-79ba79294/"} label="LinkedIn">
                LinkedIn
              </FooterSocialLink>
              <FooterSocialLink href="https://instagram.com/mhdfarhan04" label="Instagram">
                Instagram
              </FooterSocialLink>
            </>
          )}
        </div>
      </div>

      {/* Copyright & Back to Top */}
      <div className="py-8 mt-8 flex flex-col sm:flex-row items-center justify-between border-t border-[var(--border)]/20 pt-6">
        <p
          style={{
            fontFamily: "var(--font-plus-jakarta), sans-serif",
            fontSize: "0.75rem",
            color: "var(--text-muted)",
            letterSpacing: "0.02em",
          }}
          className="mb-4 sm:mb-0 text-center sm:text-left"
        >
          © {currentYear} {name}. {dict.copyright}
        </p>

        <button
          onClick={() => smoothScrollTo(0)}
          className="group flex items-center gap-2"
          style={{
            fontFamily: "var(--font-plus-jakarta), sans-serif",
            fontSize: "0.75rem",
            fontWeight: 700,
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
        fontFamily: "var(--font-plus-jakarta), sans-serif",
        fontSize: "0.8125rem",
        fontWeight: 500,
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
