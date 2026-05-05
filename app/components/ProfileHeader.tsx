"use client";

import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

interface ProfileHeaderProps {
  name: string;
  tagline: string;
  avatarUrl?: string;
}

export function ProfileHeader({
  name,
  tagline,
  avatarUrl = "/profile.jpg",
}: ProfileHeaderProps) {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const tl = gsap.timeline({
      defaults: { ease: "power3.out", duration: 1 }
    });

    tl.fromTo(container.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.1 }
    )
    .fromTo(".avatar-container", 
      { scale: 0.9, opacity: 0 },
      { scale: 1, opacity: 1, delay: 0.1 }
    )
    .fromTo(".profile-name", 
      { y: 15, opacity: 0 },
      { y: 0, opacity: 1 }, 
      "-=0.7"
    )
    .fromTo(".profile-tagline", 
      { y: 15, opacity: 0 },
      { y: 0, opacity: 1 }, 
      "-=0.8"
    )
    .fromTo(".online-indicator", 
      { scale: 0 },
      { scale: 1, ease: "back.out(1.7)", duration: 0.6 }, 
      "-=0.5"
    );
  }, { scope: container, dependencies: [] });

  return (
    <div ref={container} className="flex flex-col items-center gap-4 gpu opacity-0">
      {/* Avatar */}
      <div className="avatar-container relative gpu">
        <div className="relative h-28 w-28 rounded-full overflow-hidden ring-4 ring-accent/30 ring-offset-4 ring-offset-background">
          <Image
            src={avatarUrl}
            alt={`${name}'s profile picture`}
            fill
            sizes="112px"
            className="object-cover"
            priority
          />
        </div>
        {/* Online indicator */}
        <div className="online-indicator absolute bottom-1 right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-background" />
      </div>

      {/* Name */}
      <h1 className="profile-name text-2xl md:text-3xl font-bold text-foreground tracking-tight gpu">
        {name}
      </h1>

      {/* Tagline */}
      <p className="profile-tagline text-muted-foreground text-center max-w-xs text-sm md:text-base gpu">
        {tagline}
      </p>
    </div>
  );
}
