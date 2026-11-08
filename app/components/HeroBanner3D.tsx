"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

interface HeroBanner3DProps {
  avatarUrl: string;
  name: string;
}

/**
 * HeroBanner3D — Award-Winning Cinematic 3D Viewport Banner
 * Inspired by Awwwards Site of the Day, Framer, and 21st.dev.
 *
 * Features:
 * 1. Buttery-smooth 120fps physics-lerped 3D mouse tilt with dynamic spring physics.
 * 2. Real-time cursor spotlight sheen & glass specular reflection.
 * 3. Multi-layer stereoscopic depth (Background photo at Z: -30px, HUD floating at Z: +45px).
 * 4. GSAP ScrollTrigger deep parallax scrub & smooth viewport scaling.
 * 5. Architectural HUD overlays: Coordinates, 21:9 Cinemascope badge, live tilt readout, corner crosshairs.
 * 6. Touch-safe fallback for mobile devices.
 */
export function HeroBanner3D({ avatarUrl, name }: HeroBanner3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const imageLayerRef = useRef<HTMLDivElement>(null);
  const hudLayerRef = useRef<HTMLDivElement>(null);

  // Real-time tilt coordinates (degrees) for readout display
  const [tiltDisplay, setTiltDisplay] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [spotlight, setSpotlight] = useState({ x: 50, y: 50, opacity: 0 });

  // Physics animation loop refs (to avoid React re-render lag)
  const animState = useRef({
    currentRotateX: 0,
    currentRotateY: 0,
    targetRotateX: 0,
    targetRotateY: 0,
    currentScale: 1,
    targetScale: 1,
    rafId: 0,
    isHovered: false,
    canHover: true,
  });

  // Check hover capability on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      animState.current.canHover = window.matchMedia("(hover: hover)").matches;
    }
  }, []);

  // Smooth RAF lerp physics loop
  const updatePhysics = useCallback(() => {
    const s = animState.current;
    const lerpFactor = 0.085; // Silky smooth response

    s.currentRotateX += (s.targetRotateX - s.currentRotateX) * lerpFactor;
    s.currentRotateY += (s.targetRotateY - s.currentRotateY) * lerpFactor;
    s.currentScale += (s.targetScale - s.currentScale) * lerpFactor;

    if (cardRef.current) {
      cardRef.current.style.transform = `perspective(1200px) rotateX(${s.currentRotateX.toFixed(
        3
      )}deg) rotateY(${s.currentRotateY.toFixed(
        3
      )}deg) scale3d(${s.currentScale.toFixed(4)}, ${s.currentScale.toFixed(
        4
      )}, ${s.currentScale.toFixed(4)})`;
    }

    // Stop RAF if reached resting state when not hovered
    const diff =
      Math.abs(s.targetRotateX - s.currentRotateX) +
      Math.abs(s.targetRotateY - s.currentRotateY) +
      Math.abs(s.targetScale - s.currentScale);

    if (diff > 0.005 || s.isHovered) {
      s.rafId = requestAnimationFrame(updatePhysics);
    } else {
      s.rafId = 0;
      if (cardRef.current) {
        cardRef.current.style.transform = `perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
      }
    }
  }, []);

  const startAnimationLoop = useCallback(() => {
    if (!animState.current.rafId) {
      animState.current.rafId = requestAnimationFrame(updatePhysics);
    }
  }, [updatePhysics]);

  // Mouse Move Handler: 3D Tilt calculation & dynamic cursor spotlight
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!animState.current.canHover || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      // Normalized coordinates from center: -0.5 to +0.5
      const normX = clientX / rect.width - 0.5;
      const normY = clientY / rect.height - 0.5;

      // Max tilt: +/- 6.5 degrees
      const maxTilt = 6.5;
      animState.current.targetRotateX = -normY * maxTilt;
      animState.current.targetRotateY = normX * maxTilt;
      animState.current.targetScale = 1.015;

      // Update spotlight position
      const spotX = (clientX / rect.width) * 100;
      const spotY = (clientY / rect.height) * 100;
      setSpotlight({ x: spotX, y: spotY, opacity: 1 });

      setTiltDisplay({
        x: Number((-normY * maxTilt).toFixed(1)),
        y: Number((normX * maxTilt).toFixed(1)),
      });

      startAnimationLoop();
    },
    [startAnimationLoop]
  );

  const handleMouseEnter = useCallback(() => {
    if (!animState.current.canHover) return;
    animState.current.isHovered = true;
    setIsHovered(true);
    startAnimationLoop();
  }, [startAnimationLoop]);

  const handleMouseLeave = useCallback(() => {
    animState.current.isHovered = false;
    animState.current.targetRotateX = 0;
    animState.current.targetRotateY = 0;
    animState.current.targetScale = 1;
    setIsHovered(false);
    setSpotlight((prev) => ({ ...prev, opacity: 0 }));
    setTiltDisplay({ x: 0, y: 0 });
    startAnimationLoop();
  }, [startAnimationLoop]);

  // Clean up RAF on unmount
  useEffect(() => {
    return () => {
      if (animState.current.rafId) {
        cancelAnimationFrame(animState.current.rafId);
      }
    };
  }, []);

  // GSAP ScrollTrigger Parallax (Stereoscopic Image & HUD differential scroll scrub)
  useGSAP(
    () => {
      if (!containerRef.current) return;

      // Deep parallax scrub on the background image
      if (imageLayerRef.current) {
        gsap.fromTo(
          imageLayerRef.current,
          { yPercent: -14, scale: 1.15 },
          {
            yPercent: 14,
            scale: 1.03,
            ease: "none",
            scrollTrigger: {
              trigger: containerRef.current,
              start: "top bottom",
              end: "bottom top",
              scrub: 1,
            },
          }
        );
      }

      // Counter-depth parallax on floating HUD layer for true stereoscopic separation
      if (hudLayerRef.current) {
        gsap.fromTo(
          hudLayerRef.current,
          { yPercent: 6 },
          {
            yPercent: -6,
            ease: "none",
            scrollTrigger: {
              trigger: containerRef.current,
              start: "top bottom",
              end: "bottom top",
              scrub: 1,
            },
          }
        );
      }
    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="hero-image relative w-screen left-1/2 -translate-x-1/2 mb-12 px-3 sm:px-6 md:px-10 max-w-[1380px] mx-auto select-none"
      style={{
        perspective: "1200px",
      }}
    >
      {/* 3D Card Container */}
      <div
        ref={cardRef}
        className="relative w-full rounded-2xl md:rounded-3xl overflow-hidden will-change-transform transition-shadow duration-500 cursor-grab active:cursor-grabbing border"
        style={{
          aspectRatio: "21/9",
          minHeight: "260px",
          background: "var(--bg-tertiary)",
          borderColor: "color-mix(in srgb, var(--border) 60%, transparent)",
          transformStyle: "preserve-3d",
          boxShadow: isHovered
            ? "0 30px 60px -15px rgba(0, 0, 0, 0.45), 0 0 40px -10px color-mix(in srgb, var(--accent) 20%, transparent)"
            : "0 20px 40px -15px rgba(0, 0, 0, 0.35)",
        }}
      >
        {/* ================= LAYER 0: DEEP BACKGROUND IMAGE (Z: -30px) ================= */}
        <div
          ref={imageLayerRef}
          className="absolute inset-x-0 -top-[16%] h-[132%] will-change-transform"
          style={{
            transform: "translateZ(-30px) scale(1.12)",
            transformStyle: "preserve-3d",
          }}
        >
          <Image
            src={avatarUrl}
            alt={`Photo of ${name}`}
            fill
            sizes="(max-width: 768px) 100vw, 1380px"
            className="object-cover"
            priority
          />
        </div>

        {/* ================= LAYER 1: CINEMATIC LIGHTING & SPECULAR SHEEN ================= */}
        {/* Top Dark Vignette */}
        <div
          className="absolute inset-x-0 top-0 h-32 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, rgba(9, 9, 11, 0.65) 0%, rgba(9, 9, 11, 0.2) 60%, transparent 100%)",
            transform: "translateZ(0px)",
          }}
        />

        {/* Bottom Dark Vignette */}
        <div
          className="absolute inset-x-0 bottom-0 h-36 pointer-events-none"
          style={{
            background:
              "linear-gradient(to top, rgba(9, 9, 11, 0.75) 0%, rgba(9, 9, 11, 0.25) 60%, transparent 100%)",
            transform: "translateZ(0px)",
          }}
        />

        {/* Cursor-Following Specular Spotlight (Refraction Sheen) */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            opacity: spotlight.opacity,
            background: `radial-gradient(circle 450px at ${spotlight.x}% ${spotlight.y}%, rgba(255, 255, 255, 0.18), transparent 70%)`,
            mixBlendMode: "overlay",
            transform: "translateZ(10px)",
          }}
        />

        {/* Subtle Architectural Grid Lines Overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            transform: "translateZ(5px)",
          }}
        />

        {/* ================= LAYER 2: FLOATING ARCHITECTURAL HUD (Z: +45px) ================= */}
        <div
          ref={hudLayerRef}
          className="absolute inset-0 pointer-events-none p-4 sm:p-6 md:p-8 flex flex-col justify-between"
          style={{
            transform: "translateZ(45px)",
            transformStyle: "preserve-3d",
          }}
        >
          {/* Top HUD Row */}
          <div className="flex items-center justify-between gap-3">
            {/* Location & GPS Glass Pill */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-md shadow-sm transition-transform duration-300"
              style={{
                background: "color-mix(in srgb, var(--bg-primary) 65%, transparent)",
                borderColor: "rgba(255, 255, 255, 0.12)",
                color: "var(--text-primary)",
              }}
            >
              <span className="relative flex h-2 w-2">
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ backgroundColor: "var(--accent)" }}
                />
                <span
                  className="relative inline-flex rounded-full h-2 w-2"
                  style={{ backgroundColor: "var(--accent)" }}
                />
              </span>
              <span
                className="text-[10px] sm:text-xs font-semibold tracking-wider uppercase"
                style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}
              >
                PEKANBARU, ID <span className="opacity-40 font-normal hidden sm:inline">// 0.5071° N, 101.4478° E</span>
              </span>
            </div>

            {/* Viewport Frame Specification Pill */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-md shadow-sm"
              style={{
                background: "color-mix(in srgb, var(--bg-primary) 65%, transparent)",
                borderColor: "rgba(255, 255, 255, 0.12)",
                color: "var(--text-secondary)",
              }}
            >
              <span
                className="text-[10px] sm:text-xs font-mono tracking-wider font-semibold"
                style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}
              >
                <span className="text-[var(--accent)] font-bold">21:9</span> CINEMATIC
              </span>
            </div>
          </div>

          {/* Bottom HUD Row */}
          <div className="flex items-end justify-between gap-3">
            {/* Interactive Status Pill */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-md shadow-sm"
              style={{
                background: "color-mix(in srgb, var(--bg-primary) 65%, transparent)",
                borderColor: "rgba(255, 255, 255, 0.12)",
                color: "var(--text-primary)",
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--green)]" />
              <span
                className="text-[10px] sm:text-xs font-semibold tracking-wider uppercase"
                style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}
              >
                PORTFOLIO ARCHIVE <span className="opacity-40 font-normal hidden sm:inline">// 2026 EDITION</span>
              </span>
            </div>

            {/* Real-time 3D Perspective Matrix Indicator */}
            <div
              className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-md shadow-sm"
              style={{
                background: "color-mix(in srgb, var(--bg-primary) 65%, transparent)",
                borderColor: "rgba(255, 255, 255, 0.12)",
                color: "var(--text-secondary)",
              }}
            >
              <span
                className="text-[10px] font-mono tracking-wider font-medium"
                style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}
              >
                {isHovered ? (
                  <>
                    <span className="text-[var(--accent)] font-semibold">TILT</span> X:{tiltDisplay.x}° Y:{tiltDisplay.y}°
                  </>
                ) : (
                  <span>[ 3D PERSPECTIVE // HOVER ]</span>
                )}
              </span>
            </div>
          </div>

          {/* 4 Corner Architectural Crosshairs (+) */}
          {/* Top-Left */}
          <div className="absolute top-3 left-3 text-[11px] font-mono text-white/30 select-none">
            +
          </div>
          {/* Top-Right */}
          <div className="absolute top-3 right-3 text-[11px] font-mono text-white/30 select-none">
            +
          </div>
          {/* Bottom-Left */}
          <div className="absolute bottom-3 left-3 text-[11px] font-mono text-white/30 select-none">
            +
          </div>
          {/* Bottom-Right */}
          <div className="absolute bottom-3 right-3 text-[11px] font-mono text-white/30 select-none">
            +
          </div>
        </div>

        {/* Outer Hairline Border Reflection */}
        <div
          className="absolute inset-0 rounded-2xl md:rounded-3xl pointer-events-none"
          style={{
            boxShadow: "inset 0 0 0 1px rgba(255, 255, 255, 0.08)",
            transform: "translateZ(1px)",
          }}
        />
      </div>
    </div>
  );
}
