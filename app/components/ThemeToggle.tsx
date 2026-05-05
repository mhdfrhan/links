"use client";

import { useTheme } from "next-themes";
import { useEffect, useState, useRef, useCallback } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const sunRef = useRef<HTMLDivElement>(null);
  const moonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleThemeChange = useCallback(() => {
    if (isAnimating || !buttonRef.current) return;

    const button = buttonRef.current;
    const rect = button.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    const maxX = Math.max(x, window.innerWidth - x);
    const maxY = Math.max(y, window.innerHeight - y);
    const maxRadius = Math.sqrt(maxX * maxX + maxY * maxY) + 100;

    const newTheme = resolvedTheme === "dark" ? "light" : "dark";
    const oldThemeBg = resolvedTheme === "dark" ? "#0a0a0a" : "#fafafa";

    setIsAnimating(true);

    const circleOverlay = document.createElement("div");
    circleOverlay.id = "theme-circle-overlay";
    circleOverlay.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 99999;
      pointer-events: none;
      background-color: ${oldThemeBg};
      clip-path: circle(${maxRadius}px at ${x}px ${y}px);
      will-change: clip-path;
      transform: translateZ(0);
    `;

    document.body.appendChild(circleOverlay);

    setTheme(newTheme);

    const disableTransitions = document.createElement("style");
    disableTransitions.textContent = `* { transition: none !important; }`;
    document.head.appendChild(disableTransitions);

    gsap.to(circleOverlay, {
      clipPath: `circle(0px at ${x}px ${y}px)`,
      duration: 0.6,
      ease: "power3.inOut",
      onComplete: () => {
        circleOverlay.remove();
        disableTransitions.remove();
        setIsAnimating(false);
      }
    });

  }, [resolvedTheme, setTheme, isAnimating]);

  useGSAP(() => {
    if (!mounted) return;

    const isDark = resolvedTheme === "dark";

    if (isDark) {
      gsap.fromTo(sunRef.current,
        { rotate: -45, scale: 0, opacity: 0 },
        { rotate: 0, scale: 1, opacity: 1, duration: 0.5, ease: "power3.out" }
      );
    } else {
      gsap.fromTo(moonRef.current,
        { rotate: 45, scale: 0, opacity: 0 },
        { rotate: 0, scale: 1, opacity: 1, duration: 0.5, ease: "power3.out" }
      );
    }
  }, { dependencies: [resolvedTheme, mounted], revertOnUpdate: true });

  const onEnter = () => {
    gsap.to(buttonRef.current, { scale: 1.05, duration: 0.3, ease: "power2.out" });
  };

  const onLeave = () => {
    gsap.to(buttonRef.current, { scale: 1, duration: 0.3, ease: "power2.out" });
  };

  const onDown = () => {
    gsap.to(buttonRef.current, { scale: 0.95, duration: 0.1 });
  };

  if (!mounted) {
    return (
      <div className="h-11 w-11 rounded-full bg-muted animate-pulse" />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      ref={buttonRef}
      onClick={handleThemeChange}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onMouseDown={onDown}
      onMouseUp={onEnter}
      className="relative h-11 w-11 rounded-full bg-card border border-border flex items-center justify-center hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background shadow-lg shadow-black/5 dark:shadow-black/20 overflow-hidden"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      disabled={isAnimating}
    >
      <div className="relative flex items-center justify-center w-full h-full">
        {isDark ? (
          <div ref={sunRef}>
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
          </div>
        ) : (
          <div ref={moonRef}>
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
          </div>
        )}
      </div>
    </button>
  );
}
