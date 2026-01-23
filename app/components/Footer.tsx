"use client";

import { motion } from "framer-motion";

interface FooterProps {
  name?: string;
}

export function Footer({ name = "Muhammad Farhan" }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <motion.footer
      className="mt-auto pt-8 pb-6 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.8 }}
    >
      <p className="text-sm text-muted-foreground">
        © {currentYear} {name}. All rights reserved.
      </p>
      <p className="text-xs text-muted-foreground/60 mt-1">
        Made with{" "}
        <motion.span
          className="inline-block text-accent"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
        >
          ♥
        </motion.span>
      </p>
    </motion.footer>
  );
}
