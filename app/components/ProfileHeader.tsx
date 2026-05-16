"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { dictionaries } from "@/lib/i18n/dictionaries";

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
}

/**
 * ProfileHeader — Hero section 2 kolom
 * Kiri: greeting, nama, role, bio singkat, social icons kecil
 * Kanan: foto profil menonjol (rounded-xl, aspect 3:4), tag "4+ years experience"
 * Semua data dari backend via props
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
}: ProfileHeaderProps) {
  // Gunakan tagline sebagai role — ambil bagian pertama sebelum "|" jika ada
  const role = tagline.includes("|")
    ? tagline.split("|")[1]?.trim()
    : tagline.replace(/[🎓💻🌟]/g, "").trim();

  // Bio singkat: 2 kalimat pertama dari about text, atau fallback
  const bioLines = about
    ? about.split(".").slice(0, 2).join(". ").trim() + "."
    : "Fullstack web developer dengan pengalaman 4 tahun mengerjakan berbagai project web dari skala lokal hingga nasional.";

  return (
    <section className="w-full">
      {/* Desktop: 2 kolom | Mobile: stack vertikal */}
      <div className="flex flex-col-reverse md:flex-row items-start md:items-center gap-10 md:gap-12">

        {/* ——— Kolom Kiri: Teks ——— */}
        <div className="flex-1 space-y-5">

          {/* Greeting mono label */}
          <p
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              letterSpacing: "0.04em",
            }}
          >
            hi, i&apos;m
          </p>

          {/* Nama — Inter 500, bukan bold */}
          <h1
            style={{
              fontWeight: 500,
              fontSize: "2.25rem",
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
              color: "var(--text-primary)",
              fontStyle: "normal",
            }}
          >
            {name}
          </h1>

          {/* Role */}
          <p
            style={{
              fontSize: "1rem",
              color: "var(--text-secondary)",
              lineHeight: 1.5,
              fontStyle: "normal",
              marginTop: "-0.5rem",
            }}
          >
            Fullstack Web Developer
          </p>

          {/* Bio singkat */}
          <p
            style={{
              fontSize: "0.9375rem",
              color: "var(--text-secondary)",
              lineHeight: 1.7,
              maxWidth: "480px",
              fontStyle: "normal",
            }}
          >
            {bioLines}
          </p>

          {/* Social icons row — subtle, kecil */}
          <div className="flex items-center gap-4 pt-1">
            <SocialIcon
              href={github || "https://github.com/mhdfrhan"}
              label="GitHub"
              icon={
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              }
            />
            <SocialIcon
              href={linkedin || "https://www.linkedin.com/in/muhammad-farhan-79ba79294/"}
              label="LinkedIn"
              icon={
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              }
            />
            <SocialIcon
              href={`mailto:${email || "hi.mhdfarhan@gmail.com"}`}
              label="Email"
              icon={
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                  />
                </svg>
              }
            />
          </div>

          {/* Status badge */}
          <div className="flex items-center gap-2 pt-1">
            <span
              className="block rounded-full"
              style={{
                width: "7px",
                height: "7px",
                background: "var(--green)",
                flexShrink: 0,
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
              available for new projects
            </span>
          </div>

          {/* Download CV button */}
          {cvData && (cvData.id || cvData.en) && (
            <CvDownloadButton cvData={cvData} />
          )}
        </div>

        {/* ——— Kolom Kanan: Foto Profil ——— */}
        <div className="flex flex-col items-center gap-3 md:flex-shrink-0 self-center md:self-auto w-full md:w-auto mt-6 md:mt-0">
          {/* Foto container */}
          <div
            className="relative overflow-hidden"
            style={{
              width: "180px",
              height: "240px",
              borderRadius: "12px",
              border: "1px solid var(--border)",
            }}
          >
            <Image
              src={avatarUrl}
              alt={`Foto profil ${name}`}
              fill
              sizes="180px"
              className="object-cover"
              priority
            />
          </div>

          {/* Experience tag di bawah foto */}
          <span
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: "0.7rem",
              color: "var(--text-muted)",
              letterSpacing: "0.03em",
            }}
          >
            4+ years experience
          </span>
        </div>
      </div>
    </section>
  );
}

/* ---- Format file size ---- */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ---- CV Download Button with Dropdown ---- */
function CvDownloadButton({
  cvData,
}: {
  cvData: { id?: CvEntry; en?: CvEntry };
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { language } = useLanguage();
  const dict = dictionaries[language];

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative pt-2" ref={dropdownRef}>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontSize: "0.75rem",
          color: "var(--accent)",
          background: "transparent",
          border: "1px solid var(--border)",
          borderRadius: "6px",
          padding: "0.4rem 0.75rem",
          cursor: "pointer",
          transition: "border-color 200ms ease, background 200ms ease",
          display: "inline-flex",
          alignItems: "center",
          gap: "0.375rem",
          letterSpacing: "0.02em",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.borderColor = "var(--border-hover)";
          el.style.background = "var(--bg-secondary)";
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = "var(--border)";
            el.style.background = "transparent";
          }
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          style={{ width: "14px", height: "14px" }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
          />
        </svg>
        {dict.hero.downloadCv.toLowerCase()}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          style={{
            width: "10px",
            height: "10px",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 150ms ease",
          }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m19.5 8.25-7.5 7.5-7.5-7.5"
          />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            zIndex: 20,
            minWidth: "200px",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "0.25rem",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          }}
        >
          {cvData.id && (
            <a
              href={cvData.id.url}
              download={cvData.id.fileName}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.5rem 0.625rem",
                borderRadius: "6px",
                textDecoration: "none",
                transition: "background 150ms ease",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "var(--bg-tertiary)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "transparent";
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: "0.75rem",
                  color: "var(--text-primary)",
                }}
              >
                🇮🇩 bahasa indonesia
              </span>
              <span
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: "0.65rem",
                  color: "var(--text-muted)",
                }}
              >
                {formatSize(cvData.id.fileSize)}
              </span>
            </a>
          )}
          {cvData.en && (
            <a
              href={cvData.en.url}
              download={cvData.en.fileName}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.5rem 0.625rem",
                borderRadius: "6px",
                textDecoration: "none",
                transition: "background 150ms ease",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "var(--bg-tertiary)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "transparent";
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: "0.75rem",
                  color: "var(--text-primary)",
                }}
              >
                🇬🇧 english
              </span>
              <span
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: "0.65rem",
                  color: "var(--text-muted)",
                }}
              >
                {formatSize(cvData.en.fileSize)}
              </span>
            </a>
          )}
        </div>
      )}
    </div>
  );
}

/* ---- Icon social kecil ---- */
function SocialIcon({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      style={{
        color: "var(--text-muted)",
        transition: "color 150ms ease",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.color = "var(--accent)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
      }}
    >
      {icon}
    </a>
  );
}
