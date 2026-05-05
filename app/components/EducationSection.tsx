"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface Education {
  institution: string;
  period: string;
  degree: string;
  note?: string;
}

interface EducationSectionProps {
  items: Education[];
}

export function EducationSection({ items }: EducationSectionProps) {
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
    .fromTo(".education-title-container", 
      { opacity: 0, y: 15, filter: "blur(4px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.6, ease: "power3.out" }
    )
    .fromTo(".education-item", 
      { opacity: 0, y: 20, filter: "blur(4px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.8, stagger: 0.1, ease: "power3.out" }, 
      "-=0.3"
    );
  }, { scope: sectionRef, dependencies: [] });

  return (
    <section ref={sectionRef} className="w-full gpu opacity-0">
      <div className="education-title-container flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-accent/10 text-accent">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-foreground">Pendidikan</h2>
      </div>

      <div className="space-y-4">
        {items.map((item, index) => (
          <div
            key={index}
            className="education-item p-4 rounded-2xl bg-card border border-border hover:border-accent/50 transition-all duration-300 hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-foreground">{item.institution}</h3>
                <p className="text-accent font-medium text-sm">{item.degree}</p>
                {item.note && (
                  <p className="text-xs text-muted-foreground mt-2 p-2 rounded-lg bg-accent/5 border border-accent/20">
                    🎓 {item.note}
                  </p>
                )}
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap bg-muted px-2 py-1 rounded-full">
                {item.period}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
