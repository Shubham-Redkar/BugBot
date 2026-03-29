// New file: src/hooks/useScrollReveal.ts
// IntersectionObserver scroll-reveal. Adds/removes CSS classes only.
// Zero body manipulation — completely safe alongside any scroll setup.

import { useCallback, useEffect, useRef } from "react";

interface RevealOptions {
  staggerMs?:  number;   // ms between each child (default: 80)
  baseDelay?:  number;   // initial wait before first item (default: 0)
  threshold?:  number;   // IO threshold (default: 0.1)
  rootMargin?: string;   // IO rootMargin (default: "0px 0px -50px 0px")
}

// ─── useScrollReveal ─────────────────────────────────────────────────────────
// Attach containerRef to a parent div. Each direct child gets .sr-hidden
// on mount, then .is-revealed with staggered delays as they enter the viewport.
// The actual animation is CSS — see animations.css (.sr-hidden / .is-revealed).
export function useScrollReveal(opts: RevealOptions = {}) {
  const {
    staggerMs  = 80,
    baseDelay  = 0,
    threshold  = 0.1,
    rootMargin = "0px 0px -50px 0px",
  } = opts;

  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef  = useRef<IntersectionObserver | null>(null);

  const observe = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const targets = Array.from(container.children) as HTMLElement[];

    targets.forEach((el) => {
      if (!el.classList.contains("is-revealed")) {
        el.classList.add("sr-hidden");
      }
    });

    observerRef.current?.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el  = entry.target as HTMLElement;
          const idx = targets.indexOf(el);
          setTimeout(() => {
            el.classList.add("is-revealed");
          }, baseDelay + idx * staggerMs);
          observerRef.current?.unobserve(el);
        });
      },
      { threshold, rootMargin }
    );

    targets.forEach((el) => observerRef.current?.observe(el));
  }, [staggerMs, baseDelay, threshold, rootMargin]);

  useEffect(() => {
    observe();
    return () => observerRef.current?.disconnect();
  }, [observe]);

  return { containerRef, refreshReveal: observe };
}
