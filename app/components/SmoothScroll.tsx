"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Register ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    // Initialize Lenis with autoRaf: false to let GSAP's ticker handle physics synchronously
    const lenis = new Lenis({
      autoRaf: false,
      smoothWheel: true,
    });

    // Update ScrollTrigger on Lenis scroll
    lenis.on("scroll", () => {
      ScrollTrigger.update();
    });

    // Unified render loop (synchronized with GSAP animations)
    const updateLenis = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(updateLenis);

    return () => {
      lenis.destroy();
      gsap.ticker.remove(updateLenis); // Properly clean up the handler using its reference
    };
  }, []);

  return <>{children}</>;
}
