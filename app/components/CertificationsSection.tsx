"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { dictionaries } from "@/lib/i18n/dictionaries";

gsap.registerPlugin(ScrollTrigger);

interface Certification {
  title: string;
  issuer: string;
  date: string;
  verifyUrl?: string;
  validUntil?: string;
}

interface CertificationsSectionProps {
  certifications: Certification[];
}

/**
 * CertificationsSection — 2026 21st.dev / Framer Architectural Credential Grid
 * - Kartu sertifikasi dua kolom dengan cursor spotlight & garis aksen atas
 * - Tipografi Playfair Display + JetBrains Mono
 * - Tombol verifikasi arsitektural selaras dengan PortfolioSection
 */
export function CertificationsSection({
  certifications,
}: CertificationsSectionProps) {
  const { language } = useLanguage();
  const dict = dictionaries[language].certifications;
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!sectionRef.current) return;
      const cards = sectionRef.current.querySelectorAll(".cert-bento-card");
      if (cards.length === 0) return;

      gsap.fromTo(
        cards,
        { opacity: 0, y: 36 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.1,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
          },
        },
      );
    },
    { scope: sectionRef, dependencies: [certifications.length] },
  );

  return (
    <section ref={sectionRef} className="w-full py-10 md:py-16">
      {/* Editorial Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12 md:mb-16">
        <div>
          <span
            style={{
              fontFamily: "var(--font-plus-jakarta), sans-serif",
              fontSize: "0.875rem",
              color: "var(--accent)",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              fontWeight: 600,
              display: "block",
              marginBottom: "0.5rem",
            }}
          >
            {dict.sectionNum}
          </span>
          <h2
            style={{
              fontFamily: "var(--font-plus-jakarta), sans-serif",
              fontWeight: 700,
              fontSize: "clamp(2rem, 4vw, 3rem)",
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
              lineHeight: 1.1,
            }}
          >
            {dict.title}
          </h2>
        </div>

        <span
          className="text-xs font-semibold uppercase tracking-wider tabular-nums px-3 py-1.5 self-start sm:self-auto"
          style={{
            color: "var(--text-muted)",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            fontFamily: "var(--font-plus-jakarta), sans-serif",
          }}
        >
          /{String(certifications.length).padStart(2, "0")} CREDENTIALS
        </span>
      </div>

      {/* 21st.dev Architectural Credential Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {certifications.map((cert, index) => (
          <CredentialCard
            key={cert.title + index}
            cert={cert}
            index={index}
            verifyLabel={dict.viewCredential || "Verify"}
          />
        ))}
      </div>
    </section>
  );
}

function CredentialCard({
  cert,
  index,
  verifyLabel,
}: {
  cert: Certification;
  index: number;
  verifyLabel: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className="cert-bento-card group relative overflow-hidden p-6 sm:p-8 flex flex-col justify-between gap-6 transition-colors duration-300"
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Cursor Spotlight Overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background:
            "radial-gradient(380px circle at var(--spot-x, 50%) var(--spot-y, 50%), color-mix(in srgb, var(--accent) 12%, transparent), transparent 70%)",
        }}
      />

      {/* Top Animated Accent Line */}
      <div
        className="absolute top-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-500 ease-out"
        style={{ background: "var(--accent)" }}
      />

      <div className="relative z-10 space-y-4">
        {/* Top Meta Bar: Issuer + Date + Index */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className="text-xs font-semibold tabular-nums"
              style={{ color: "var(--accent)", fontFamily: "var(--font-plus-jakarta), sans-serif" }}
            >
              /{String(index + 1).padStart(2, "0")}
            </span>
            <span
              className="text-xs font-medium tabular-nums px-2.5 py-0.5"
              style={{
                color: "var(--accent)",
                background:
                  "color-mix(in srgb, var(--accent) 10%, transparent)",
                border:
                  "1px solid color-mix(in srgb, var(--accent) 30%, transparent)",
                fontFamily: "var(--font-plus-jakarta), sans-serif",
              }}
            >
              {cert.date}
            </span>
            <span
              className="text-xs uppercase tracking-wider font-medium"
              style={{ color: "var(--text-muted)", fontFamily: "var(--font-plus-jakarta), sans-serif" }}
            >
              {cert.issuer}
            </span>
          </div>
        </div>

        {/* Credential Title */}
        <h3
          className="transition-colors duration-300 group-hover:text-[var(--accent)]"
          style={{
            fontFamily: "var(--font-plus-jakarta), sans-serif",
            fontWeight: 600,
            fontSize: "clamp(1.25rem, 2.2vw, 1.55rem)",
            color: "var(--text-primary)",
            letterSpacing: "-0.015em",
            lineHeight: 1.28,
          }}
        >
          {cert.title}
        </h3>
      </div>

      {/* Bottom Footer: Validity + Architectural Verify Action */}
      <div
        className="relative z-10 pt-4 flex items-center justify-between gap-4"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <span
            className="w-1.5 h-1.5 inline-block"
            style={{ background: "var(--green)" }}
          />
          <span
            className="text-[11px] font-semibold uppercase tracking-wider tabular-nums"
            style={{ color: "var(--text-muted)", fontFamily: "var(--font-plus-jakarta), sans-serif" }}
          >
            {cert.validUntil ? `VALID UNTIL ${cert.validUntil}` : "VERIFIED CREDENTIAL"}
          </span>
        </div>

        {cert.verifyUrl && (
          <a
            href={cert.verifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group/btn inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider no-underline"
            style={{ color: "var(--text-primary)", fontFamily: "var(--font-plus-jakarta), sans-serif" }}
          >
            <span className="group-hover/btn:text-[var(--accent)] transition-colors">
              {verifyLabel}
            </span>
            <span className="w-8 h-8 flex items-center justify-center border border-[var(--border)] text-[var(--text-primary)] transition-all duration-300 group-hover/btn:bg-[var(--accent)] group-hover/btn:border-[var(--accent)] group-hover/btn:text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-3.5 h-3.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25"
                />
              </svg>
            </span>
          </a>
        )}
      </div>
    </div>
  );
}
