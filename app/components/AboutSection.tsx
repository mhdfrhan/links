"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface AboutSectionProps {
  text: string;
}

export function AboutSection({ text }: AboutSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top 85%",
        once: true
      }
    });

    tl.fromTo(sectionRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
    )
    .fromTo(".about-title",
      { opacity: 0, x: -20 },
      { opacity: 1, x: 0, duration: 0.6, ease: "power2.out" },
      "-=0.6"
    )
    .fromTo(".about-content",
      { opacity: 0 },
      { opacity: 1, duration: 0.8, ease: "power1.out" },
      "-=0.4"
    );
  }, { scope: sectionRef, dependencies: [] });

  return (
    <section ref={sectionRef} className="w-full gpu opacity-0">
      <div className="about-title flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-accent/10 text-accent">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-foreground">Tentang Saya</h2>
      </div>

      <div className="about-content p-4 rounded-2xl bg-card/50 border border-border">
        <p className="text-muted-foreground leading-relaxed text-sm">
          {text}
        </p>
      </div>
    </section>
  );
}
