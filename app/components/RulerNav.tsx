"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  MotionValue,
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
  useVelocity,
} from "framer-motion";
import { smoothScrollTo } from "@/lib/utils/smoothScroll";

export interface RulerSection {
  id: string;
  href: string;
  label: string;
  code: string;
}

interface RulerNavProps {
  sections: RulerSection[];
  onScrubSectionChange?: (section: RulerSection) => void;
}

interface SectionStop {
  id: string;
  top: number;
  activateTop: number;
}

const DESKTOP_MINOR_STEP = 10; // 10 intervals between each major section -> 41 crisp ticks total
const DESKTOP_TICKS = 41;
const MENU_ITEM_STEP_PX = 35;

const MOBILE_SUBDIVISIONS = 10;
const MOBILE_TICK_PITCH = 10;

interface DesktopRulerTickProps {
  tickRatio: number;
  isMajor: boolean;
  isHalf: boolean;
  isActiveMajor: boolean;
  focusRatio: MotionValue<number>;
}

/**
 * Single desktop ruler tick animated strictly via GPU `scaleX`, `opacity`, and
 * an ember-to-accent (`#ed5d31`) color bloom around the active needle / cursor.
 */
function DesktopRulerTick({
  tickRatio,
  isMajor,
  isHalf,
  isActiveMajor,
  focusRatio,
}: DesktopRulerTickProps) {
  const maxWidth = isMajor ? 40 : isHalf ? 26 : 16;
  const minScale = isMajor ? 0.62 : isHalf ? 0.54 : 0.48;

  const wave = useTransform(focusRatio, (focus) => {
    const dist = Math.abs(tickRatio - focus);
    return Math.max(0, 1 - dist / 0.13);
  });

  const scaleX = useTransform(wave, (w) => minScale + w * (1 - minScale));
  const opacity = useTransform(wave, (w) =>
    isMajor ? 0.92 : (isHalf ? 0.65 : 0.45) + w * 0.35,
  );

  // Harmonized with theme tokens (--border-hover / --text-muted) blending smoothly into --accent near focus
  const accentMix = useTransform(wave, (w) => {
    if (isActiveMajor) return 100;
    return Math.round(w * 72);
  });
  const baseToken = isMajor ? "var(--text-muted)" : "var(--border-hover)";
  const tickColor = useMotionTemplate`color-mix(in srgb, var(--accent) ${accentMix}%, ${baseToken})`;

  return (
    <div className="relative z-10 w-full flex items-center justify-end">
      <motion.span
        className="block origin-right will-change-transform"
        style={{
          width: `${maxWidth}px`,
          height: isMajor ? "3px" : isHalf ? "2px" : "1.5px",
          scaleX,
          opacity,
          backgroundColor: tickColor,
        }}
      />
    </div>
  );
}

interface MobileDialTickProps {
  index: number;
  isMajor: boolean;
  isHalf: boolean;
  section?: RulerSection;
  tapeY: MotionValue<number>;
}

/**
 * Mobile rolling zoom tick with optical cylindrical arc falloff (`scaleX` + `opacity`)
 * relative to the center reticle, reproducing an iPhone camera zoom wheel with zero box.
 */
