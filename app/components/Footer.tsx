"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

interface FooterProps {
  name?: string;
}

export function Footer({ name = "Muhammad Farhan" }: FooterProps) {
  const footerRef = useRef<HTMLElement>(null);
  const heartRef = useRef<HTMLSpanElement>(null);
  const currentYear = new Date().getFullYear();

  useGSAP(() => {
    gsap.fromTo(footerRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.8, delay: 1, ease: "power2.out" }
    );

    gsap.to(heartRef.current, {
      scale: 1.2,
      duration: 0.5,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      repeatDelay: 1
    });
  }, { scope: footerRef, dependencies: [] });

  return (
    <footer ref={footerRef} className="mt-auto pt-8 pb-6 text-center opacity-0">
      <p className="text-sm text-muted-foreground">
        © {currentYear} {name}. All rights reserved.
      </p>
      <p className="text-xs text-muted-foreground/60 mt-1">
        Made with{" "}
        <span
          ref={heartRef}
          className="inline-block text-accent"
        >
          ♥
        </span>
      </p>
    </footer>
  );
}
