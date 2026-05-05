"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface ExperienceItem {
  title: string;
  company: string;
  period: string;
  points: string[];
}

interface ExperienceSectionProps {
  title: string;
  icon: React.ReactNode;
  items: ExperienceItem[];
}

export function ExperienceSection({ title, icon, items }: ExperienceSectionProps) {
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
      { opacity: 0 },
      { opacity: 1, duration: 0.1 }
    )
    .fromTo(".section-title-container", 
      { opacity: 0, y: 15, filter: "blur(4px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.6, ease: "power3.out" }
    )
    .fromTo(".experience-item", 
      { opacity: 0, y: 20, filter: "blur(4px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.8, stagger: 0.15, ease: "power3.out" }, 
      "-=0.3"
    );
  }, { scope: sectionRef, dependencies: [] });

  return (
    <section ref={sectionRef} className="w-full gpu opacity-0">
      <div className="section-title-container flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-accent/10 text-accent">
          {icon}
        </div>
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
      </div>

      <div className="space-y-4">
        {items.map((item, index) => (
          <div
            key={index}
            className="experience-item relative pl-6 border-l-2 border-accent/30 hover:border-accent transition-colors duration-300"
          >
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-accent/20 border-2 border-accent" />
            
            <div className="pb-6">
              <h3 className="font-semibold text-foreground text-lg">{item.title}</h3>
              <p className="text-accent font-medium text-sm">{item.company}</p>
              <p className="text-muted-foreground text-xs mb-3">{item.period}</p>
              
              <ul className="space-y-2">
                {item.points.map((point, pIndex) => (
                  <li 
                    key={pIndex}
                    className="text-sm text-muted-foreground flex items-center gap-2"
                  >
                    <span className="text-accent flex-shrink-0">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
