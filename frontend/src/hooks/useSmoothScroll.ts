/**
 * useSmoothScroll.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * A zero-dependency, pure-rAF smooth scroll implementation.
 *
 * HOW IT WORKS
 * ────────────
 * The trick used by Lenis, Locomotive Scroll, and every top-tier agency site:
 *
 *   1. Fix the <body> (or a scroll container) so the browser's native scrollbar
 *      is suppressed, but a fake full-height sentinel <div> still makes the
 *      scrollbar appear and the page feel scrollable.
 *
 *   2. On every wheel / touch event, accumulate the intended scroll distance into
 *      `targetY` (with optional easing).
 *
 *   3. In a rAF loop, LERP `currentY` toward `targetY` with factor ~0.09.
 *      Write the result to `document.documentElement.style.setProperty('--scroll-y', ...)`
 *      AND to `transform: translateY(-currentY)` on the scroll container.
 *
 *   4. Every animated element that needs scroll-awareness reads --scroll-y via
 *      CSS or a useScrollY hook.
 *
 * STRUCTURAL WRAPPERS NEEDED IN App.tsx
 * ──────────────────────────────────────
 *   <div id="smooth-wrapper">          ← gets translateY applied
 *     <div id="smooth-content">        ← normal page flow lives here
 *       ...children
 *     </div>
 *   </div>
 *
 * The hook returns { scrollY } so consumers can react to scroll position.
 *
 * WHY NO LIBRARY?
 * ───────────────
 * Lenis is ~4 KB gzipped and excellent. This impl is ~1 KB and avoids any
 * install step / version conflict. Swap for Lenis by:
 *   import Lenis from '@studio-freight/lenis'
 *   const lenis = new Lenis(); then lenis.raf(time) inside rAF.
 *
 * Zero changes to logic, state, or colors.
 */

import { useEffect, useRef, useState } from "react";

// ─── Config ───────────────────────────────────────────────────────────────────
const LERP    = 0.09;   // smoothing factor — lower = silkier, higher = snappier
const DAMPING = 0.92;   // velocity damping on wheel release
const TOUCH_MULT = 1.6; // touch scroll multiplier

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

export function useSmoothScroll() {
  const [scrollY, setScrollY] = useState(0);
  const currentYRef = useRef(0);
  const targetYRef  = useRef(0);
  const velRef      = useRef(0);
  const animRef     = useRef<number>();
  const touchRef    = useRef(0);

  useEffect(() => {
    const wrapper = document.getElementById("smooth-wrapper");
    const content = document.getElementById("smooth-content");
    if (!wrapper || !content) return; // gracefully no-op if wrappers absent

    // ── Setup: body becomes a fixed viewport ──────────────────────────────
    const prevBodyOverflow = document.body.style.overflow;
    const prevBodyPos      = document.body.style.position;
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width    = "100%";

    wrapper.style.position = "fixed";
    wrapper.style.top      = "0";
    wrapper.style.left     = "0";
    wrapper.style.right    = "0";
    wrapper.style.bottom   = "0";
    wrapper.style.overflow = "hidden";

    content.style.willChange = "transform";

    // ── Sentinel: invisible full-height div makes native scrollbar show ───
    const sentinel = document.createElement("div");
    sentinel.id = "smooth-sentinel";
    sentinel.style.cssText = `
      position: fixed; top: 0; right: 0;
      width: 1px; height: 1px; opacity: 0; pointer-events: none;
    `;
    document.body.appendChild(sentinel);

    // Keep sentinel height = content scroll height
    const ro = new ResizeObserver(() => {
      const maxScroll = content.scrollHeight - window.innerHeight;
      document.documentElement.style.setProperty("--max-scroll", `${maxScroll}`);
    });
    ro.observe(content);

    // ── Wheel handler ─────────────────────────────────────────────────────
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const maxScroll = content.scrollHeight - window.innerHeight;
      velRef.current += e.deltaY;
      targetYRef.current = clamp(targetYRef.current + e.deltaY, 0, maxScroll);
    };

    // ── Touch handlers ────────────────────────────────────────────────────
    const onTouchStart = (e: TouchEvent) => {
      touchRef.current = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const dy = (touchRef.current - e.touches[0].clientY) * TOUCH_MULT;
      touchRef.current = e.touches[0].clientY;
      const maxScroll = content.scrollHeight - window.innerHeight;
      targetYRef.current = clamp(targetYRef.current + dy, 0, maxScroll);
    };

    wrapper.addEventListener("wheel",      onWheel,      { passive: false });
    wrapper.addEventListener("touchstart", onTouchStart, { passive: false });
    wrapper.addEventListener("touchmove",  onTouchMove,  { passive: false });

    // ── rAF loop ──────────────────────────────────────────────────────────
    let lastScrollY = -1;
    const tick = () => {
      const maxScroll = content.scrollHeight - window.innerHeight;
      velRef.current *= DAMPING;
      currentYRef.current = lerp(
        currentYRef.current,
        clamp(targetYRef.current, 0, maxScroll),
        LERP
      );

      const rounded = Math.round(currentYRef.current * 100) / 100;
      content.style.transform = `translate3d(0, ${-rounded}px, 0)`;

      // Expose scroll position as CSS variable for parallax / reveals
      document.documentElement.style.setProperty("--scroll-y", `${rounded}`);

      // Only trigger React state update when scroll changes noticeably
      if (Math.abs(rounded - lastScrollY) > 0.5) {
        lastScrollY = rounded;
        setScrollY(rounded);
      }

      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);

    // ── Programmatic scroll (for anchor links etc.) ───────────────────────
    const onHashChange = () => {
      const hash = window.location.hash;
      if (!hash) return;
      const target = document.querySelector(hash) as HTMLElement | null;
      if (target) {
        const maxScroll = content.scrollHeight - window.innerHeight;
        targetYRef.current = clamp(target.offsetTop, 0, maxScroll);
      }
    };
    window.addEventListener("hashchange", onHashChange);

    return () => {
      // Restore body
      document.body.style.overflow  = prevBodyOverflow;
      document.body.style.position  = prevBodyPos;
      document.body.style.width     = "";
      wrapper.style.cssText          = "";
      content.style.willChange      = "";
      content.style.transform       = "";
      sentinel.remove();
      ro.disconnect();
      wrapper.removeEventListener("wheel",      onWheel);
      wrapper.removeEventListener("touchstart", onTouchStart);
      wrapper.removeEventListener("touchmove",  onTouchMove);
      window.removeEventListener("hashchange", onHashChange);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  return { scrollY };
}

/**
 * useScrollY — lightweight hook for any component that needs to read scroll
 * without triggering the full smooth scroll engine (reads CSS var directly).
 *
 * Usage:
 *   const y = useScrollY();
 */
export function useScrollY(): number {
  const [y, setY] = useState(0);
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const val = parseFloat(
        document.documentElement.style.getPropertyValue("--scroll-y") || "0"
      );
      setY(val);
    });
    // Observe style attribute changes on <html>
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style"],
    });
    return () => observer.disconnect();
  }, []);
  return y;
}
