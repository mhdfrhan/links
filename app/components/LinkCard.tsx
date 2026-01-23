"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface LinkCardProps {
  href: string;
  icon: ReactNode;
  label: string;
  description?: string;
  delay?: number;
}

export function LinkCard({
  href,
  icon,
  label,
  description,
  delay = 0,
}: LinkCardProps) {
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 + delay }}
    >
      <motion.div
        className="relative flex items-center gap-4 p-4 rounded-2xl bg-card border border-border overflow-hidden"
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        {/* Hover glow effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-accent/10 via-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        />

        {/* Icon */}
        <div className="relative flex-shrink-0 h-12 w-12 rounded-xl bg-muted flex items-center justify-center text-accent group-hover:bg-accent/10 transition-colors duration-300">
          {icon}
        </div>

        {/* Content */}
        <div className="relative flex-1 min-w-0">
          <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors duration-300">
            {label}
          </h3>
          {description && (
            <p className="text-sm text-muted-foreground truncate">
              {description}
            </p>
          )}
        </div>

        {/* Arrow */}
        <motion.div
          className="relative flex-shrink-0 text-muted-foreground group-hover:text-accent transition-colors duration-300"
          initial={{ x: 0 }}
          whileHover={{ x: 4 }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m8.25 4.5 7.5 7.5-7.5 7.5"
            />
          </svg>
        </motion.div>
      </motion.div>
    </motion.a>
  );
}
