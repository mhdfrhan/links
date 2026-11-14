"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });

    // Auto-refresh ScrollTrigger when async content (Firebase, GitHub chart, accordions) alters page height
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    let lastHeight = document.documentElement.scrollHeight;
    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            const nextHeight = document.documentElement.scrollHeight;
            if (Math.abs(nextHeight - lastHeight) < 8) return;
            lastHeight = nextHeight;
            if (refreshTimer) clearTimeout(refreshTimer);
            refreshTimer = setTimeout(() => {
              ScrollTrigger.refresh();
            }, 150);
          })
        : null;

    resizeObserver?.observe(document.body);

    // Respect user reduced-motion preference cleanly
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      return () => {
        resizeObserver?.disconnect();
        if (refreshTimer) clearTimeout(refreshTimer);
      };
    }

    // Prevent GSAP jump glitches after tab switches or brief frame spikes
    gsap.ticker.lagSmoothing(0);

    // Initialize Lenis with autoRaf: false to let GSAP's ticker handle physics synchronously
    const lenis = new Lenis({
      autoRaf: false,
      smoothWheel: true,
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      touchMultiplier: 1.6,
    });

    // Expose lenis globally for smoothScrollTo utility
    (window as any).__lenis = lenis;

    // Update ScrollTrigger on Lenis scroll
    lenis.on("scroll", ScrollTrigger.update);

    // Unified render loop (synchronized with GSAP animations)
    const updateLenis = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(updateLenis);

    return () => {
      resizeObserver?.disconnect();
      if (refreshTimer) clearTimeout(refreshTimer);
      delete (window as any).__lenis;
      lenis.off("scroll", ScrollTrigger.update);
      lenis.destroy();
      gsap.ticker.remove(updateLenis);
    };
  }, []);

  return <>{children}</>;
}
