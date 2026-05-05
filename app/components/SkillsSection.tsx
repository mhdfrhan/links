"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface Skill {
  name: string;
  icon?: string;
}

interface SkillCategory {
  title: string;
  skills: Skill[];
}

interface SkillsSectionProps {
  categories: SkillCategory[];
}

export function SkillsSection({ categories }: SkillsSectionProps) {
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
    .fromTo(".skills-title-container", 
      { opacity: 0, y: 15, filter: "blur(4px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.6, ease: "power3.out" }
    )
    .fromTo(".skill-category", 
      { opacity: 0, y: 15, filter: "blur(4px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.6, stagger: 0.1, ease: "power3.out" }, 
      "-=0.3"
    );
  }, { scope: sectionRef, dependencies: [] });

  const onSkillEnter = (e: React.MouseEvent<HTMLSpanElement>) => {
    gsap.to(e.currentTarget, { scale: 1.05, y: -2, duration: 0.3, ease: "power2.out" });
  };

  const onSkillLeave = (e: React.MouseEvent<HTMLSpanElement>) => {
    gsap.to(e.currentTarget, { scale: 1, y: 0, duration: 0.3, ease: "power2.out" });
  };

  const onSkillDown = (e: React.MouseEvent<HTMLSpanElement>) => {
    gsap.to(e.currentTarget, { scale: 0.95, duration: 0.1 });
  };

  return (
    <section ref={sectionRef} className="w-full gpu opacity-0">
      <div className="skills-title-container flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-accent/10 text-accent">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-foreground">Kemampuan</h2>
      </div>

      <div className="space-y-6">
        {categories.map((category, catIndex) => (
          <div key={catIndex} className="skill-category">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
              {category.title}
            </h3>
            <div className="flex flex-wrap gap-2">
              {category.skills.map((skill, skillIndex) => (
                <span
                  key={skillIndex}
                  className="px-3 py-1.5 text-sm font-medium rounded-full bg-card border border-border text-foreground hover:border-accent transition-colors duration-300 cursor-default inline-block"
                  onMouseEnter={onSkillEnter}
                  onMouseLeave={onSkillLeave}
                  onMouseDown={onSkillDown}
                  onMouseUp={onSkillEnter}
                >
                  {skill.icon && <span className="mr-1">{skill.icon}</span>}
                  {skill.name}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
