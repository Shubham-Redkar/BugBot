/**
 * App.tsx — Animation layer update
 * ─────────────────────────────────────────────────────────────────────────────
 * CHANGES vs. original (cosmetic only — zero logic/color changes):
 *
 *  1. CursorReticle  → MagneticCursor  (drop-in swap, same position in JSX)
 *
 *  2. Smooth scroll wrappers added:
 *       <div id="smooth-wrapper">
 *         <div id="smooth-content">
 *           ... all page content ...
 *         </div>
 *       </div>
 *     useSmoothScroll() hook activated inside the wrapper.
 *
 *  3. The animation CSS is imported in main.tsx (see main.tsx changes below).
 *
 * Everything else — useScanner, phase logic, NeuralMesh, HUDScaffolding,
 * NavBar, all three page components — completely untouched.
 */

import NavBar        from "./components/layout/NavBar";
import HomePage      from "./components/pages/HomePage";
import ResultsPage   from "./components/pages/ResultsPage";
import ScanningPage  from "./components/pages/ScanningPage";
import HUDScaffolding from "./components/ui/HUDScaffolding";
import NeuralMesh    from "./components/ui/NeuralMesh";
// ── Swap: MagneticCursor replaces CursorReticle ──
import MagneticCursor from "./components/ui/MagneticCursor";
import { useScanner } from "./hooks/useScanner";
import { useSmoothScroll } from "./hooks/useSmoothScroll";

// ─── Inner component so useSmoothScroll can access the DOM wrappers ───────────
function SmoothApp() {
  /**
   * useSmoothScroll looks for #smooth-wrapper and #smooth-content in the DOM.
   * It sets body to position:fixed and drives #smooth-content with translate3d.
   * The returned scrollY can be passed to any child that needs scroll-awareness.
   */
  useSmoothScroll();
  const scanner = useScanner();

  return (
    /**
     * SMOOTH SCROLL WRAPPER STRUCTURE
     * ────────────────────────────────
     * #smooth-wrapper — fixed viewport container (position:fixed set by hook)
     *   #smooth-content — full-height scroll content driven by translate3d
     *     NavBar (fixed — sits outside content flow, same as before)
     *     NeuralMesh (fixed canvas — same as before)
     *     HUDScaffolding (fixed HUD — same as before)
     *     Page content (scrolls with #smooth-content)
     *
     * Why this structure?
     *   Native scroll is intercepted. The hook accumulates wheel delta into
     *   targetY and LERPs currentY toward it each rAF tick. The result is
     *   written to #smooth-content's transform — silky smooth at 60fps.
     */
    <div id="smooth-wrapper">
      <div id="smooth-content">
        <div className="relative min-h-screen" style={{ background: "#050505" }}>
          {/* Layer 0: Neural mesh canvas — fixed, same as before */}
          <NeuralMesh />

          {/* Layer 1: HUD scaffolding — fixed, same as before */}
          <HUDScaffolding />

          {/**
           * Layer 1.5: MagneticCursor replaces CursorReticle.
           *
           * WHAT CHANGED:
           *   Old: CursorReticle — SVG crosshair, trail dots, state-driven via setState.
           *   New: MagneticCursor — dot + ring, rAF-driven via direct DOM writes (no re-renders),
           *        LERP ring trail, mix-blend-mode:exclusion spotlight on hover,
           *        MagneticWrapper HOC for button/card pull effect.
           *
           * WHAT STAYED THE SAME:
           *   — Positioned identically (fixed, z-index:9999+)
           *   — Tracks all interactive elements (button, a, input)
           *   — Responds to click state (shrinks ring on mousedown)
           */}
          <MagneticCursor />

          {/* Layer 2: Nav — unchanged */}
          <NavBar phase={scanner.phase} onReset={scanner.reset} />

          {/* Layer 3: Page content — unchanged routing logic */}
          {scanner.phase === "home" && <HomePage onScan={scanner.startScan} />}

          {scanner.phase === "scanning" && (
            <ScanningPage
              activeStep={scanner.activeStep}
              doneSteps={scanner.doneSteps}
              logLines={scanner.logLines}
              scannedUrl={scanner.scannedUrl}
            />
          )}

          {scanner.phase === "results" && scanner.results && (
            <ResultsPage results={scanner.results} onReset={scanner.reset} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return <SmoothApp />;
}

/**
 * ─── COMPANION CHANGE: main.tsx ───────────────────────────────────────────────
 * Add this import AFTER './index.css' in main.tsx:
 *
 *   import './animations.css'
 *
 * Full updated main.tsx:
 *
 *   import { StrictMode } from 'react'
 *   import { createRoot } from 'react-dom/client'
 *   import './index.css'
 *   import './animations.css'   ← ADD THIS LINE
 *   import App from './App.tsx'
 *
 *   createRoot(document.getElementById('root')!).render(
 *     <StrictMode>
 *       <App />
 *     </StrictMode>,
 *   )
 *
 * ─── FILE PLACEMENT GUIDE ─────────────────────────────────────────────────────
 *
 *  src/
 *  ├── components/
 *  │   ├── ui/
 *  │   │   └── MagneticCursor.tsx    ← replaces CursorReticle.tsx (keep old file)
 *  │   └── pages/
 *  │       └── HomePage.tsx          ← updated (animations wired in)
 *  ├── hooks/
 *  │   ├── useSmoothScroll.ts        ← new
 *  │   └── useScrollReveal.ts        ← new
 *  ├── components/ui/
 *  │   └── KineticHeading.tsx        ← new
 *  ├── animations.css                ← new (import in main.tsx)
 *  └── App.tsx                       ← updated (smooth wrapper + MagneticCursor)
 */
