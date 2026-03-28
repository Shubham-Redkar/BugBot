import { type FC, useEffect, useRef, useState } from "react";

interface Trail {
  id: number;
  x: number;
  y: number;
  opacity: number;
}

const CursorReticle: FC = () => {
  const [pos, setPos] = useState({ x: -999, y: -999 });
  const [trail, setTrail] = useState<Trail[]>([]);
  const [clicking, setClicking] = useState(false);
  const [hovering, setHovering] = useState(false);
  const trailIdRef = useRef(0);
  const posRef = useRef({ x: -999, y: -999 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;
      posRef.current = { x, y };
      setPos({ x, y });

      // Add trail dot
      const id = trailIdRef.current++;
      setTrail((prev) => [...prev.slice(-10), { id, x, y, opacity: 0.5 }]);

      // Check if hovering interactive element
      const el = document.elementFromPoint(x, y);
      const isInteractive = el
        ? el.closest("button, a, input, [role='button'], [tabindex]") !== null
        : false;
      setHovering(isInteractive);
    };

    const onDown = () => setClicking(true);
    const onUp = () => setClicking(false);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);

    // Fade out trail
    const fadeInterval = setInterval(() => {
      setTrail((prev) =>
        prev
          .map((t) => ({ ...t, opacity: t.opacity - 0.08 }))
          .filter((t) => t.opacity > 0),
      );
    }, 30);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      clearInterval(fadeInterval);
    };
  }, []);

  const size = clicking ? 20 : hovering ? 28 : 24;
  const innerSize = clicking ? 3 : hovering ? 5 : 4;
  const armLen = clicking ? 6 : hovering ? 9 : 7;
  const armGap = clicking ? 4 : hovering ? 6 : 5;

  return (
    <>
      {/* Trail dots */}
      {trail.map((t, i) => (
        <div
          key={t.id}
          className="pointer-events-none fixed"
          style={{
            left: t.x,
            top: t.y,
            transform: "translate(-50%, -50%)",
            width: 2 + i * 0.3,
            height: 2 + i * 0.3,
            borderRadius: "50%",
            background: `rgba(0, 245, 255, ${t.opacity * 0.4})`,
            boxShadow: `0 0 ${4 + i}px rgba(0, 245, 255, ${t.opacity * 0.3})`,
            zIndex: 9998,
            pointerEvents: "none",
          }}
        />
      ))}

      {/* Main reticle */}
      <div
        className="cursor-reticle pointer-events-none"
        style={{
          left: pos.x,
          top: pos.y,
          width: size * 2,
          height: size * 2,
        }}
      >
        <svg
          width={size * 2}
          height={size * 2}
          viewBox={`0 0 ${size * 2} ${size * 2}`}
          fill="none"
          style={{
            filter: `drop-shadow(0 0 ${clicking ? 10 : hovering ? 8 : 4}px rgba(0,245,255,${clicking ? 1 : hovering ? 0.9 : 0.7}))`,
            transition:
              "filter 0.12s ease, width 0.12s ease, height 0.12s ease",
          }}
        >
          {/* Outer ring (partial arcs at corners) */}
          {[
            // top-left arc
            [size, size, size - 2, 200, 250],
            // top-right arc
            [size, size, size - 2, 290, 340],
            // bottom-right arc
            [size, size, size - 2, 20, 70],
            // bottom-left arc
            [size, size, size - 2, 110, 160],
          ].map(([cx, cy, r, startDeg, endDeg], i) => {
            const startRad = (startDeg * Math.PI) / 180;
            const endRad = (endDeg * Math.PI) / 180;
            const x1 = cx + r * Math.cos(startRad);
            const y1 = cy + r * Math.sin(startRad);
            const x2 = cx + r * Math.cos(endRad);
            const y2 = cy + r * Math.sin(endRad);
            return (
              <path
                key={i}
                d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`}
                stroke={`rgba(0, 245, 255, ${clicking ? 1 : hovering ? 0.9 : 0.55})`}
                strokeWidth={clicking ? 1.5 : 1}
                style={{
                  transition: "stroke-opacity 0.12s, stroke-width 0.12s",
                }}
              />
            );
          })}

          {/* Center dot */}
          <circle
            cx={size}
            cy={size}
            r={innerSize / 2}
            fill={`rgba(0, 245, 255, ${clicking ? 1 : hovering ? 0.95 : 0.8})`}
            style={{ transition: "r 0.12s ease, fill-opacity 0.12s" }}
          />

          {/* Cross arms — top */}
          <line
            x1={size}
            y1={size - armGap}
            x2={size}
            y2={size - armGap - armLen}
            stroke={`rgba(0, 245, 255, ${clicking ? 1 : hovering ? 0.95 : 0.75})`}
            strokeWidth={clicking ? 1.5 : 1}
            style={{ transition: "stroke-opacity 0.12s, stroke-width 0.12s" }}
          />
          {/* Cross arms — bottom */}
          <line
            x1={size}
            y1={size + armGap}
            x2={size}
            y2={size + armGap + armLen}
            stroke={`rgba(0, 245, 255, ${clicking ? 1 : hovering ? 0.95 : 0.75})`}
            strokeWidth={clicking ? 1.5 : 1}
            style={{ transition: "stroke-opacity 0.12s, stroke-width 0.12s" }}
          />
          {/* Cross arms — left */}
          <line
            x1={size - armGap}
            y1={size}
            x2={size - armGap - armLen}
            y2={size}
            stroke={`rgba(0, 245, 255, ${clicking ? 1 : hovering ? 0.95 : 0.75})`}
            strokeWidth={clicking ? 1.5 : 1}
            style={{ transition: "stroke-opacity 0.12s, stroke-width 0.12s" }}
          />
          {/* Cross arms — right */}
          <line
            x1={size + armGap}
            y1={size}
            x2={size + armGap + armLen}
            y2={size}
            stroke={`rgba(0, 245, 255, ${clicking ? 1 : hovering ? 0.95 : 0.75})`}
            strokeWidth={clicking ? 1.5 : 1}
            style={{ transition: "stroke-opacity 0.12s, stroke-width 0.12s" }}
          />

          {/* Click burst ring */}
          {clicking && (
            <circle
              cx={size}
              cy={size}
              r={size - 4}
              stroke="rgba(0,245,255,0.35)"
              strokeWidth={0.8}
              fill="none"
            />
          )}

          {/* Hover: diagonal tick marks at 45° corners */}
          {hovering && (
            <>
              {[
                [-1, -1],
                [1, -1],
                [1, 1],
                [-1, 1],
              ].map(([sx, sy], i) => (
                <line
                  key={i}
                  x1={size + sx * (size - 7)}
                  y1={size + sy * (size - 7)}
                  x2={size + sx * (size - 4)}
                  y2={size + sy * (size - 4)}
                  stroke="rgba(0,245,255,0.5)"
                  strokeWidth={1}
                />
              ))}
            </>
          )}
        </svg>
      </div>
    </>
  );
};

export default CursorReticle;
