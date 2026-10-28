"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
 * ExperienceSection — Refined iOS-style card list
 * - Items with points: interactive dropdown with smooth spring transition & chevron icon
 * - Items without points: clean static card (no chevron, no empty dropdown, no cramming)
 * - Spacious layout: company and period on top line, title on separate line for breathing room
 */
export function ExperienceSection({
  title,
  sectionNumber = "05.",
  items,
}: ExperienceSectionProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  return (
    <section className="w-full">
      {/* Section label */}
      <div className="flex items-center gap-3 mb-6">
        <span
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: "0.75rem",
            color: "var(--accent)",
            letterSpacing: "0.04em",
          }}
        >
          {sectionNumber}
        </span>
        <h2
          style={{
            fontWeight: 500,
            fontSize: "1.5rem",
            letterSpacing: "-0.015em",
            color: "var(--text-primary)",
            fontStyle: "normal",
          }}
        >
          {title}
        </h2>
        <div
          className="flex-1"
          style={{ height: "1px", background: "var(--border)" }}
        />
      </div>

      {/* Cards List */}
      <div className="flex flex-col gap-3">
        {items.map((item, index) => {
          const hasPoints = Boolean(item.points && item.points.length > 0);
          const isExpanded = hasPoints && expandedIndex === index;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-20px" }}
              transition={{
                duration: 0.35,
                delay: index * 0.04,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              style={{
                borderRadius: "12px",
                border: `1px solid ${isExpanded ? "var(--border-hover)" : "var(--border)"}`,
                background: "var(--bg-secondary)",
                overflow: "hidden",
                transition: "border-color 200ms ease, background 200ms ease",
              }}
            >
              {/* If item has points, it's an interactive button */}
              {hasPoints ? (
                <button
                  type="button"
                  onClick={() => setExpandedIndex(isExpanded ? null : index)}
                  className="w-full text-left p-4 sm:p-5 cursor-pointer focus:outline-none select-none block"
                  aria-expanded={isExpanded}
                >
                  {/* Top line: Company + Period + Chevron */}
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <h3
                      style={{
                        fontFamily: "var(--font-inter), system-ui, sans-serif",
                        fontWeight: 500,
                        fontSize: "1.0625rem",
                        color: "var(--text-primary)",
                        letterSpacing: "-0.01em",
                        lineHeight: 1.4,
                      }}
                    >
                      {item.company}
                    </h3>

                    <div className="flex items-center gap-2.5 flex-shrink-0 mt-0.5">
                      <span
                        style={{
                          fontFamily: "var(--font-jetbrains-mono), monospace",
                          fontSize: "0.75rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        {item.period}
                      </span>

                      {/* Chevron icon (only for items with points) */}
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 25,
                        }}
                        className="text-[var(--text-muted)]"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          className="w-4 h-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m19.5 8.25-7.5 7.5-7.5-7.5"
                          />
                        </svg>
                      </motion.div>
                    </div>
                  </div>

                  {/* Role / Title */}
                  <p
                    style={{
                      fontFamily: "var(--font-inter), system-ui, sans-serif",
                      fontSize: "0.875rem",
                      color: "var(--accent)",
                      lineHeight: 1.5,
                    }}
                  >
                    {item.title}
                  </p>
                </button>
              ) : (
                /* Static Card — NO DROPDOWN, NO CHEVRON */
                <div className="p-4 sm:p-5">
                  {/* Top line: Company + Period */}
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-4 mb-1.5">
                    <h3
                      style={{
                        fontFamily: "var(--font-inter), system-ui, sans-serif",
                        fontWeight: 500,
                        fontSize: "1.0625rem",
                        color: "var(--text-primary)",
                        letterSpacing: "-0.01em",
                        lineHeight: 1.4,
                      }}
                    >
                      {item.company}
                    </h3>

                    <span
                      style={{
                        fontFamily: "var(--font-jetbrains-mono), monospace",
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                        flexShrink: 0,
                      }}
                    >
                      {item.period}
                    </span>
                  </div>

                  {/* Role / Title */}
                  <p
                    style={{
                      fontFamily: "var(--font-inter), system-ui, sans-serif",
                      fontSize: "0.875rem",
                      color: "var(--accent)",
                      lineHeight: 1.5,
                    }}
                  >
                    {item.title}
                  </p>
                </div>
              )}

              {/* Accordion Content — ONLY rendered if item has points */}
              {hasPoints && (
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{
                        height: { type: "spring", stiffness: 350, damping: 30 },
                        opacity: { duration: 0.2 },
                      }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4.5 pt-0 sm:px-5 border-t border-[var(--border)]">
                        <ul className="flex flex-col gap-2 mt-3">
                          {item.points!.map((point, pIndex) => (
                            <li
                              key={pIndex}
                              className="flex items-start gap-2.5"
                              style={{
                                fontFamily:
                                  "var(--font-inter), system-ui, sans-serif",
                                fontSize: "0.875rem",
                                color: "var(--text-secondary)",
                                lineHeight: 1.6,
                              }}
                            >
                              <span
                                style={{
                                  width: "5px",
                                  height: "5px",
                                  borderRadius: "50%",
                                  background: "var(--accent)",
                                  marginTop: "8px",
                                  flexShrink: 0,
                                }}
                              />
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
