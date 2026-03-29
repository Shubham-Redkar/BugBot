import { useCallback, useEffect, useRef } from "react";

interface RevealOptions {
  staggerMs?: number;
  baseDelay?: number;
  threshold?: number;
  rootMargin?: string;
}

export function useScrollReveal(opts: RevealOptions = {}) {
  const {
    staggerMs = 80,
    baseDelay = 0,
    threshold = 0.1,
    rootMargin = "0px 0px -50px 0px",
  } = opts;

  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

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
          const el = entry.target as HTMLElement;
          const idx = targets.indexOf(el);
          setTimeout(
            () => {
              el.classList.add("is-revealed");
            },
            baseDelay + idx * staggerMs,
          );
          observerRef.current?.unobserve(el);
        });
      },
      { threshold, rootMargin },
    );

    targets.forEach((el) => observerRef.current?.observe(el));
  }, [staggerMs, baseDelay, threshold, rootMargin]);

  useEffect(() => {
    observe();
    return () => observerRef.current?.disconnect();
  }, [observe]);

  return { containerRef, refreshReveal: observe };
}
