"use client";

import { useRef, ReactNode } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

interface LinkCardProps {
  href: string;
  icon: ReactNode;
  label: string;
  description?: string;
  delay?: number;
}

export function LinkCard({
  href,
  icon,
  label,
  description,
  delay = 0,
}: LinkCardProps) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.fromTo(cardRef.current,
      { opacity: 0, y: 15 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        delay: 0.2 + delay,
        ease: "power3.out"
      }
    );
  }, { scope: cardRef, dependencies: [] });

  const onMouseEnter = () => {
    gsap.to(innerRef.current, { scale: 1.02, y: -2, duration: 0.3, ease: "power2.out" });
    gsap.to(glowRef.current, { opacity: 1, duration: 0.3 });
    gsap.to(arrowRef.current, { x: 4, duration: 0.3 });
  };

  const onMouseLeave = () => {
    gsap.to(innerRef.current, { scale: 1, y: 0, duration: 0.3, ease: "power2.out" });
    gsap.to(glowRef.current, { opacity: 0, duration: 0.3 });
    gsap.to(arrowRef.current, { x: 0, duration: 0.3 });
  };

  const onMouseDown = () => {
    gsap.to(innerRef.current, { scale: 0.98, duration: 0.1 });
  };

  const onMouseUp = () => {
    gsap.to(innerRef.current, { scale: 1.02, duration: 0.2 });
  };

  return (
    <a
      ref={cardRef}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative w-full gpu opacity-0"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
    >
      <div
        ref={innerRef}
        className="relative flex items-center gap-4 p-4  bg-card border border-border overflow-hidden"
      >
        {/* Hover glow effect */}
        <div
          ref={glowRef}
          className="absolute inset-0 bg-gradient-to-r from-accent/10 via-accent/5 to-transparent opacity-0 transition-opacity duration-300"
        />

        {/* Icon */}
        <div className="relative flex-shrink-0 h-12 w-12  bg-muted flex items-center justify-center text-accent group-hover:bg-accent/10 transition-colors duration-300">
          {icon}
        </div>

        {/* Content */}
        <div className="relative flex-1 min-w-0">
          <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors duration-300">
            {label}
          </h3>
          {description && (
            <p className="text-sm text-muted-foreground truncate">
              {description}
            </p>
          )}
        </div>

        {/* Arrow */}
        <div
          ref={arrowRef}
          className="relative flex-shrink-0 text-muted-foreground group-hover:text-accent transition-colors duration-300"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m8.25 4.5 7.5 7.5-7.5 7.5"
            />
          </svg>
        </div>
      </div>
    </a>
  );
}