function MobileDialTick({
  index,
  isMajor,
  isHalf,
  section,
  tapeY,
}: MobileDialTickProps) {
  const baseTop = index * MOBILE_TICK_PITCH;

  const arcScale = useTransform(tapeY, (y) => {
    const distFromCenter = Math.abs(baseTop + y);
    const falloff = Math.min(1, distFromCenter / 96);
    return 1 - falloff * 0.42;
  });

  const arcOpacity = useTransform(tapeY, (y) => {
    const distFromCenter = Math.abs(baseTop + y);
    const falloff = Math.min(1, distFromCenter / 104);
    return Math.max(0.22, 1 - falloff * 0.72);
  });

  return (
    <motion.div
      className="absolute inset-x-0 flex items-center justify-end origin-right will-change-transform"
      style={{
        top: `${baseTop}px`,
        y: "-50%",
        scaleX: arcScale,
        opacity: arcOpacity,
      }}
    >
      {isMajor && section ? (
        <div className="flex items-center gap-1.5">
          <span
            className="text-[10px] font-bold tabular-nums"
            style={{
              color: "var(--text-primary)",
              textShadow: "0 1px 6px var(--bg-primary)",
            }}
          >
            {section.code}
          </span>
          <span
            className="block w-7 h-[3px]"
            style={{
              background: "var(--text-muted)",
              opacity: 0.9,
            }}
          />
        </div>
      ) : (
        <span
          className="block"
          style={{
            width: isHalf ? "19px" : "12px",
            height: isHalf ? "2px" : "1.5px",
            background: isHalf ? "var(--text-muted)" : "var(--border-hover)",
            opacity: isHalf ? 0.72 : 0.65,
          }}
        />
      )}
    </motion.div>
  );
}

/**
 * RulerNav — Precision Architectural Edge Ruler & Transparent Mobile Camera Zoom Dial
 *
 * Desktop (`md+`): Spans flush along the viewport right edge beneath the header (`56px -> bottom`),
 * combining cascade-inertia top/bottom split navigation, ember-gradient hover wave ticks,
 * scroll-velocity reactive caliper needle, live drag telemetry, and smooth click-to-glide.
 *
 * Mobile (`< md`): Completely background-free lower-right cylindrical zoom wheel with
 * optical arc scaling, one-thumb scrubbing, haptic boundary pulses, and minimal quick menu.
 */
