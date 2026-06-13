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
 * ExperienceSection — Timeline bersih
 * Vertical line tipis di kiri, dot accent kecil
 * Warna accent soft blue sesuai design prompt
 */
export function ExperienceSection({
  title,
  sectionNumber = "05.",
  items,
}: ExperienceSectionProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0); // First item expanded by default

  return (
    <section className="w-full">
      {/* Section label */}
      <div className="flex items-center gap-3 mb-8">
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
      <div className="flex flex-col mt-8 border-t border-[var(--border)]">
        {items.map((item, index) => {
          const isExpanded = expandedIndex === index;
          return (
            <div
              key={index}
              className="group relative flex flex-col border-b border-[var(--border)] transition-colors duration-500 hover:bg-[var(--bg-secondary)]"
            >
              {/* Header (Clickable) */}
              <button
                onClick={() => setExpandedIndex(isExpanded ? null : index)}
                className="w-full text-left py-8 md:py-10 px-4 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-12 cursor-pointer focus:outline-none"
              >
                <div className="md:w-1/4 flex-shrink-0">
                  <span
                    className="transition-colors duration-300"
                    style={{
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                      fontSize: "0.85rem",
                      color: isExpanded ? "var(--text-primary)" : "var(--text-secondary)",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase"
                    }}
                  >
                    {item.period}
                  </span>
                </div>

                <div className="md:w-3/4 flex items-center justify-between gap-4">
                  <div>
                    <h3
                      className="transition-colors duration-300"
                      style={{
                        fontFamily: "var(--font-serif), serif",
                        fontWeight: 400,
                        fontSize: "2rem",
                        color: isExpanded ? "var(--accent)" : "var(--text-primary)",
                        marginBottom: "0.25rem",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {item.company}
                    </h3>
                    <p
                      style={{
                        fontFamily: "var(--font-sans), system-ui, sans-serif",
                        fontSize: "1.1rem",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {item.title}
                    </p>
                  </div>

                  {/* Plus/Minus Icon */}
                  <div className="relative w-6 h-6 flex items-center justify-center flex-shrink-0 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors">
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0, opacity: isExpanded ? 0 : 1 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    </motion.div>
                    <motion.div
                      animate={{ rotate: isExpanded ? 0 : -180, opacity: isExpanded ? 1 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                      </svg>
                    </motion.div>
                  </div>
                </div>
              </button>

              {/* Accordion Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-col md:flex-row gap-4 md:gap-12 px-4 pb-10 pt-0">
                      <div className="hidden md:block md:w-1/4 flex-shrink-0" /> {/* Spacer to align with title */}
                      <div className="md:w-3/4 md:pr-12">
                        <ul className="flex flex-col gap-5">
                          {item.points.map((point, pIndex) => (
                          <motion.li
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: pIndex * 0.1 }}
                            key={pIndex}
                            className="flex gap-4 group/point"
                            style={{
                              fontFamily: "var(--font-sans), system-ui, sans-serif",
                              fontSize: "1.05rem",
                              color: "var(--text-secondary)",
                              lineHeight: 1.6,
                            }}
                          >
                            <span className="text-[var(--border)] group-hover/point:text-[var(--accent)] transition-colors mt-2 flex-shrink-0">
                              <div className="w-1.5 h-1.5 rounded-full bg-current" />
                            </span>
                            <span>{point}</span>
                          </motion.li>
                        ))}
                      </ul>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}
