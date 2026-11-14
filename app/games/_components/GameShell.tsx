"use client";

import Link from "next/link";
import { ArrowLeftIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from "@heroicons/react/24/outline";
import { ThemeToggle } from "@/app/components/ThemeToggle";
import { LanguageToggle } from "@/app/components/LanguageToggle";
import { useLanguage } from "@/lib/contexts/LanguageContext";

interface GameShellProps {
  code: string;
  titleId: string;
  titleEn: string;
  muted: boolean;
  onToggleMute: () => void;
  children: React.ReactNode;
}

export function GameShell({
  code,
  titleId,
  titleEn,
  muted,
  onToggleMute,
  children,
}: GameShellProps) {
  const { language } = useLanguage();
  const title = language === "id" ? titleId : titleEn;

  return (
    <div
      className="relative w-full h-[100dvh] overflow-hidden flex flex-col select-none"
      style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}
    >
      {/* Minimal Architectural Header */}
      <header
        className="relative z-20 shrink-0 border-b px-4 sm:px-6 h-14 flex items-center justify-between gap-3"
        style={{
          borderColor: "var(--border)",
          background: "color-mix(in srgb, var(--bg-primary) 88%, transparent)",
          backdropFilter: "blur(10px)",
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-medium transition-colors hover:text-[var(--accent)]"
            style={{ color: "var(--text-secondary)", textDecoration: "none" }}
          >
            <span
              className="w-7 h-7 border flex items-center justify-center shrink-0 transition-colors"
              style={{ borderColor: "var(--border)" }}
            >
              <ArrowLeftIcon className="w-3.5 h-3.5" />
            </span>
            <span className="hidden sm:inline">
              {language === "id" ? "Beranda" : "Home"}
            </span>
          </Link>

          <div className="h-4 w-[1px]" style={{ background: "var(--border)" }} />

          <div className="flex items-center gap-2 min-w-0">
            <span
              className="text-[11px] font-bold tracking-widest uppercase px-1.5 py-0.5 border shrink-0"
              style={{
                color: "var(--accent)",
                borderColor: "color-mix(in srgb, var(--accent) 40%, transparent)",
                background: "color-mix(in srgb, var(--accent) 8%, transparent)",
              }}
            >
              {code}
            </span>
            <h1
              className="font-semibold truncate"
              style={{ fontSize: "clamp(0.75rem, 1vw, 0.875rem)", lineHeight: 1.25 }}
            >
              {title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={muted ? "Unmute sound" : "Mute sound"}
            title={muted ? "Audio Off" : "Audio On"}
            className="w-9 h-9 border flex items-center justify-center transition-colors hover:border-[var(--accent)] cursor-pointer"
            style={{
              borderColor: "var(--border)",
              background: "var(--bg-secondary)",
              color: muted ? "var(--text-muted)" : "var(--text-primary)",
            }}
          >
            {muted ? (
              <SpeakerXMarkIcon className="w-4 h-4" />
            ) : (
              <SpeakerWaveIcon className="w-4 h-4" />
            )}
          </button>
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>

      {/* Main Game Viewport */}
      <main className="relative flex-1 min-h-0 w-full">{children}</main>
    </div>
  );
}
