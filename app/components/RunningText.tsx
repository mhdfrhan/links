"use client";

import { useEffect, useRef, useState } from "react";

const BASE_WORDS = [
  "FULLSTACK DEVELOPER",
  "CREATIVE CODER",
  "UI/UX ENTHUSIAST",
  "PROBLEM SOLVER",
  "TECH EXPLORER",
];

// Repeat to exceed ultra-wide viewports seamlessly without gaps
const WORDS = [...BASE_WORDS, ...BASE_WORDS, ...BASE_WORDS, ...BASE_WORDS];

export function RunningText() {
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      { rootMargin: "120px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="group w-[100vw] relative left-1/2 -translate-x-1/2 overflow-hidden flex items-center select-none"
      style={{
        background: "var(--accent)",
        height: "56px",
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
          animation: marquee 68s linear infinite;
          will-change: transform;
        }
        .marquee-paused .animate-marquee,
        .group:hover .animate-marquee {
          animation-play-state: paused;
        }
      `}</style>
      <div className={`flex whitespace-nowrap ${inView ? "" : "marquee-paused"}`}>
        <div className="animate-marquee">
          {WORDS.map((word, i) => (
            <div
              key={i}
              className="flex items-center"
              style={{
                fontFamily: "var(--font-plus-jakarta), sans-serif",
                fontSize: "0.9375rem",
                fontWeight: 700,
                color: "#fff",
                letterSpacing: "0.11em",
                paddingRight: "2rem",
              }}
            >
              {word}
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="3.5"
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
                fontFamily: "var(--font-plus-jakarta), sans-serif",
                fontSize: "0.9375rem",
                fontWeight: 700,
                color: "#fff",
                letterSpacing: "0.11em",
                paddingRight: "2rem",
              }}
            >
              {word}
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="3.5"
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
