"use client";

import { motion } from "framer-motion";
import Image from "next/image";

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
  return (
    <motion.div
      className="flex flex-col items-center gap-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Avatar */}
      <motion.div
        className="relative"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
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
        <motion.div
          className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-background"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.6, type: "spring", stiffness: 500 }}
        />
      </motion.div>

      {/* Name */}
      <motion.h1
        className="text-2xl md:text-3xl font-bold text-foreground tracking-tight"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {name}
      </motion.h1>

      {/* Tagline */}
      <motion.p
        className="text-muted-foreground text-center max-w-xs text-sm md:text-base"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        {tagline}
      </motion.p>
    </motion.div>
  );
}
