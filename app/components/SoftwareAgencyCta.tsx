"use client";

import { useRef } from "react";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { useRevealOnView } from "@/lib/utils/useRevealOnView";

/**
 * SoftwareAgencyCta — 2026 Awwwards / 21st.dev Architectural Promo Card
 * Kartu CTA layanan pembuatan software (https://handigital.biz.id)
 * dengan redirect target="_blank", cursor spotlight, dan GSAP ScrollTrigger.
 */
export function SoftwareAgencyCta() {
  const { language } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLAnchorElement>(null);
  const rectRef = useRef<DOMRect | null>(null);

  useRevealOnView(sectionRef, ".agency-cta-card", []);

  const handleMouseEnter = () => {
    if (cardRef.current) {
      rectRef.current = cardRef.current.getBoundingClientRect();
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const el = cardRef.current;
    const rect = rectRef.current;
    if (!el || !rect) return;
    el.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
  };

  const services =
    language === "id"
      ? [
          "Web Application & SaaS",
          "Sistem Informasi & ERP",
          "Company Profile & Landing Page",
          "UI/UX & Produk Digital",
        ]
      : [
          "Web Applications & SaaS",
          "Enterprise & Information Systems",
          "Company Profile & Landing Pages",
          "UI/UX & Digital Products",
        ];

  return (
    <section ref={sectionRef} className="w-full py-10 md:py-16">
      <a
        ref={cardRef}
        href="https://handigital.biz.id"
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        className="agency-cta-card group relative block w-full overflow-hidden p-7 sm:p-10 md:p-12 no-underline transition-colors duration-300 border border-[var(--border)] hover:border-[var(--accent)]"
        style={{
          background: "var(--bg-secondary)",
          borderRadius: 0,
        }}
      >
        {/* 21st.dev Cursor Spotlight Overlay */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background:
              "radial-gradient(560px circle at var(--spot-x, 50%) var(--spot-y, 50%), color-mix(in srgb, var(--accent) 14%, transparent), transparent 70%)",
          }}
        />

        {/* Ambient Corner Accent Glow (Pure radial gradient, zero filter:blur overhead) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 opacity-25 group-hover:opacity-40 transition-opacity duration-500"
          style={{
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--accent) 32%, transparent) 0%, transparent 70%)",
          }}
        />

        {/* Top Animated Accent Sweep Bar (GPU scaleX only) */}
        <div
          aria-hidden="true"
          className="absolute top-0 left-0 right-0 h-[2px] origin-left scale-x-[0.18] group-hover:scale-x-100 transition-transform duration-500 ease-out will-change-transform"
          style={{ background: "var(--accent)" }}
        />

        {/* Background Architectural Watermark */}
        <span
          aria-hidden="true"
          className="pointer-events-none select-none absolute -bottom-8 right-6 font-sans font-bold leading-none opacity-[0.035] group-hover:opacity-[0.07] transition-opacity duration-500"
          style={{
            fontSize: "clamp(4.5rem, 11vw, 8.5rem)",
            color: "var(--text-primary)",
          }}
        >
          HANDIGITAL
        </span>

        {/* Top Metadata Bar */}
        <div
          className="relative z-10 flex flex-wrap items-center justify-between gap-4 pb-6 mb-8"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-3">
            <span
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--accent)", fontFamily: "var(--font-plus-jakarta), sans-serif" }}
            >
              // {language === "id" ? "LAYANAN PEMBUATAN SOFTWARE" : "SOFTWARE DEVELOPMENT AGENCY"}
            </span>
          </div>

          <div
            className="inline-flex items-center gap-2 px-3 py-1"
            style={{
              background: "var(--bg-primary)",
              border: "1px solid var(--border)",
            }}
          >
            <span
              className="w-1.5 h-1.5 inline-block"
              style={{ background: "var(--green)" }}
            />
            <span
              className="text-[11px] font-semibold tracking-wider"
              style={{ color: "var(--text-secondary)", fontFamily: "var(--font-plus-jakarta), sans-serif" }}
            >
              handigital.biz.id
            </span>
          </div>
        </div>

        {/* Main Split Content */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-end">
          {/* Left Column: Headline, Copy & Capabilities (8 cols) */}
          <div className="lg:col-span-8 space-y-5">
            <h2
              className="transition-colors duration-300 group-hover:text-[var(--accent)]"
              style={{
                fontFamily: "var(--font-plus-jakarta), sans-serif",
                fontWeight: 700,
                fontSize: "clamp(1.4rem, 2.5vw, 1.85rem)",
                letterSpacing: "-0.02em",
                color: "var(--text-primary)",
                lineHeight: 1.14,
              }}
            >
              {language === "id"
                ? "Butuh Pembuatan Website, Aplikasi, atau Sistem Software Kustom?"
                : "Need Custom Software, Web Applications, or Digital Systems?"}
            </h2>

            <p
              className="text-sm sm:text-base leading-relaxed max-w-2xl"
              style={{
                fontFamily: "var(--font-plus-jakarta), sans-serif",
                color: "var(--text-secondary)",
              }}
            >
              {language === "id"
                ? "Melalui HanDigital, saya menyediakan jasa pembuatan software profesional untuk bisnis, instansi, dan startup. Mulai dari perancangan UI/UX, pengembangan website modern, hingga sistem informasi skala produksi."
                : "Through HanDigital, I provide professional software engineering services for businesses, institutions, and startups. From UI/UX design and modern web platforms to production-grade information systems."}
            </p>

            {/* Service Capability Pills */}
            <div className="pt-2 flex flex-wrap gap-2">
              {services.map((service) => (
                <span
                  key={service}
                  className="text-xs font-medium px-3 py-1.5 inline-flex items-center gap-2"
                  style={{
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border)",
                    color: "var(--text-secondary)",
                    fontFamily: "var(--font-plus-jakarta), sans-serif",
                  }}
                >
                  <span
                    className="w-1 h-1 inline-block"
                    style={{ background: "var(--accent)" }}
                  />
                  {service}
                </span>
              ))}
            </div>
          </div>

          {/* Right Column: Action CTA Block (4 cols) */}
          <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-end gap-4">
            <div
              className="w-full lg:w-auto px-6 py-4 flex items-center justify-between lg:justify-center gap-4 text-xs uppercase tracking-wider font-semibold transition-colors duration-200"
              style={{
                background: "var(--accent)",
                color: "#ffffff",
                border: "1px solid var(--accent)",
                fontFamily: "var(--font-plus-jakarta), sans-serif",
              }}
            >
              <span>
                {language === "id"
                  ? "Kunjungi handigital.biz.id"
                  : "Visit handigital.biz.id"}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 flex-shrink-0"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25"
                />
              </svg>
            </div>

            <span
              className="text-[11px] font-medium uppercase tracking-wider text-left lg:text-right"
              style={{ color: "var(--text-muted)", fontFamily: "var(--font-plus-jakarta), sans-serif" }}
            >
              {language === "id"
                ? "Konsultasi Gratis • Pengerjaan Terstruktur"
                : "Free Consultation • Production Ready"}
            </span>
          </div>
        </div>
      </a>
    </section>
  );
}
