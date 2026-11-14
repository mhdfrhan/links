"use client";

import { useEffect, RefObject } from "react";
import gsap from "gsap";

/**
 * Reveal elements smoothly with GPU-composited transform & opacity
 * as soon as they approach the viewport (immune to pin-spacer & dynamic height drift on mobile).
 */
export function useRevealOnView(
  containerRef: RefObject<HTMLElement | null>,
  selector: string,
  deps: unknown[] = [],
) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const elements = Array.from(
      container.querySelectorAll<HTMLElement>(selector),
    );
    if (elements.length === 0) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced || typeof IntersectionObserver === "undefined") {
      gsap.set(elements, { opacity: 1, y: 0, clearProps: "willChange" });
      return;
    }

    const revealed = new WeakSet<Element>();
    const thresholdY = window.innerHeight + 48;

    // Immediately show elements already near/above viewport; prep below-fold items
    const initialHidden: HTMLElement[] = [];
    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top <= thresholdY) {
        revealed.add(el);
        gsap.set(el, { opacity: 1, y: 0 });
      } else {
        gsap.set(el, { opacity: 0, y: 18, force3D: true });
        initialHidden.push(el);
      }
    });

    if (initialHidden.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let batchIndex = 0;
        entries.forEach((entry) => {
          if (!entry.isIntersecting || revealed.has(entry.target)) return;
          revealed.add(entry.target);
          observer.unobserve(entry.target);

          gsap.to(entry.target, {
            opacity: 1,
            y: 0,
            duration: 0.55,
            delay: Math.min(batchIndex * 0.05, 0.15),
            ease: "power3.out",
            force3D: true,
            clearProps: "transform",
          });
          batchIndex += 1;
        });
      },
      {
        // Positive bottom margin starts the reveal right before it enters the phone viewport
        rootMargin: "0px 0px 48px 0px",
        threshold: 0.01,
      },
    );

    initialHidden.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      gsap.killTweensOf(elements);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
