/**
 * Smooth scroll utility for ultra-smooth buttery scrolling across the site.
 * Integrates directly with Lenis smooth scroll while completely eliminating URL hashes.
 */

export function smoothScrollTo(target: string | number, offset: number = -70) {
  if (typeof window === "undefined") return;

  // Ensure URL hash is removed without triggering a page reload
  if (window.location.hash) {
    window.history.replaceState(
      null,
      "",
      window.location.pathname + window.location.search
    );
  }

  const lenis = (window as any).__lenis;

  // Scroll to top
  if (typeof target === "number" || target === "#" || target === "" || target === "top") {
    const topPos = typeof target === "number" ? target : 0;
    if (lenis) {
      lenis.scrollTo(topPos, {
        duration: 1.25,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });
    } else {
      window.scrollTo({ top: topPos, behavior: "smooth" });
    }
    return;
  }

  // Target element by ID
  const id = target.startsWith("#") ? target.slice(1) : target;
  const element = document.getElementById(id);
  if (!element) return;

  if (lenis) {
    lenis.scrollTo(element, {
      offset,
      duration: 1.3,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });
  } else {
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset + offset;
    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth",
    });
  }
}
