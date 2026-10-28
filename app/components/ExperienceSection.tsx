"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ExperienceItem {
  title: string;
  company: string;
  period: string;
  points: string[];
}

interface ExperienceSectionProps {
  title: string;
  icon?: React.ReactNode;
  sectionNumber?: string;
  items: ExperienceItem[];
}

/**
 * ExperienceSection — Modern iOS-style spring accordion
 * Clean layout, smooth transitions, mobile-first responsive.
 */
export function ExperienceSection({
  title,
  sectionNumber = "05.",
  items,
}: ExperienceSectionProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

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

      {/* Accordion List */}
      <div className="flex flex-col gap-3">
        {items.map((item, index) => {
          const isExpanded = expandedIndex === index;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-20px" }}
              transition={{
                duration: 0.35,
                delay: index * 0.05,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              style={{
                borderRadius: "12px",
                border: `1px solid ${isExpanded ? "var(--border-hover)" : "var(--border)"}`,
                background: isExpanded
                  ? "var(--bg-secondary)"
                  : "color-mix(in srgb, var(--bg-secondary) 50%, transparent)",
                overflow: "hidden",
                transition: "border-color 200ms ease, background 200ms ease",
              }}
            >
              {/* Header (Clickable) */}
              <button
                onClick={() => setExpandedIndex(isExpanded ? null : index)}
                className="w-full text-left p-4 md:p-5 flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
              >
                <div className="flex flex-col md:flex-row md:items-baseline gap-1 md:gap-4 flex-1 min-w-0">
                  <h3
                    style={{
                      fontFamily: "var(--font-inter), system-ui, sans-serif",
                      fontWeight: 500,
                      fontSize: "1.125rem",
                      color: isExpanded ? "var(--text-primary)" : "var(--text-secondary)",
                      letterSpacing: "-0.01em",
                      transition: "color 200ms ease",
                    }}
                  >
                    {item.company}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span
                      style={{
                        fontFamily: "var(--font-inter), system-ui, sans-serif",
                        fontSize: "0.875rem",
                        color: "var(--accent)",
                      }}
                    >
                      {item.title}
                    </span>
                    <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                      &bull;
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-jetbrains-mono), monospace",
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      {item.period}
                    </span>
                  </div>
                </div>

                {/* iOS Chevron Icon */}
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="flex-shrink-0 text-[var(--text-muted)]"
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
              </button>

              {/* Accordion Content */}
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
                    <div className="px-4 pb-5 pt-1 md:px-5 border-t border-[var(--border)]">
                      <ul className="flex flex-col gap-2.5 mt-3">
                        {item.points.map((point, pIndex) => (
                          <li
                            key={pIndex}
                            className="flex items-start gap-3"
                            style={{
                              fontFamily: "var(--font-inter), system-ui, sans-serif",
                              fontSize: "0.875rem",
                              color: "var(--text-secondary)",
                              lineHeight: 1.65,
                            }}
                          >
                            <span
                              style={{
                                width: "5px",
                                height: "5px",
                                borderRadius: "50%",
                                background: "var(--accent)",
                                marginTop: "9px",
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
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
