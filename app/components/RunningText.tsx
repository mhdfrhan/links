"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

const BASE_WORDS = [
  "FULLSTACK DEVELOPER",
  "CREATIVE CODER",
  "UI/UX ENTHUSIAST",
  "PROBLEM SOLVER",
  "TECH EXPLORER"
];

// Multiply the words array to ensure the total width is much larger than any screen,
// preventing the "empty gap" issue when the CSS marquee loops.
const WORDS = [...BASE_WORDS, ...BASE_WORDS, ...BASE_WORDS, ...BASE_WORDS];

export function RunningText() {
  return (
    <section 
      className="w-[100vw] relative left-1/2 -translate-x-1/2 overflow-hidden flex items-center"
      style={{
        background: "var(--accent)",
        height: "60px",
        marginTop: "3rem",
        marginBottom: "1rem",
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <style>{`
        @keyframes marquee {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-100%, 0, 0); }
        }
        .animate-marquee {
          display: flex;
          animation: marquee 70s linear infinite;
          will-change: transform;
        }
      `}</style>
      <div className="flex whitespace-nowrap">
        <div className="animate-marquee">
          {WORDS.map((word, i) => (
            <div 
              key={i} 
              className="flex items-center"
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "1rem",
                fontWeight: 700,
                color: "#fff",
                letterSpacing: "0.1em",
                paddingRight: "2rem",
              }}
            >
              {word}
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="butt"
                style={{ marginLeft: "2rem", color: "#fff", flexShrink: 0 }}
              >
                <line x1="12" y1="2" x2="12" y2="22" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <line x1="4.929" y1="4.929" x2="19.071" y2="19.071" />
                <line x1="19.071" y1="4.929" x2="4.929" y2="19.071" />
              </svg>
            </div>
          ))}
        </div>
        <div className="animate-marquee" aria-hidden="true">
          {WORDS.map((word, i) => (
            <div 
              key={i} 
              className="flex items-center"
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "1rem",
                fontWeight: 700,
                color: "#fff",
                letterSpacing: "0.1em",
                paddingRight: "2rem",
              }}
            >
              {word}
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="butt"
                style={{ marginLeft: "2rem", color: "#fff", flexShrink: 0 }}
              >
                <line x1="12" y1="2" x2="12" y2="22" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <line x1="4.929" y1="4.929" x2="19.071" y2="19.071" />
                <line x1="19.071" y1="4.929" x2="4.929" y2="19.071" />
              </svg>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
