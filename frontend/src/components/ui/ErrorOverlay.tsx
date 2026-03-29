import { type FC, useEffect, useState } from "react";
import type { ApiError } from "../../types";

interface ErrorOverlayProps {
  error:   ApiError;
  onReset: () => void;
}

const ErrorOverlay: FC<ErrorOverlayProps> = ({ error, onReset }) => {
  const [visible, setVisible] = useState(false);
  const [hov,     setHov]     = useState(false);

  // Fade in after mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 20);
    return () => clearTimeout(t);
  }, []);

  const is401 = error.status === 401;
  const is403 = error.status === 403;
  const isAuth = is401 || is403;

  const title   = isAuth ? "ACCESS DENIED"    : "SYSTEM FAILURE";
  const code    = isAuth ? "ERR_401_UNAUTH"   : `ERR_${error.status}_FATAL`;
  const subline = isAuth
    ? "Quantum signature rejected. Credentials revoked or absent."
    : "Critical anomaly detected in neural pipeline. Connection severed.";
  const accentRgb = isAuth ? "255,0,64" : "255,100,0";
  const accent    = isAuth ? "#FF0040"  : "#FF6400";

  return (
    <div
      style={{
        position:        "fixed",
        inset:           0,
        zIndex:          9999,
        display:         "flex",
        alignItems:      "center",
        justifyContent:  "center",
        background:      "rgba(0,0,0,0.92)",
        backdropFilter:  "blur(8px)",
        opacity:         visible ? 1 : 0,
        transition:      "opacity 0.4s ease",
      }}
    >
      {/* Animated corner brackets */}
      {["tl", "tr", "bl", "br"].map((pos) => (
        <div
          key={pos}
          style={{
            position: "absolute",
            width:    24,
            height:   24,
            top:      pos.startsWith("t") ? 32 : undefined,
            bottom:   pos.startsWith("b") ? 32 : undefined,
            left:     pos.endsWith("l")   ? 32 : undefined,
            right:    pos.endsWith("r")   ? 32 : undefined,
            borderTop:    pos.startsWith("t") ? `1px solid ${accent}` : undefined,
            borderBottom: pos.startsWith("b") ? `1px solid ${accent}` : undefined,
            borderLeft:   pos.endsWith("l")   ? `1px solid ${accent}` : undefined,
            borderRight:  pos.endsWith("r")   ? `1px solid ${accent}` : undefined,
            opacity:      0.5,
          }}
        />
      ))}

      {/* Card */}
      <div
        style={{
          width:        "min(480px, calc(100vw - 40px))",
          background:   "#07080d",
          border:       `1px solid ${accent}44`,
          borderRadius: 6,
          overflow:     "hidden",
          boxShadow:    `0 0 0 1px ${accent}11, 0 0 80px ${accent}22, 0 40px 100px rgba(0,0,0,1)`,
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            height:     2,
            background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
            boxShadow:  `0 0 12px ${accent}`,
          }}
        />

        <div style={{ padding: "36px 32px 32px" }}>
          {/* Code */}
          <div
            className="font-mono-tech"
            style={{
              fontSize:      9,
              letterSpacing: "0.22em",
              color:         `rgba(${accentRgb}, 0.5)`,
              marginBottom:  12,
            }}
          >
            {code}
          </div>

          {/* Title */}
          <div
            className="font-orbitron"
            style={{
              fontSize:      28,
              fontWeight:    900,
              color:         accent,
              letterSpacing: "0.04em",
              marginBottom:  10,
              textShadow:    `0 0 30px ${accent}88`,
            }}
          >
            {title}
          </div>

          {/* Subline */}
          <div
            className="font-exo"
            style={{
              fontSize:   13,
              lineHeight: 1.7,
              color:      "#5a6a7a",
              marginBottom: 8,
            }}
          >
            {subline}
          </div>

          {/* Raw message */}
          <div
            className="font-mono-tech"
            style={{
              fontSize:      10,
              letterSpacing: "0.1em",
              color:         `rgba(${accentRgb}, 0.35)`,
              marginBottom:  28,
              background:    "rgba(0,0,0,0.4)",
              border:        `1px solid rgba(${accentRgb}, 0.1)`,
              borderRadius:  3,
              padding:       "8px 12px",
            }}
          >
            &gt; {error.message}
          </div>

          {/* Divider */}
          <div
            style={{
              height:       1,
              background:   `rgba(${accentRgb}, 0.08)`,
              marginBottom: 24,
            }}
          />

          {/* CTA */}
          <button
            onClick={onReset}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            className="font-mono-tech"
            style={{
              fontSize:      9,
              letterSpacing: "0.18em",
              padding:       "10px 22px",
              border:        `1px solid ${hov ? accent : `rgba(${accentRgb}, 0.3)`}`,
              background:    hov ? `rgba(${accentRgb}, 0.08)` : "transparent",
              color:         hov ? accent : `rgba(${accentRgb}, 0.6)`,
              borderRadius:  3,
              cursor:        "pointer",
              boxShadow:     hov ? `0 0 20px rgba(${accentRgb}, 0.2)` : "none",
              transition:    "all 0.2s ease",
              width:         "100%",
            }}
          >
            ← ABORT MISSION — RETURN TO BASE
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorOverlay;
