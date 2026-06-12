"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { usePathname } from "next/navigation";

export function CustomCursor() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  // Raw mouse coordinates
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Target values
  const targetX = useMotionValue(-100);
  const targetY = useMotionValue(-100);
  const targetWidth = useMotionValue(12);
  const targetHeight = useMotionValue(12);

  // Springs for smooth following and morphing
  const springConfig = { damping: 35, stiffness: 800, mass: 0.2 };
  const smoothX = useSpring(targetX, springConfig);
  const smoothY = useSpring(targetY, springConfig);
  const smoothWidth = useSpring(targetWidth, springConfig);
  const smoothHeight = useSpring(targetHeight, springConfig);

  useEffect(() => {
    // Only run on desktop/devices with fine pointer
    if (window.matchMedia("(pointer: coarse)").matches) return;
    setIsVisible(true);

    let hoveredEl: HTMLElement | null = null;

    const updateCursor = () => {
      if (hoveredEl) {
        const rect = hoveredEl.getBoundingClientRect();
        targetX.set(rect.left);
        targetY.set(rect.top);
        targetWidth.set(rect.width);
        targetHeight.set(rect.height);
      } else {
        targetX.set(mouseX.get() - 6);
        targetY.set(mouseY.get() - 6);
        targetWidth.set(12);
        targetHeight.set(12);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      updateCursor();
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Hide custom cursor over text inputs to let the native I-beam cursor show cleanly
      if (target.closest("input, textarea")) {
        setIsHidden(true);
        hoveredEl = null;
        setIsHovering(false);
        updateCursor();
        return;
      }
      
      setIsHidden(false);

      // Check if hovering over interactive elements
      const interactiveEl = target.closest("a, button, [role='button'], select");
      
      if (interactiveEl || window.getComputedStyle(target).cursor === "pointer") {
        const el = interactiveEl || target;
        const rect = el.getBoundingClientRect();
        
        // Prevent snapping to massive elements like whole project cards
        if (rect.width < 400 && rect.height < 300) {
          hoveredEl = el as HTMLElement;
          setIsHovering(true);
          updateCursor();
          return;
        }
      }
      
      hoveredEl = null;
      setIsHovering(false);
      updateCursor();
    };

    const handleMouseOut = (e: MouseEvent) => {
      hoveredEl = null;
      setIsHovering(false);
      updateCursor();
    };

    const handleScroll = () => {
      updateCursor();
    };

    // Use passive listeners for better performance
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseover", handleMouseOver, { passive: true });
    window.addEventListener("mouseout", handleMouseOut, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
      window.removeEventListener("mouseout", handleMouseOut);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [mouseX, mouseY, targetX, targetY, targetWidth, targetHeight]);

  if (pathname?.startsWith("/admin")) return null;
  if (!isVisible) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media (pointer: fine) {
          * {
            cursor: none !important;
          }
          input, textarea {
            cursor: text !important;
          }
        }
      `}} />
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999]"
        style={{
          x: smoothX,
          y: smoothY,
          width: smoothWidth,
          height: smoothHeight,
          willChange: "transform, width, height"
        }}
      >
        <motion.div
          animate={{
            backgroundColor: isHovering ? "rgba(237, 93, 49, 0)" : "var(--accent)",
            borderWidth: isHovering ? "2px" : "0px",
            borderColor: "var(--accent)",
            borderStyle: "solid",
            borderRadius: 0,
            opacity: isHidden ? 0 : 1,
          }}
          transition={{
            duration: 0.15,
            ease: "easeOut"
          }}
          style={{
            width: "100%",
            height: "100%",
            mixBlendMode: isHovering ? "normal" : "difference"
          }}
        />
      </motion.div>
    </>
  );
}