export function RulerNav({ sections, onScrubSectionChange }: RulerNavProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isDesktopHovered, setIsDesktopHovered] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [showMobileHud, setShowMobileHud] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [menuColumnHeight, setMenuColumnHeight] = useState(520);

  const stopsRef = useRef<SectionStop[]>([]);
  const maxScrollRef = useRef<number>(1);
  const lastActiveRef = useRef<number>(0);
  const pointerRatioRef = useRef<number | null>(null);
  const hudTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const menuColumnRef = useRef<HTMLDivElement>(null);
  const desktopTrackRef = useRef<HTMLDivElement>(null);
  const mobileDialRef = useRef<HTMLDivElement>(null);
  const mobileContainerRef = useRef<HTMLDivElement>(null);
  const percentTextRef = useRef<HTMLSpanElement>(null);

  const rawProgress = useMotionValue(0);
  const smoothProgress = useSpring(rawProgress, {
    stiffness: 320,
    damping: 32,
    mass: 0.45,
  });

  // Scroll-velocity reactive elongation for the orange caliper needle
  const progressVelocity = useVelocity(smoothProgress);
  const needleScaleY = useTransform(progressVelocity, (v) => {
    const stretch = Math.min(2.2, Math.abs(v) * 1.4);
    return 1 + stretch;
  });

  // Shared wave focus ratio follows pointer hover when hovering, otherwise scroll progress
  const rawFocus = useMotionValue(0);
  const smoothFocus = useSpring(rawFocus, {
    stiffness: 360,
    damping: 34,
    mass: 0.35,
  });

  const totalMobileTicks = Math.max(
    1,
    (sections.length - 1) * MOBILE_SUBDIVISIONS + 1,
  );
  const mobileTapeTravel = (totalMobileTicks - 1) * MOBILE_TICK_PITCH;
  const mobileTapeY = useTransform(
    smoothProgress,
    [0, 1],
    [0, -mobileTapeTravel],
  );
  const desktopNeedleTop = useTransform(
    smoothProgress,
    [0, 1],
    ["0%", "100%"],
  );

  // Measure DOM section anchor positions and viewport-reading activation thresholds
  const measureSections = useCallback(() => {
    const vh = window.innerHeight;
    const docMax = Math.max(1, document.documentElement.scrollHeight - vh);
    maxScrollRef.current = docMax;
    const readingOffset = Math.min(240, vh * 0.28);

    const measured: SectionStop[] = sections.map((sec, idx) => {
      if (idx === 0) {
        return { id: sec.id, top: 0, activateTop: 0 };
      }
      const el = document.getElementById(sec.id);
      if (!el) {
        const fallbackTop = (idx / Math.max(1, sections.length - 1)) * docMax;
        return {
          id: sec.id,
          top: fallbackTop,
          activateTop: Math.max(0, fallbackTop - readingOffset),
        };
      }
      const absTop = el.getBoundingClientRect().top + window.scrollY;
      const rawTop = Math.max(0, absTop - 88);
      const activateTop = Math.max(0, absTop - readingOffset);
      return {
        id: sec.id,
        top: Math.min(docMax, rawTop),
        activateTop: Math.min(docMax, activateTop),
      };
    });

    for (let i = 1; i < measured.length; i++) {
      if (measured[i].top < measured[i - 1].top + 24) {
        measured[i].top = Math.min(docMax, measured[i - 1].top + 24);
      }
      if (measured[i].activateTop < measured[i - 1].activateTop + 24) {
        measured[i].activateTop = Math.min(
          docMax,
          measured[i - 1].activateTop + 24,
        );
      }
    }
    if (measured.length > 1) {
      const last = measured[measured.length - 1];
      if (docMax - last.top < vh * 0.45) {
        last.top = docMax;
      }
    }

    stopsRef.current = measured;
  }, [sections]);

  const computeProgressFromScroll = useCallback(
    (scrollY: number): { progress: number; activeIdx: number } => {
      const stops = stopsRef.current;
      const count = stops.length;
      if (count <= 1) return { progress: 0, activeIdx: 0 };

      // Determine active section purely by actual section top entering upper reading zone
      let activeIdx = 0;
      if (scrollY >= maxScrollRef.current - 20) {
        activeIdx = count - 1;
      } else {
        for (let i = count - 1; i >= 0; i--) {
          if (scrollY >= stops[i].activateTop) {
            activeIdx = i;
            break;
          }
        }
      }

      if (scrollY <= stops[0].top) return { progress: 0, activeIdx };
      if (scrollY >= stops[count - 1].top) {
        return { progress: 1, activeIdx };
      }

      let progress = 0;
      for (let i = 0; i < count - 1; i++) {
        const start = stops[i].top;
        const end = stops[i + 1].top;
        if (scrollY >= start && scrollY <= end) {
          const span = Math.max(1, end - start);
          const local = (scrollY - start) / span;
          progress = (i + local) / (count - 1);
          break;
        }
      }

      return { progress, activeIdx };
    },
    [],
  );

  const computeScrollFromProgress = useCallback((progress: number): number => {
    const clamped = Math.max(0, Math.min(1, progress));
    const stops = stopsRef.current;
    const count = stops.length;
    if (count <= 1) return clamped * maxScrollRef.current;

    const scaled = clamped * (count - 1);
    const segIdx = Math.min(count - 2, Math.floor(scaled));
    const local = scaled - segIdx;
    const start = stops[segIdx].top;
    const end = stops[segIdx + 1].top;
    return start + local * (end - start);
  }, []);

  const flashMobileHud = useCallback((duration = 1250) => {
    setShowMobileHud(true);
    if (hudTimeoutRef.current) clearTimeout(hudTimeoutRef.current);
    hudTimeoutRef.current = setTimeout(() => {
      setShowMobileHud(false);
    }, duration);
  }, []);

  useEffect(() => {
    measureSections();

    const updateAriaAndTelemetry = (pct: number) => {
      const val = String(Math.round(pct * 100));
      desktopTrackRef.current?.setAttribute("aria-valuenow", val);
      mobileDialRef.current?.setAttribute("aria-valuenow", val);
      if (percentTextRef.current) {
        percentTextRef.current.textContent = `${val.padStart(2, "0")}%`;
      }
    };

    let rafId: number | null = null;
    const syncFromWindow = () => {
      rafId = null;
      const y = window.scrollY;
      const { progress, activeIdx } = computeProgressFromScroll(y);
      rawProgress.set(progress);
      if (pointerRatioRef.current === null) {
        rawFocus.set(progress);
      }
      updateAriaAndTelemetry(progress);

      if (activeIdx !== lastActiveRef.current) {
        lastActiveRef.current = activeIdx;
        setActiveIndex(activeIdx);
        onScrubSectionChange?.(sections[activeIdx]);
      }
    };

    const handleScroll = () => {
      if (rafId === null) {
        rafId = window.requestAnimationFrame(syncFromWindow);
      }
      if (window.innerWidth < 768) {
        flashMobileHud(1200);
      }
    };

    const updateMenuHeight = () => {
      if (menuColumnRef.current) {
        const h = menuColumnRef.current.clientHeight;
        if (h > 0) setMenuColumnHeight(h);
      }
    };

    const handleResize = () => {
      measureSections();
      updateMenuHeight();
      syncFromWindow();
    };

    let lastHeight = document.documentElement.scrollHeight;
    const bodyObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            const nextH = document.documentElement.scrollHeight;
            if (Math.abs(nextH - lastHeight) > 8) {
              lastHeight = nextH;
              measureSections();
              syncFromWindow();
            }
          })
        : null;
    bodyObserver?.observe(document.body);

    const menuObserver =
      typeof ResizeObserver !== "undefined" && menuColumnRef.current
        ? new ResizeObserver(updateMenuHeight)
        : null;
    if (menuColumnRef.current) {
      menuObserver?.observe(menuColumnRef.current);
    }

    updateMenuHeight();
    syncFromWindow();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      if (hudTimeoutRef.current) clearTimeout(hudTimeoutRef.current);
      bodyObserver?.disconnect();
      menuObserver?.disconnect();
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [
    computeProgressFromScroll,
    flashMobileHud,
    measureSections,
    onScrubSectionChange,
    rawFocus,
    rawProgress,
    sections,
  ]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handleOutside = (e: PointerEvent) => {
      if (
        mobileContainerRef.current &&
        !mobileContainerRef.current.contains(e.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", handleOutside);
    return () => document.removeEventListener("pointerdown", handleOutside);
  }, [isMobileMenuOpen]);

  const scrollToProgress = useCallback(
    (progress: number, immediate: boolean, vibrateOnStep = false) => {
      const clamped = Math.max(0, Math.min(1, progress));
      const targetY = computeScrollFromProgress(clamped);

      if (immediate) {
        rawProgress.set(clamped);
        rawFocus.set(clamped);
        if (percentTextRef.current) {
          percentTextRef.current.textContent = `${String(
            Math.round(clamped * 100),
          ).padStart(2, "0")}%`;
        }
      }

      const newIdx = computeProgressFromScroll(targetY).activeIdx;
      if (newIdx !== lastActiveRef.current) {
        lastActiveRef.current = newIdx;
        setActiveIndex(newIdx);
        onScrubSectionChange?.(sections[newIdx]);
        if (
          vibrateOnStep &&
          typeof navigator !== "undefined" &&
          navigator.vibrate
        ) {
          navigator.vibrate(6);
        }
      }

      const lenis = (
        window as unknown as {
          __lenis?: {
            scrollTo: (
              t: number,
              o?: { immediate?: boolean; duration?: number },
            ) => void;
          };
        }
      ).__lenis;

      if (lenis) {
        lenis.scrollTo(
          targetY,
          immediate ? { immediate: true } : { duration: 1.0 },
        );
      } else {
        window.scrollTo({
          top: targetY,
          behavior: immediate ? "auto" : "smooth",
        });
      }
    },
    [
      computeProgressFromScroll,
      computeScrollFromProgress,
      onScrubSectionChange,
      rawFocus,
      rawProgress,
      sections,
    ],
  );

  const jumpToSection = useCallback(
    (section: RulerSection, idx: number) => {
      setIsMobileMenuOpen(false);
      setActiveIndex(idx);
      lastActiveRef.current = idx;
      if (idx === 0) {
        smoothScrollTo(0);
      } else if (idx === sections.length - 1) {
        smoothScrollTo(section.href, -40);
      } else {
        smoothScrollTo(section.href, -76);
      }
    },
    [sections.length],
  );

  // Desktop ruler interaction: drag (>= 4px) scrubs live; click (< 4px) glides smoothly via Lenis
  const handleDesktopTrackPointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (!desktopTrackRef.current) return;
    e.preventDefault();
    const el = desktopTrackRef.current;
    el.setPointerCapture(e.pointerId);
    measureSections();

    const startY = e.clientY;
    let moved = false;

    const getRatioAtY = (clientY: number) => {
      const rect = el.getBoundingClientRect();
      return Math.max(
        0,
        Math.min(1, (clientY - rect.top) / Math.max(1, rect.height)),
      );
    };

    const onMove = (ev: PointerEvent) => {
      if (!moved && Math.abs(ev.clientY - startY) >= 4) {
        moved = true;
        setIsScrubbing(true);
      }
      if (!moved) return;
      const ratio = getRatioAtY(ev.clientY);
      pointerRatioRef.current = ratio;
      scrollToProgress(ratio, true, false);
    };

    const onUp = (ev: PointerEvent) => {
      setIsScrubbing(false);
      if (!moved) {
        const ratio = getRatioAtY(ev.clientY);
        pointerRatioRef.current = ratio;
        rawFocus.set(ratio);
        scrollToProgress(ratio, false, false);
      } else {
        pointerRatioRef.current = null;
        rawFocus.set(rawProgress.get());
      }
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
  };

  // Mobile transparent one-thumb dial interaction
  const handleMobileDialPointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (!mobileDialRef.current) return;
    e.preventDefault();
    const el = mobileDialRef.current;
    el.setPointerCapture(e.pointerId);
    measureSections();

    const startY = e.clientY;
    const startProgress = rawProgress.get();
    let moved = false;

    setIsScrubbing(true);
    flashMobileHud(3500);

    const dragSensitivity = 175;

    const onMove = (ev: PointerEvent) => {
      const dy = startY - ev.clientY;
      if (Math.abs(dy) > 6) {
        moved = true;
        setIsMobileMenuOpen(false);
      }
      if (!moved) return;
      const nextProgress = Math.max(
        0,
        Math.min(1, startProgress + dy / dragSensitivity),
      );
      scrollToProgress(nextProgress, true, true);
      flashMobileHud(2200);
    };

    const onUp = () => {
      setIsScrubbing(false);
      if (!moved) {
        setIsMobileMenuOpen((prev) => !prev);
      } else {
        flashMobileHud(1100);
      }
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
  };

  const mobileTicks = useMemo(() => {
    return Array.from({ length: totalMobileTicks }, (_, i) => {
      const isMajor = i % MOBILE_SUBDIVISIONS === 0;
      const secIdx = Math.floor(i / MOBILE_SUBDIVISIONS);
      const isHalf =
        !isMajor && i % Math.ceil(MOBILE_SUBDIVISIONS / 2) === 0;
      return {
        index: i,
        isMajor,
        isHalf,
        section: isMajor ? sections[secIdx] : undefined,
      };
    });
  }, [sections, totalMobileTicks]);

  const activeSection = sections[activeIndex] ?? sections[0];
  const mdMenuVisible = isDesktopHovered || isScrubbing;

  return (
    <>
      {/* ============================================================
          DESKTOP / TABLET FULL-HEIGHT ARCHITECTURAL RULER (`md+`)
          Anchored flush to viewport right edge (`56px -> bottom`)
         ============================================================ */}
      <nav
        aria-label="Section ruler navigation"
        onMouseEnter={() => setIsDesktopHovered(true)}
        onMouseLeave={() => {
          setIsDesktopHovered(false);
          pointerRatioRef.current = null;
          rawFocus.set(rawProgress.get());
          setHoveredIndex(null);
        }}
        className="hidden md:block fixed top-[56px] bottom-[92px] right-0 z-40 select-none pointer-events-none"
        style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}
      >
        <div className="relative h-full py-6 lg:py-8 flex items-stretch justify-end">
          <div className="relative h-full flex items-stretch">
            {/* Permanently Mounted Split Menu: Cascade-Inertia Spring glides items smoothly Top <-> Bottom */}
            <div
              ref={menuColumnRef}
              className={`relative h-full w-[164px] mr-1.5 pointer-events-none transition-opacity duration-300 ease-out ${
                mdMenuVisible ? "opacity-100" : "opacity-0 lg:opacity-100"
              }`}
            >
              {sections.map((section, idx) => {
                const isActive = idx === activeIndex;
                const isPassed = idx < activeIndex;
                const isItemHovered = hoveredIndex === idx;
                const isTopStack = idx <= activeIndex;

                const topSlotY = idx * MENU_ITEM_STEP_PX;
                const bottomSlotY = Math.max(
                  topSlotY,
                  menuColumnHeight - (sections.length - idx) * MENU_ITEM_STEP_PX,
                );
                const targetY = isTopStack ? topSlotY : bottomSlotY;

                return (
                  <motion.div
                    key={section.id}
                    initial={false}
                    animate={{
                      y: targetY,
                      x: isActive || isItemHovered ? -6 : 0,
                      scale: isActive ? 1.04 : 1,
                    }}
                    transition={{
                      y: {
                        type: "spring",
                        stiffness: 185,
                        damping: 26,
                        mass: 0.72 + idx * 0.06,
                      },
                      x: { type: "spring", stiffness: 420, damping: 30 },
                      scale: { type: "spring", stiffness: 400, damping: 30 },
                    }}
                    className="absolute top-0 right-0 origin-right will-change-transform"
                    style={{ height: `${MENU_ITEM_STEP_PX}px` }}
                  >
                    <button
                      type="button"
                      onClick={() => jumpToSection(section, idx)}
                      onMouseEnter={() => {
                        setHoveredIndex(idx);
                        const r = idx / Math.max(1, sections.length - 1);
                        pointerRatioRef.current = r;
                        rawFocus.set(r);
                      }}
                      onMouseLeave={() => setHoveredIndex(null)}
                      aria-current={isActive ? "location" : undefined}
                      className="group relative h-full pointer-events-auto flex items-baseline justify-end gap-2.5 pl-3 cursor-pointer focus:outline-none focus-visible:underline"
                    >
                      <span
                        className="text-[11px] font-bold tabular-nums tracking-[0.12em] transition-colors duration-300"
                        style={{
                          color: isActive
                            ? "var(--accent)"
                            : isItemHovered
                              ? "var(--text-primary)"
                              : "var(--text-muted)",
                          opacity: isActive || isItemHovered ? 1 : 0.7,
                        }}
                      >
                        {section.code}
                      </span>
                      <span
                        className="text-[15px] xl:text-[17px] font-semibold leading-tight tracking-[-0.015em] whitespace-nowrap transition-[color,opacity] duration-300"
                        style={{
                          color:
                            isActive || isItemHovered
                              ? "var(--text-primary)"
                              : "var(--text-muted)",
                          opacity: isActive || isItemHovered
                            ? 1
                            : isPassed
                              ? 0.58
                              : 0.82,
                        }}
                      >
                        {section.label}
                      </span>
                      {/* Crisp Accent Baseline Indicator */}
                      <span
                        aria-hidden="true"
                        className="absolute right-0 bottom-[3px] h-[2px] origin-right transition-transform duration-300 ease-out"
                        style={{
                          width: "22px",
                          background: "var(--accent)",
                          transform: `scaleX(${
                            isActive ? 1 : isItemHovered ? 0.55 : 0
                          })`,
                        }}
                      />
                    </button>
                  </motion.div>
                );
              })}
            </div>

            {/* Right-Flush Graduated Ruler Ticks & Velocity-Reactive Caliper Needle */}
            <div
              ref={desktopTrackRef}
              role="slider"
              tabIndex={0}
              aria-label="Scroll ruler scrubber"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={0}
              onPointerDown={handleDesktopTrackPointerDown}
              onPointerMove={(e) => {
                if (isScrubbing || !desktopTrackRef.current) return;
                const rect = desktopTrackRef.current.getBoundingClientRect();
                const ratio = (e.clientY - rect.top) / Math.max(1, rect.height);
                const clamped = Math.max(0, Math.min(1, ratio));
                pointerRatioRef.current = clamped;
                rawFocus.set(clamped);
              }}
              onPointerLeave={() => {
                if (!isScrubbing) {
                  pointerRatioRef.current = null;
                  rawFocus.set(rawProgress.get());
                }
              }}
              onKeyDown={(e) => {
                if (
                  e.key === "ArrowDown" &&
                  activeIndex < sections.length - 1
                ) {
                  e.preventDefault();
                  jumpToSection(sections[activeIndex + 1], activeIndex + 1);
                } else if (e.key === "ArrowUp" && activeIndex > 0) {
                  e.preventDefault();
                  jumpToSection(sections[activeIndex - 1], activeIndex - 1);
                }
              }}
              className="relative h-full w-11 flex flex-col justify-between items-end pointer-events-auto cursor-grab active:cursor-grabbing touch-none focus:outline-none"
            >
              {/* Live Velocity-Reactive Orange Caliper Needle + Compact Vernier Telemetry */}
              <motion.div
                aria-hidden="true"
                className="absolute right-0 z-20 pointer-events-none flex items-center justify-end will-change-transform"
                style={{
                  top: desktopNeedleTop,
                  translateY: "-50%",
                }}
              >
                {/* Micro Vernier Readout riding neatly above the needle (never shifts needle vertical alignment) */}
                <div
                  className="absolute bottom-2 right-1 flex items-center gap-1.5 transition-opacity duration-200 pointer-events-none"
                  style={{
                    opacity: isDesktopHovered || isScrubbing ? 1 : 0.72,
                  }}
                >
                  {isScrubbing && activeSection && (
                    <span
                      className="text-[11px] font-bold tracking-tight whitespace-nowrap"
                      style={{
                        color: "var(--text-primary)",
                        textShadow: "0 1px 8px var(--bg-primary)",
                      }}
                    >
                      {activeSection.label}
                    </span>
                  )}
                  <span
                    ref={percentTextRef}
                    className="text-[10px] font-bold tabular-nums tracking-[0.08em]"
                    style={{ color: "var(--accent)" }}
                  >
                    00%
                  </span>
                </div>

                <motion.span
                  className="w-9 h-[3.5px] block origin-right"
                  style={{
                    scaleY: needleScaleY,
                    background: "var(--accent)",
                    boxShadow:
                      "0 0 14px color-mix(in srgb, var(--accent) 55%, transparent)",
                  }}
                />
              </motion.div>

              {/* 41 Full-Height Bold Graduated Ticks driven purely by MotionValue */}
              {Array.from({ length: DESKTOP_TICKS }, (_, tickIdx) => {
                const tickRatio = tickIdx / (DESKTOP_TICKS - 1);
                const isMajor = tickIdx % DESKTOP_MINOR_STEP === 0;
                const isHalf = !isMajor && tickIdx % 5 === 0;
                const majorSectionIdx = tickIdx / DESKTOP_MINOR_STEP;
                const isActiveMajor = isMajor && majorSectionIdx === activeIndex;

                return (
                  <DesktopRulerTick
                    key={tickIdx}
                    tickRatio={tickRatio}
                    isMajor={isMajor}
                    isHalf={isHalf}
                    isActiveMajor={isActiveMajor}
                    focusRatio={smoothFocus}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* ============================================================
          MOBILE TRANSPARENT LOWER-RIGHT iPHONE ZOOM DIAL (`< md`)
          Zero background, zero border box — cylindrical optical wheel ticks
         ============================================================ */}
      <div
        ref={mobileContainerRef}
        className="flex md:hidden fixed bottom-24 right-0 z-[180] items-center select-none"
        style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}
      >
        {/* Minimal Floating Quick-Jump Menu (only appears when user taps dial) */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 14 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="mr-3 py-1.5 flex flex-col items-end gap-1"
              style={{
                paddingRight: "10px",
                textShadow:
                  "0 1px 10px var(--bg-primary), 0 0 18px var(--bg-primary)",
              }}
            >
              {sections.map((section, idx) => {
                const isActive = idx === activeIndex;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => jumpToSection(section, idx)}
                    className="py-2 px-1 flex items-baseline justify-end gap-2.5 cursor-pointer"
                  >
                    <span
                      className="text-[11px] font-bold tabular-nums"
                      style={{
                        color: isActive
                          ? "var(--accent)"
                          : "var(--text-muted)",
                      }}
                    >
                      {section.code}
                    </span>
                    <span
                      className="text-[16px] font-semibold leading-none tracking-tight"
                      style={{
                        color: isActive
                          ? "var(--text-primary)"
                          : "var(--text-secondary)",
                      }}
                    >
                      {section.label}
                    </span>
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Borderless Chapter Label while Scrolling / Scrubbing */}
        <AnimatePresence>
          {!isMobileMenuOpen &&
            (showMobileHud || isScrubbing) &&
            activeSection && (
              <motion.div
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
                className="mr-2 pointer-events-none flex items-baseline gap-2"
                style={{
                  textShadow:
                    "0 1px 10px var(--bg-primary), 0 0 18px var(--bg-primary)",
                }}
              >
                <span
                  className="text-[12px] font-bold tabular-nums"
                  style={{ color: "var(--accent)" }}
                >
                  {activeSection.code}
                </span>
                <span
                  className="text-[16px] font-bold tracking-tight whitespace-nowrap"
                  style={{ color: "var(--text-primary)" }}
                >
                  {activeSection.label}
                </span>
              </motion.div>
            )}
        </AnimatePresence>

        {/* Pure Transparent iPhone Camera Zoom Wheel (zero background/border) */}
        <div
          ref={mobileDialRef}
          role="slider"
          tabIndex={0}
          aria-label="Mobile section zoom dial. Slide vertically to scroll or tap to select section."
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={0}
          onPointerDown={handleMobileDialPointerDown}
          className="relative w-[54px] h-[220px] overflow-hidden cursor-ns-resize touch-none bg-transparent"
          style={{
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0%, black 22%, black 78%, transparent 100%)",
            maskImage:
              "linear-gradient(to bottom, transparent 0%, black 22%, black 78%, transparent 100%)",
          }}
        >
          {/* Fixed Center Orange Reticle Needle flush right */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 z-30 flex items-center"
          >
            <span
              className="w-9 h-[3.5px] block"
              style={{
                background: "var(--accent)",
                boxShadow:
                  "0 0 12px color-mix(in srgb, var(--accent) 65%, transparent)",
              }}
            />
          </div>

          {/* Rolling Cylindrical Arc Ruler Tape */}
          <motion.div
            aria-hidden="true"
            className="absolute inset-x-0 z-10 pointer-events-none"
            style={{
              top: "50%",
              y: mobileTapeY,
            }}
          >
            {mobileTicks.map((tick) => (
              <MobileDialTick
                key={tick.index}
                index={tick.index}
                isMajor={tick.isMajor}
                isHalf={tick.isHalf}
                section={tick.section}
                tapeY={mobileTapeY}
              />
            ))}
          </motion.div>
        </div>
      </div>
    </>
  );
}
