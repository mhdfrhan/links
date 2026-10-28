"use client";

import { motion } from "framer-motion";
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
 * Border radius halus (12px), dots melingkar halus, entry animation spring.
 */
export function TerminalBlock({
  name = "Muhammad Farhan",
  role = "Web Developer",
  skills = [],
  status = "Open to opportunities",
}: TerminalBlockProps) {
  const { language } = useLanguage();
  const dict = dictionaries[language].terminal;

  // Ambil beberapa skill dari kategori pertama (Tech Stack)
  const techSkills = skills.find(
    (cat) =>
      cat.title.toLowerCase().includes("tech") ||
      cat.title.toLowerCase().includes("stack") ||
      cat.title.toLowerCase().includes("frontend") ||
      cat.title.toLowerCase().includes("backend"),
  );

  const skillNames = techSkills
    ? techSkills.skills
        .slice(0, 6)
        .map((s) => s.name.toLowerCase().replace(/\s/g, "-") + "/")
        .join("  ")
    : "react/  nextjs/  tailwind/  laravel/  php/  mysql/";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="w-full overflow-hidden"
      style={{
        background: "var(--bg-code)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
      }}
    >
      {/* Title bar dengan 3 window dots */}
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-secondary)",
        }}
      >
        {/* Window control dots */}
        <div className="flex items-center gap-2">
          <span
            className="block rounded-full"
            style={{
              width: "10px",
              height: "10px",
              background: "#ff5f57",
              opacity: 0.85,
            }}
          />
          <span
            className="block rounded-full"
            style={{
              width: "10px",
              height: "10px",
              background: "#febc2e",
              opacity: 0.85,
            }}
          />
          <span
            className="block rounded-full"
            style={{
              width: "10px",
              height: "10px",
              background: "#28c840",
              opacity: 0.85,
            }}
          />
        </div>
        {/* Terminal title */}
        <span
          className="flex-1 text-center pr-10"
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: "0.75rem",
            color: "var(--text-muted)",
            letterSpacing: "0.02em",
          }}
        >
          {dict.terminalTitle}
        </span>
      </div>

      {/* Terminal body */}
      <div className="px-4 py-4 md:px-5 md:py-5 space-y-1.5 overflow-x-auto text-[0.8rem] md:text-[0.8125rem]">
        {/* Command: whoami */}
        <TerminalLine prompt="$" command="whoami" />
        <TerminalOutput>
          {name} &mdash; <span style={{ color: "var(--accent)" }}>{role}</span>
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
          <span style={{ color: "var(--green)" }}>&quot;{status}&quot;</span>
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
    </motion.div>
  );
}

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
          color: "var(--green)",
          flexShrink: 0,
        }}
      >
        {prompt}
      </span>
      <span
        style={{
          fontFamily: "var(--font-jetbrains-mono), monospace",
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
      className="pl-3 md:pl-4"
      style={{
        fontFamily: "var(--font-jetbrains-mono), monospace",
        color: "var(--text-secondary)",
        lineHeight: 1.6,
      }}
    >
      {children}
    </div>
  );
}
