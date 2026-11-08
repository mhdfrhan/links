"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

interface ExperienceItem {
  title: string;
  company: string;
  period: string;
  points?: string[];
}

interface ExperienceSectionProps {
  title: string;
  icon?: React.ReactNode;
  sectionNumber?: string;
  items: ExperienceItem[];
}

/**
 * ExperienceSection — 2026 Awwwards / Framer Asymmetric Editorial Timeline
 * - Left sticky header column (matching AboutSection rhythm)
 * - Right interactive ledger with GSAP ScrollTrigger scrub progress line
 * - Spring accordion for role responsibilities
 */
export function ExperienceSection({
  title,
  sectionNumber = "04.",
  items,
}: ExperienceSectionProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const sectionRef = useRef<HTMLElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!sectionRef.current) return;

      const rows = sectionRef.current.querySelectorAll(".exp-ledger-row");
      if (rows.length > 0) {
        gsap.fromTo(
          rows,
          { opacity: 0, y: 32 },
          {
            opacity: 1,
            y: 0,
            stagger: 0.1,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 78%",
            },
          },
        );
      }

      if (lineRef.current) {
        gsap.fromTo(
          lineRef.current,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 70%",
              end: "bottom 60%",
              scrub: true,
            },
          },
        );
      }
    },
    { scope: sectionRef, dependencies: [items.length] },
  );

  return (
    <section ref={sectionRef} className="w-full py-10 md:py-16">
      <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-start">
        {/* Left Column: Sticky Editorial Header */}
        <div className="w-full lg:w-4/12 lg:sticky lg:top-28">
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
            {sectionNumber}
          </span>

          <h2
            style={{
              fontFamily: "var(--font-plus-jakarta), sans-serif",
              fontWeight: 700,
              fontSize: "clamp(2rem, 3.6vw, 2.75rem)",
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
              lineHeight: 1.12,
              marginBottom: "1.25rem",
            }}
          >
            {title}
          </h2>

          <div
            className="inline-flex items-center gap-2.5 px-3 py-1.5"
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
            }}
          >
            <span
              className="w-1.5 h-1.5 inline-block"
              style={{ background: "var(--accent)" }}
            />
            <span
              className="text-[11px] font-semibold uppercase tracking-wider tabular-nums"
              style={{ color: "var(--text-muted)", fontFamily: "var(--font-plus-jakarta), sans-serif" }}
            >
              /{String(items.length).padStart(2, "0")} RECORDS
            </span>
          </div>
        </div>

        {/* Right Column: Interactive Timeline Ledger */}
        <div className="w-full lg:w-8/12 relative pl-5 sm:pl-8">
          {/* Background Static Rail */}
          <div
            aria-hidden="true"
            className="absolute left-0 top-2 bottom-2 w-[1px]"
            style={{ background: "var(--border)" }}
          />
          {/* GSAP Scroll-Scrubbed Active Accent Rail */}
          <div
            ref={lineRef}
            aria-hidden="true"
            className="absolute left-0 top-2 bottom-2 w-[2px] origin-top"
            style={{ background: "var(--accent)" }}
          />

          <div className="flex flex-col gap-5">
            {items.map((item, index) => {
              const hasPoints = Boolean(item.points && item.points.length > 0);
              const isExpanded = hasPoints && expandedIndex === index;

              return (
                <div
                  key={item.company + item.title + index}
                  className="exp-ledger-row group relative transition-colors duration-300"
                  style={{
                    background: "var(--bg-secondary)",
                    border: `1px solid ${
                      isExpanded ? "var(--accent)" : "var(--border)"
                    }`,
                  }}
                >
                  {/* Timeline Node Dot on the Rail */}
                  <span
                    aria-hidden="true"
                    className="absolute -left-[25px] sm:-left-[37px] top-7 w-2.5 h-2.5 transition-all duration-300"
                    style={{
                      background: isExpanded
                        ? "var(--accent)"
                        : "var(--bg-primary)",
                      border: `2px solid ${
                        isExpanded ? "var(--accent)" : "var(--border-hover)"
                      }`,
                      transform: isExpanded ? "scale(1.2)" : "scale(1)",
                    }}
                  />

                  {/* Top Hover Sweep Line */}
                  <div
                    className="absolute top-0 left-0 h-[2px] transition-all duration-500 ease-out"
                    style={{
                      width: isExpanded ? "100%" : "0%",
                      background: "var(--accent)",
                    }}
                  />

                  {hasPoints ? (
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedIndex(isExpanded ? null : index)
                      }
                      className="w-full text-left p-5 sm:p-7 cursor-pointer focus:outline-none select-none block"
                      aria-expanded={isExpanded}
                    >
                      <ExperienceRowHeader
                        item={item}
                        index={index}
                        hasPoints={true}
                        isExpanded={isExpanded}
                      />
                    </button>
                  ) : (
                    <div className="p-5 sm:p-7">
                      <ExperienceRowHeader
                        item={item}
                        index={index}
                        hasPoints={false}
                        isExpanded={false}
                      />
                    </div>
                  )}

                  {/* Spring Expandable Points */}
                  <AnimatePresence initial={false}>
                    {isExpanded && item.points && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                          height: {
                            type: "spring",
                            stiffness: 380,
                            damping: 34,
                          },
                          opacity: { duration: 0.2 },
                        }}
                        className="overflow-hidden"
                      >
                        <div
                          className="px-5 sm:px-7 pb-6 pt-4 space-y-2.5"
                          style={{ borderTop: "1px solid var(--border)" }}
                        >
                          {item.points.map((point, pIdx) => (
                            <motion.div
                              key={pIdx}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{
                                duration: 0.25,
                                delay: pIdx * 0.04,
                              }}
                              className="flex items-start gap-3 text-sm sm:text-[0.9375rem] leading-relaxed"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              <span
                                className="text-xs font-semibold mt-0.5 flex-shrink-0 select-none"
                                style={{ color: "var(--accent)", fontFamily: "var(--font-plus-jakarta), sans-serif" }}
                              >
                                //
                              </span>
                              <span>{point}</span>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Architectural Row Header ─── */
function ExperienceRowHeader({
  item,
  index,
  hasPoints,
  isExpanded,
}: {
  item: ExperienceItem;
  index: number;
  hasPoints: boolean;
  isExpanded: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      {/* Top Meta Bar: Index + Period */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className="text-xs font-semibold tabular-nums"
            style={{ color: "var(--accent)", fontFamily: "var(--font-plus-jakarta), sans-serif" }}
          >
            /{String(index + 1).padStart(2, "0")}
          </span>
          <span
            className="text-xs font-medium tabular-nums px-2.5 py-0.5"
            style={{
              color: "var(--text-muted)",
              background: "var(--bg-primary)",
              border: "1px solid var(--border)",
              fontFamily: "var(--font-plus-jakarta), sans-serif",
            }}
          >
            {item.period}
          </span>
        </div>

        {hasPoints && (
          <div
            className="w-8 h-8 flex items-center justify-center transition-all duration-300 flex-shrink-0"
            style={{
              border: `1px solid ${
                isExpanded ? "var(--accent)" : "var(--border)"
              }`,
              background: isExpanded ? "var(--accent)" : "transparent",
              color: isExpanded ? "#ffffff" : "var(--text-primary)",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-3.5 h-3.5 transition-transform duration-300"
              style={{
                transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
              }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m19.5 8.25-7.5 7.5-7.5-7.5"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Main Title & Company */}
      <div className="space-y-1">
        <h3
          className="transition-colors duration-200 group-hover:text-[var(--accent)]"
          style={{
            fontFamily: "var(--font-plus-jakarta), sans-serif",
            fontWeight: 600,
            fontSize: "clamp(1.25rem, 2.2vw, 1.6rem)",
            color: "var(--text-primary)",
            letterSpacing: "-0.015em",
            lineHeight: 1.25,
          }}
        >
          {item.company}
        </h3>
        <p
          style={{
            fontFamily: "var(--font-plus-jakarta), sans-serif",
            fontSize: "0.9375rem",
            fontWeight: 500,
            color: "var(--text-secondary)",
          }}
        >
          {item.title}
        </p>
      </div>
    </div>
  );
}
