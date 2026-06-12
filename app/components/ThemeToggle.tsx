"use client";

import { useTheme } from "next-themes";
import { useEffect, useState, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
} from "@heroicons/react/24/outline";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Animasi menu buka/tutup
  useGSAP(
    () => {
      if (!mounted || !menuRef.current) return;

      if (isOpen) {
        gsap.fromTo(
          menuRef.current,
          { opacity: 0, y: -10, scale: 0.95, pointerEvents: "none" },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            pointerEvents: "auto",
            duration: 0.2,
            ease: "power2.out",
          },
        );
      } else {
        gsap.to(menuRef.current, {
          opacity: 0,
          y: -10,
          scale: 0.95,
          pointerEvents: "none",
          duration: 0.15,
          ease: "power2.in",
        });
      }
    },
    { dependencies: [isOpen, mounted], revertOnUpdate: true },
  );

  const handleSelect = (newTheme: string) => {
    // Tambah class transition ke html — semua warna CSS variable smooth
    document.documentElement.classList.add("theme-transitioning");

    setTheme(newTheme);
    setIsOpen(false);

    // Hapus class setelah transisi selesai
    setTimeout(() => {
      document.documentElement.classList.remove("theme-transitioning");
    }, 450);
  };

  const onEnter = () => {
    if (!isOpen)
      gsap.to(buttonRef.current, {
        scale: 1.05,
        duration: 0.3,
        ease: "power2.out",
      });
  };

  const onLeave = () => {
    gsap.to(buttonRef.current, { scale: 1, duration: 0.3, ease: "power2.out" });
  };

  if (!mounted) {
    return <div className="h-10 w-10  bg-muted animate-pulse" />;
  }

  // Tentukan icon utama berdasarkan resolvedTheme (system akan resolve ke light/dark)
  const isDark = resolvedTheme === "dark";

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Tombol Utama */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        className={`relative h-8 w-8  border flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background shadow-sm overflow-hidden ${
          isOpen
            ? "bg-accent/10 border-accent/20"
            : "bg-card border-border hover:bg-muted"
        }`}
        aria-label="Toggle theme"
      >
        {isDark ? (
          <MoonIcon className="w-[18px] h-[18px] text-accent" />
        ) : (
          <SunIcon className="w-[18px] h-[18px] text-accent" />
        )}
      </button>

      {/* Dropdown Menu */}
      <div
        ref={menuRef}
        className="absolute right-0 mt-2 w-36 bg-card border border-border  shadow-xl p-1 z-50 opacity-0"
        style={{ pointerEvents: "none" }}
      >
        <button
          onClick={() => handleSelect("light")}
          className={`flex items-center gap-2 w-full px-3 py-2 text-sm  transition-colors ${
            theme === "light"
              ? "bg-accent/10 text-accent font-medium"
              : "text-foreground hover:bg-muted"
          }`}
        >
          <SunIcon className="w-4 h-4" />
          Light
        </button>
        <button
          onClick={() => handleSelect("dark")}
          className={`flex items-center gap-2 w-full px-3 py-2 text-sm  transition-colors ${
            theme === "dark"
              ? "bg-accent/10 text-accent font-medium"
              : "text-foreground hover:bg-muted"
          }`}
        >
          <MoonIcon className="w-4 h-4" />
          Dark
        </button>
        <button
          onClick={() => handleSelect("system")}
          className={`flex items-center gap-2 w-full px-3 py-2 text-sm  transition-colors ${
            theme === "system"
              ? "bg-accent/10 text-accent font-medium"
              : "text-foreground hover:bg-muted"
          }`}
        >
          <ComputerDesktopIcon className="w-4 h-4" />
          System
        </button>
      </div>
    </div>
  );
}
