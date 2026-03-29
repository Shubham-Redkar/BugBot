// Drop-in replacement for CursorReticle.tsx
// Place at: src/components/ui/CursorReticle.tsx (overwrite the old file)
// App.tsx import stays identical — no changes needed there.

import { type FC, type ReactNode, useEffect, useRef } from "react";

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

// ─── MagneticWrapper ─────────────────────────────────────────────────────────
// Wrap any button/card to give it a gentle magnetic pull toward the cursor.
// Uses display:contents so it adds zero layout impact.
// Usage: <MagneticWrapper><button ...>LAUNCH</button></MagneticWrapper>
export const MagneticWrapper: FC<{ children: ReactNode; strength?: number }> = ({
  children,
  strength = 0.36,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current?.firstElementChild as HTMLElement | null;
    if (!el) return;

    const RADIUS = 90;
    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;
    let animId: number;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < RADIUS) {
        targetX = dx * strength;
        targetY = dy * strength;
      } else {
        targetX = 0;
        targetY = 0;
      }
    };

    const onLeave = () => { targetX = 0; targetY = 0; };

    const tick = () => {
      currentX = lerp(currentX, targetX, 0.13);
      currentY = lerp(currentY, targetY, 0.13);
      el.style.transform = `translate(${currentX.toFixed(2)}px,${currentY.toFixed(2)}px)`;
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

// ─── Main cursor (replaces CursorReticle) ────────────────────────────────────
// Two layers: dot (snaps instantly) + ring (LERP trails ~90ms behind).
// Both driven by direct DOM writes in a single rAF loop — zero setState,
// zero re-renders, zero jank.
const CursorReticle: FC = () => {
  const dotRef  = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const posRef  = useRef({ x: -999, y: -999 });
  const ringPos = useRef({ x: -999, y: -999 });
  const state   = useRef({ clicking: false, hovering: false });
  const animRef = useRef<number>();

  useEffect(() => {
    const DOT_SIZE       = 6;
    const RING_SIZE      = 28;
    const RING_SIZE_HOV  = 52;
    const RING_SIZE_CLK  = 16;
    const LERP_FACTOR    = 0.11;

    const onMove = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY };
      // Dot: snap instantly
      if (dotRef.current) {
        dotRef.current.style.transform =
          `translate(${e.clientX - DOT_SIZE / 2}px,${e.clientY - DOT_SIZE / 2}px)`;
      }
      // Detect interactive element
      const el = document.elementFromPoint(e.clientX, e.clientY);
      state.current.hovering = el
        ? el.closest("button,a,input,[role='button'],[tabindex]") !== null
        : false;
    };

    const onDown = () => { state.current.clicking = true; };
    const onUp   = () => { state.current.clicking = false; };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup",   onUp);

    const tick = () => {
      const { x: tx, y: ty } = posRef.current;
      ringPos.current.x = lerp(ringPos.current.x, tx, LERP_FACTOR);
      ringPos.current.y = lerp(ringPos.current.y, ty, LERP_FACTOR);

      const { clicking, hovering } = state.current;
      const size = clicking ? RING_SIZE_CLK : hovering ? RING_SIZE_HOV : RING_SIZE;
      const half = size / 2;

      if (ringRef.current) {
        const r = ringRef.current;
        r.style.transform   = `translate(${(ringPos.current.x - half).toFixed(2)}px,${(ringPos.current.y - half).toFixed(2)}px)`;
        r.style.width       = `${size}px`;
        r.style.height      = `${size}px`;
        r.style.opacity     = clicking ? "0.45" : hovering ? "0.9" : "0.55";
        // mix-blend-mode exclusion creates the "spotlight inversion" on hover
        r.style.mixBlendMode   = hovering ? "exclusion" : "normal";
        r.style.borderColor    = hovering ? "rgba(255,255,255,0.95)" : "rgba(0,245,255,0.6)";
        r.style.backgroundColor = hovering ? "rgba(255,255,255,0.08)" : "transparent";
        r.style.boxShadow      = hovering
          ? "none"
          : `0 0 ${clicking ? 6 : 12}px rgba(0,245,255,${clicking ? 0.3 : 0.25})`;
      }

      animRef.current = requestAnimationFrame(tick);
    };

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
      {/* Dot — snaps to cursor instantly */}
      <div
        ref={dotRef}
        style={{
          position:      "fixed",
          top:           0,
          left:          0,
          width:         6,
          height:        6,
          borderRadius:  "50%",
          background:    "#00F5FF",
          boxShadow:     "0 0 8px #00F5FF, 0 0 20px rgba(0,245,255,0.4)",
          pointerEvents: "none",
          zIndex:        10000,
          willChange:    "transform",
          transform:     "translate(-999px,-999px)",
        }}
      />
      {/* Ring — LERP trails behind dot */}
      <div
        ref={ringRef}
        style={{
          position:      "fixed",
          top:           0,
          left:          0,
          width:         28,
          height:        28,
          borderRadius:  "50%",
          border:        "1px solid rgba(0,245,255,0.6)",
          background:    "transparent",
          pointerEvents: "none",
          zIndex:        9999,
          willChange:    "transform,width,height",
          transform:     "translate(-999px,-999px)",
          // CSS transition only on size/color — NOT position (position is driven by rAF)
          transition:    "width 0.2s cubic-bezier(0.34,1.4,0.64,1), height 0.2s cubic-bezier(0.34,1.4,0.64,1), border-color 0.15s, background-color 0.15s",
        }}
      />
    </>
  );
};

export default CursorReticle;
