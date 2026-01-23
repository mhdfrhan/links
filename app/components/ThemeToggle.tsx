"use client";

import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef, useCallback } from "react";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleThemeChange = useCallback(async () => {
    if (isAnimating || !buttonRef.current) return;

    const button = buttonRef.current;
    const rect = button.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    // Calculate the maximum radius needed to cover the entire viewport
    const maxX = Math.max(x, window.innerWidth - x);
    const maxY = Math.max(y, window.innerHeight - y);
    const maxRadius = Math.sqrt(maxX * maxX + maxY * maxY) * 1.1; // 10% extra for safety

    const newTheme = resolvedTheme === "dark" ? "light" : "dark";
    const newBgColor = newTheme === "dark" ? "#0a0a0a" : "#fafafa";

    // Check for View Transitions API support (Chrome 111+)
    if (document.startViewTransition) {
      setIsAnimating(true);
      
      document.documentElement.style.setProperty("--reveal-x", `${x}px`);
      document.documentElement.style.setProperty("--reveal-y", `${y}px`);
      document.documentElement.style.setProperty("--reveal-radius", `${maxRadius}px`);

      const transition = document.startViewTransition(() => {
        setTheme(newTheme);
      });

      transition.ready.then(() => {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${maxRadius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 700,
            easing: "cubic-bezier(0.16, 1, 0.3, 1)", // Smooth expo ease-out
            pseudoElement: "::view-transition-new(root)",
          }
        );
      });

      transition.finished.then(() => {
        setIsAnimating(false);
      });
    } else {
      // Fallback for browsers without View Transitions API
      setIsAnimating(true);

      // Create the overlay element for radial reveal
      const overlay = document.createElement("div");
      overlay.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 9999;
        pointer-events: none;
        background: ${newBgColor};
        clip-path: circle(0px at ${x}px ${y}px);
        will-change: clip-path;
      `;
      document.body.appendChild(overlay);

      // Use requestAnimationFrame for smoother animation start
      requestAnimationFrame(() => {
        const animation = overlay.animate(
          [
            { clipPath: `circle(0px at ${x}px ${y}px)` },
            { clipPath: `circle(${maxRadius}px at ${x}px ${y}px)` },
          ],
          {
            duration: 700,
            easing: "cubic-bezier(0.16, 1, 0.3, 1)", // Smooth expo ease-out
            fill: "forwards",
          }
        );

        // Change theme at 35% of animation for smoother perception
        setTimeout(() => {
          setTheme(newTheme);
        }, 250);

        animation.onfinish = () => {
          // Small delay before removing overlay for smoother finish
          setTimeout(() => {
            overlay.remove();
            setIsAnimating(false);
          }, 100);
        };
      });
    }
  }, [resolvedTheme, setTheme, isAnimating]);

  if (!mounted) {
    return (
      <div className="h-11 w-11 rounded-full bg-muted animate-pulse" />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <motion.button
      ref={buttonRef}
      onClick={handleThemeChange}
      className="relative h-11 w-11 rounded-full bg-card border border-border flex items-center justify-center hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background shadow-lg shadow-black/5 dark:shadow-black/20 overflow-hidden"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      disabled={isAnimating}
      style={{ willChange: "transform" }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.div
            key="sun"
            initial={{ rotate: -45, scale: 0, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: 45, scale: 0, opacity: 0 }}
            transition={{ 
              duration: 0.35, 
              ease: [0.22, 1, 0.36, 1] // Same smooth ease
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5 text-amber-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
              />
            </svg>
          </motion.div>
        ) : (
          <motion.div
            key="moon"
            initial={{ rotate: 45, scale: 0, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: -45, scale: 0, opacity: 0 }}
            transition={{ 
              duration: 0.35, 
              ease: [0.22, 1, 0.36, 1]
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5 text-slate-600"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
              />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
