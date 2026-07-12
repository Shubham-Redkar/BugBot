/**
 * MagneticCursor.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Replaces the existing CursorReticle with a two-layer cursor system:
 *
 *  Layer A — "dot"   : a tiny 6px circle that snaps instantly to the pointer.
 *  Layer B — "ring"  : a 28px ring that LERP-trails the dot (requestAnimationFrame).
 *
 * Magnetic effect:
 *   On proximity to any [data-magnetic] element the element itself is
 *   translateX/Y'd toward the cursor via a lerp spring, and snaps back on leave.
 *   The ring expands + changes blend-mode to "exclusion" while inside the magnet zone.
 *
 * How it works structurally:
 *   - Two <div>s live at z-index 9999 with pointer-events:none.
 *   - posRef holds the real cursor; ringRef holds the ring's LERP'd position.
 *   - A single rAF loop runs the ring lerp + writes transforms via direct DOM
 *     manipulation (NOT setState) to keep 60 fps without React re-renders.
 *   - MagneticWrapper is a tiny HOC that adds the magnet logic to any child.
 *
 * Zero logic/color changes — purely cosmetic layer.
 */

import { type FC, type ReactNode, useCallback, useEffect, useRef, useState } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const LERP_FACTOR   = 0.11;   // ring lag: 0 = frozen, 1 = instant
const MAGNET_RADIUS = 80;     // px from element centre that triggers magnet
const MAGNET_PULL   = 0.38;   // how far the element moves (fraction of offset)
const DOT_SIZE      = 6;
const RING_SIZE     = 28;
const RING_SIZE_HOV = 52;     // expanded ring on interactive elements
const RING_SIZE_CLK = 18;

// ─── Lerp helper ─────────────────────────────────────────────────────────────
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

// ─── MagneticWrapper ─────────────────────────────────────────────────────────
/**
 * Wrap any button or link with <MagneticWrapper> to give it the magnetic pull.
 * It adds no DOM structure — it just attaches mouse-event listeners to the
 * single child element via a ref and drives translateX/Y via direct style writes.
 *
 * Usage:
 *   <MagneticWrapper>
 *     <button ...>LAUNCH</button>
 *   </MagneticWrapper>
 */
export const MagneticWrapper: FC<{ children: ReactNode; strength?: number }> = ({
  children,
  strength = MAGNET_PULL,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current?.firstElementChild as HTMLElement | null;
    if (!el) return;

    let animId: number;
    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;
    let active = false;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < MAGNET_RADIUS) {
        active = true;
        targetX = dx * strength;
        targetY = dy * strength;
      } else {
        active = false;
        targetX = 0;
        targetY = 0;
      }
    };

    const onLeave = () => {
      active = false;
      targetX = 0;
      targetY = 0;
    };

    const tick = () => {
      currentX = lerp(currentX, targetX, 0.14);
      currentY = lerp(currentY, targetY, 0.14);
      el.style.transform = `translate(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px)`;
      animId = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    animId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(animId);
      el.style.transform = "";
    };
  }, [strength]);

  return (
    <div ref={ref} style={{ display: "contents" }}>
      {children}
    </div>
  );
};

// ─── Main cursor component ────────────────────────────────────────────────────
const MagneticCursor: FC = () => {
  const dotRef     = useRef<HTMLDivElement>(null);
  const ringRef    = useRef<HTMLDivElement>(null);
  const posRef     = useRef({ x: -999, y: -999 });
  const ringPosRef = useRef({ x: -999, y: -999 });
  const stateRef   = useRef({ clicking: false, hovering: false });
  const animRef    = useRef<number>();

  // Track cursor position in a ref — no state so no re-renders
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY };

      // Dot: snap immediately via direct DOM write
      if (dotRef.current) {
        dotRef.current.style.transform =
          `translate(${e.clientX - DOT_SIZE / 2}px, ${e.clientY - DOT_SIZE / 2}px)`;
      }

      // Detect interactive element under cursor
      const el = document.elementFromPoint(e.clientX, e.clientY);
      stateRef.current.hovering = el
        ? el.closest("button, a, input, [role='button'], [tabindex], [data-magnetic]") !== null
        : false;
    };

    const onDown = () => { stateRef.current.clicking = true; };
    const onUp   = () => { stateRef.current.clicking = false; };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup",   onUp);

    // rAF loop — only for the ring LERP (dot is updated in onMove)
    const tick = () => {
      const { x: tx, y: ty } = posRef.current;
      const rp = ringPosRef.current;
      rp.x = lerp(rp.x, tx, LERP_FACTOR);
      rp.y = lerp(rp.y, ty, LERP_FACTOR);

      const { clicking, hovering } = stateRef.current;
      const targetSize = clicking
        ? RING_SIZE_CLK
        : hovering
        ? RING_SIZE_HOV
        : RING_SIZE;

      if (ringRef.current) {
        ringRef.current.style.transform =
          `translate(${(rp.x - targetSize / 2).toFixed(2)}px, ${(rp.y - targetSize / 2).toFixed(2)}px)`;
        ringRef.current.style.width  = `${targetSize}px`;
        ringRef.current.style.height = `${targetSize}px`;
        ringRef.current.style.opacity = clicking ? "0.5"
          : hovering ? "0.85" : "0.55";
        // blend-mode flip on hover — creates that inversion "spotlight" effect
        ringRef.current.style.mixBlendMode = hovering ? "exclusion" : "normal";
        ringRef.current.style.borderColor  = hovering
          ? "rgba(255,255,255,0.9)"
          : clicking
          ? "rgba(0,245,255,0.4)"
          : "rgba(0,245,255,0.55)";
        ringRef.current.style.boxShadow = hovering
          ? "0 0 0 1px rgba(255,255,255,0.15)"
          : `0 0 ${clicking ? 6 : 10}px rgba(0,245,255,${clicking ? 0.3 : 0.25})`;
      }

      animRef.current = requestAnimationFrame(tick);
    };

    // Init ring at off-screen
    ringPosRef.current = { x: -999, y: -999 };
    animRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup",   onUp);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <>
      {/**
       * DOT — snaps instantly to mouse.
       * position:fixed + will-change:transform = GPU composited, zero layout cost.
       */}
      <div
        ref={dotRef}
        style={{
          position:       "fixed",
          top:            0,
          left:           0,
          width:          DOT_SIZE,
          height:         DOT_SIZE,
          borderRadius:   "50%",
          background:     "#00F5FF",
          boxShadow:      "0 0 8px #00F5FF, 0 0 20px rgba(0,245,255,0.4)",
          pointerEvents:  "none",
          zIndex:         10000,
          willChange:     "transform",
          transform:      "translate(-999px,-999px)",
        }}
      />

      {/**
       * RING — LERP-trails the dot with ~90ms lag.
       * Size, border-color, mix-blend-mode all mutated directly in rAF loop.
       * will-change:transform,width,height hints GPU to pre-promote the layer.
       */}
      <div
        ref={ringRef}
        style={{
          position:       "fixed",
          top:            0,
          left:           0,
          width:          RING_SIZE,
          height:         RING_SIZE,
          borderRadius:   "50%",
          border:         "1px solid rgba(0,245,255,0.55)",
          background:     "transparent",
          pointerEvents:  "none",
          zIndex:         9999,
          willChange:     "transform, width, height",
          transform:      "translate(-999px,-999px)",
          transition:     "width 0.18s cubic-bezier(0.34,1.4,0.64,1), height 0.18s cubic-bezier(0.34,1.4,0.64,1), border-color 0.18s ease, mix-blend-mode 0s",
        }}
      />
    </>
  );
};

export default MagneticCursor;
