"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { dictionaries } from "@/lib/i18n/dictionaries";

interface TerminalBlockProps {
  name?: string;
  role?: string;
  about?: string;
  skills?: Array<{ title: string; skills: Array<{ name: string }> }>;
  status?: string;
}

/**
 * TerminalBlock — Signature developer element
 * Menampilkan data dari backend sebagai CLI output.
 * Satu-satunya animasi looping yang diizinkan: terminal cursor blink.
 */
export function TerminalBlock({
  name = "Muhammad Farhan",
  role = "Web Developer",
  about = "",
  skills = [],
  status = "Open to opportunities",
}: TerminalBlockProps) {
  const [isVisible, setIsVisible] = useState(false);
  const { language } = useLanguage();
  const dict = dictionaries[language].terminal;

  useEffect(() => {
    // Small delay agar fade-in terasa natural
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Ambil beberapa skill dari kategori pertama (Tech Stack)
  const techSkills = skills.find(
    (cat) =>
      cat.title.toLowerCase().includes("tech") ||
      cat.title.toLowerCase().includes("stack") ||
      cat.title.toLowerCase().includes("frontend") ||
      cat.title.toLowerCase().includes("backend")
  );

  const skillNames = techSkills
    ? techSkills.skills
        .slice(0, 8)
        .map((s) => s.name.toLowerCase().replace(/\s/g, "-") + "/")
        .join("  ")
    : "react/  nextjs/  tailwind/  laravel/  php/  mysql/";

  // Truncate about text untuk JSON format
  const aboutShort =
    about.length > 60 ? about.substring(0, 60).trimEnd() + "..." : about;

  return (
    <div
      className="w-full rounded-lg overflow-hidden"
      style={{
        background: "var(--bg-code)",
        border: "1px solid var(--border)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
        opacity: isVisible ? 1 : 0,
        transition: "opacity 400ms ease-out",
      }}
    >
      {/* Title bar dengan 3 dots */}
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-secondary)",
        }}
      >
        {/* Window control dots */}
        <div className="flex items-center gap-1.5">
          <span
            className="block rounded-full"
            style={{
              width: "10px",
              height: "10px",
              background: "#ff5f57",
              opacity: 0.8,
            }}
          />
          <span
            className="block rounded-full"
            style={{
              width: "10px",
              height: "10px",
              background: "#febc2e",
              opacity: 0.8,
            }}
          />
          <span
            className="block rounded-full"
            style={{
              width: "10px",
              height: "10px",
              background: "#28c840",
              opacity: 0.8,
            }}
          />
        </div>
        {/* Terminal title */}
        <span
          className="flex-1 text-center"
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: "0.75rem",
            color: "var(--text-muted)",
            letterSpacing: "0.02em",
          }}
        >
          terminal - ~/mhdfarhan
        </span>
      </div>

      {/* Terminal body */}
      <div className="px-5 py-5 space-y-1.5">
        {/* Command: whoami */}
        <TerminalLine prompt="$" command="whoami" />
        <TerminalOutput>
          {name} &mdash;{" "}
          <span style={{ color: "var(--accent)" }}>{role}</span>
        </TerminalOutput>

        {/* Spacer */}
        <div className="py-0.5" />

        {/* Command: cat experience.json */}
        <TerminalLine prompt="$" command="cat experience.json" />
        <TerminalOutput>
          {"{"}{" "}
          <span style={{ color: "var(--accent)" }}>&quot;years&quot;</span>
          {": 4, "}
          <span style={{ color: "var(--accent)" }}>&quot;focus&quot;</span>
          {": "}
          <span style={{ color: "var(--green)" }}>
            &quot;fullstack web development&quot;
          </span>
          {", "}
          <span style={{ color: "var(--accent)" }}>
            &quot;{dict.locationLabel.toLowerCase()}&quot;
          </span>
          {": "}
          <span style={{ color: "var(--green)" }}>
            &quot;Pekanbaru, Indonesia&quot;
          </span>
          {" }"}
        </TerminalOutput>

        {/* Spacer */}
        <div className="py-0.5" />

        {/* Command: ls skills/ */}
        <TerminalLine prompt="$" command="ls skills/" />
        <TerminalOutput>{skillNames}</TerminalOutput>

        {/* Spacer */}
        <div className="py-0.5" />

        {/* Command: echo $STATUS */}
        <TerminalLine prompt="$" command="echo $STATUS" />
        <TerminalOutput>
          <span style={{ color: "var(--green)" }}>
            &quot;{status}&quot;
          </span>
        </TerminalOutput>

        {/* Baris terakhir dengan blinking cursor */}
        <div className="pt-1">
          <span
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: "0.8125rem",
              color: "var(--green)",
            }}
          >
            $
          </span>{" "}
          <span className="terminal-cursor" />
        </div>
      </div>
    </div>
  );
}

/* ---- Sub-components ---- */

function TerminalLine({
  prompt,
  command,
}: {
  prompt: string;
  command: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        style={{
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontSize: "0.8125rem",
          color: "var(--green)",
          flexShrink: 0,
        }}
      >
        {prompt}
      </span>
      <span
        style={{
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontSize: "0.8125rem",
          color: "var(--text-primary)",
        }}
      >
        {command}
      </span>
    </div>
  );
}

function TerminalOutput({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="pl-4"
      style={{
        fontFamily: "var(--font-jetbrains-mono), monospace",
        fontSize: "0.8125rem",
        color: "var(--text-secondary)",
        lineHeight: 1.6,
      }}
    >
      {children}
    </div>
  );
}
