import { type FC, useEffect, useRef, useState } from "react";

interface HomePageProps {
  onScan: (url: string) => void;
}

function validateUrl(raw: string): { valid: boolean; message: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { valid: false, message: "" };
  const stripped = trimmed.replace(/^https?:\/\//i, "").replace(/^\/\//, "");
  const domainRegex =
    /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(\/.*)?$/;
  if (!domainRegex.test(stripped))
    return {
      valid: false,
      message: "INVALID TARGET — ENTER A VALID DOMAIN (e.g. example.com)",
    };
  if (/^localhost/.test(stripped) || /^\d{1,3}(\.\d{1,3}){3}/.test(stripped))
    return { valid: false, message: "INVALID TARGET — PUBLIC DOMAIN REQUIRED" };
  return { valid: true, message: "" };
}

const FULL_TEXT = "INITIALIZE AUTONOMOUS DEBUGGING VIA PLAYWRIGHT";
const RESTART_DELAY = 10000;
const CHAR_DELAY = 26;

const ParticleOrb: FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = 500,
      H = 500;
    canvas.width = W;
    canvas.height = H;
    const cx = W / 2,
      cy = H / 2;
    type P = {
      angle: number;
      radius: number;
      speed: number;
      size: number;
      opacity: number;
      trail: { x: number; y: number }[];
      ring: number;
    };
    // Four orbital rings: micro core, inner, mid, outer halo
    const ringDefs = [
      {
        count: 35,
        rMin: 8,
        rMax: 35,
        sMin: 0.006,
        sMax: 0.015,
        szMin: 0.6,
        szMax: 1.3,
        oMin: 0.4,
        oMax: 0.85,
      }, // micro core
      {
        count: 75,
        rMin: 38,
        rMax: 88,
        sMin: 0.004,
        sMax: 0.011,
        szMin: 0.7,
        szMax: 1.6,
        oMin: 0.45,
        oMax: 0.95,
      }, // inner
      {
        count: 100,
        rMin: 92,
        rMax: 148,
        sMin: 0.003,
        sMax: 0.007,
        szMin: 0.8,
        szMax: 2.0,
        oMin: 0.5,
        oMax: 1.0,
      }, // mid
      {
        count: 55,
        rMin: 152,
        rMax: 195,
        sMin: 0.002,
        sMax: 0.005,
        szMin: 0.5,
        szMax: 1.3,
        oMin: 0.25,
        oMax: 0.65,
      }, // outer
    ];
    const pts: P[] = ringDefs.flatMap((r, ri) =>
      Array.from({ length: r.count }, (_, i) => ({
        angle: (i / r.count) * Math.PI * 2 + Math.random() * 0.6,
        radius: r.rMin + Math.random() * (r.rMax - r.rMin),
        speed:
          (r.sMin + Math.random() * (r.sMax - r.sMin)) *
          (Math.random() > 0.5 ? 1 : -1),
        size: r.szMin + Math.random() * (r.szMax - r.szMin),
        opacity: r.oMin + Math.random() * (r.oMax - r.oMin),
        trail: [],
        ring: ri,
      })),
    );
    let t = 0,
      af: number;
    const draw = () => {
      t += 0.009;
      ctx.clearRect(0, 0, W, H);
      const b = 0.5 + 0.5 * Math.sin(t * 0.6);
      // Glow rings — 7 rings spanning micro core to outer halo
      [195, 168, 140, 110, 82, 55, 28].forEach((r, ri) => {
        const alpha = 0.14 - ri * 0.012 + b * 0.07;
        ctx.strokeStyle = `rgba(0,245,255,${Math.max(0.02, alpha)})`;
        ctx.lineWidth = ri < 2 ? 0.8 : 0.5;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      });
      // Particles
      pts.forEach((p) => {
        p.angle += p.speed + Math.sin(t + p.radius * 0.05) * 0.001;
        const warpAmt =
          p.ring === 0
            ? 0.15
            : p.ring === 1
              ? 0.12
              : p.ring === 2
                ? 0.07
                : 0.04;
        const warp = 1 + warpAmt * Math.sin(t * 1.2 + p.angle * 2.5);
        const ellipse =
          p.ring === 0
            ? 0.92
            : p.ring === 1
              ? 0.88
              : p.ring === 2
                ? 0.82
                : 0.76;
        const x = cx + Math.cos(p.angle) * p.radius * warp;
        const y = cy + Math.sin(p.angle) * p.radius * warp * ellipse;
        const trailLen = p.ring === 0 ? 5 : 7;
        p.trail.push({ x, y });
        if (p.trail.length > trailLen) p.trail.shift();
        // Trail
        p.trail.forEach((pt, i) => {
          if (i === 0) return;
          const prev = p.trail[i - 1];
          ctx.beginPath();
          ctx.strokeStyle = `rgba(0,245,255,${(i / p.trail.length) * p.opacity * 0.45})`;
          ctx.lineWidth = p.size * 0.4;
          ctx.moveTo(prev.x, prev.y);
          ctx.lineTo(pt.x, pt.y);
          ctx.stroke();
        });
        // Glow dot — larger radius and brighter
        const glowR = p.size * 5;
        const gw = ctx.createRadialGradient(x, y, 0, x, y, glowR);
        gw.addColorStop(0, `rgba(0,245,255,${p.opacity})`);
        gw.addColorStop(1, "rgba(0,245,255,0)");
        ctx.fillStyle = gw;
        ctx.beginPath();
        ctx.arc(x, y, glowR, 0, Math.PI * 2);
        ctx.fill();
        // Bright white hot core
        ctx.fillStyle = `rgba(255,255,255,${p.opacity})`;
        ctx.beginPath();
        ctx.arc(x, y, p.size * 0.65, 0, Math.PI * 2);
        ctx.fill();
      });
      // Center pulse — larger, brighter
      const pg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 18 + b * 10);
      pg.addColorStop(0, `rgba(255,255,255,${0.9 + b * 0.1})`);
      pg.addColorStop(0.3, `rgba(0,245,255,${0.85 + b * 0.15})`);
      pg.addColorStop(1, "rgba(0,245,255,0)");
      ctx.fillStyle = pg;
      ctx.beginPath();
      ctx.arc(cx, cy, 22 + b * 10, 0, Math.PI * 2);
      ctx.fill();
      // Cross hairs
      const ca = 0.12 + b * 0.18;
      ctx.strokeStyle = `rgba(0,245,255,${ca})`;
      ctx.lineWidth = 0.5;
      [-24, -12, 12, 24].forEach((o) => {
        ctx.beginPath();
        ctx.moveTo(cx + o, cy - 4);
        ctx.lineTo(cx + o, cy + 4);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx - 4, cy + o);
        ctx.lineTo(cx + 4, cy + o);
        ctx.stroke();
      });
      af = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(af);
  }, []);
  return (
    <canvas
      ref={canvasRef}
      style={{
        width: 340,
        height: 340,
        opacity: 0.97,
        animation: "orbFloat 9s ease-in-out infinite",
      }}
    />
  );
};

const ProtocolCard: FC<{
  n: string;
  icon: string;
  title: string;
  body: string;
  delay: number;
  mounted: boolean;
}> = ({ n, icon, title, body, delay, mounted }) => {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "6px",
        padding: "22px 20px",
        border: `1px solid ${hov ? "rgba(0,245,255,0.22)" : "rgba(0,245,255,0.07)"}`,
        background: hov ? "rgba(0,245,255,0.03)" : "rgba(255,255,255,0.016)",
        transform: mounted
          ? hov
            ? "translateY(-5px)"
            : "translateY(0)"
          : "translateY(18px)",
        opacity: mounted ? 1 : 0,
        transition: `opacity 0.75s cubic-bezier(0.16,1,0.3,1) ${delay}ms,transform 0.75s cubic-bezier(0.16,1,0.3,1) ${delay}ms,border-color 0.2s,background 0.2s`,
        boxShadow: hov
          ? "0 12px 48px rgba(0,0,0,0.6),0 0 24px rgba(0,245,255,0.06)"
          : "none",
        cursor: "default",
      }}
    >
      {hov && <div className="scan-sweep" />}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 36,
          height: 36,
          borderTop: `1px solid ${hov ? "rgba(0,245,255,0.45)" : "rgba(0,245,255,0.15)"}`,
          borderLeft: `1px solid ${hov ? "rgba(0,245,255,0.45)" : "rgba(0,245,255,0.15)"}`,
          transition: "border-color 0.2s",
        }}
      />
      <div
        style={{
          fontFamily: "'Share Tech Mono',monospace",
          fontSize: "8px",
          color: "rgba(0,245,255,0.35)",
          letterSpacing: "0.2em",
          marginBottom: "10px",
        }}
      >
        {n}
      </div>
      <div
        style={{
          fontSize: "20px",
          marginBottom: "10px",
          color: hov ? "#00F5FF" : "rgba(0,245,255,0.45)",
          textShadow: hov ? "0 0 20px rgba(0,245,255,0.7)" : "none",
          transition: "all 0.2s",
        }}
      >
        {icon}
      </div>
      <div
        style={{
          fontFamily: "'Orbitron',monospace",
          fontSize: "11px",
          fontWeight: 700,
          color: hov ? "#fff" : "rgba(255,255,255,0.65)",
          letterSpacing: "0.08em",
          marginBottom: "10px",
          transition: "color 0.2s",
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontFamily: "'Exo 2',sans-serif",
          fontSize: "12px",
          lineHeight: 1.7,
          color: hov ? "#5a6a7a" : "#2f3f4f",
        }}
      >
        {body}
      </div>
    </div>
  );
};

const HomePage: FC<HomePageProps> = ({ onScan }) => {
  const [url, setUrl] = useState("");
  const [focused, setFocused] = useState(false);
  const [hovBtn, setHovBtn] = useState(false);
  const [glitchTitle, setGlitchTitle] = useState(false);
  const [glitchBtn, setGlitchBtn] = useState(false);
  const [typeText, setTypeText] = useState("");
  const [urlError, setUrlError] = useState("");
  const [urlTouched, setUrlTouched] = useState(false);
  const [mounted, setMounted] = useState(false);
  const typeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restartRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  const startTypewriter = () => {
    if (typeRef.current) clearTimeout(typeRef.current);
    if (restartRef.current) clearTimeout(restartRef.current);
    setTypeText("");
    let i = 0;
    const tick = () => {
      i++;
      setTypeText(FULL_TEXT.slice(0, i));
      if (i < FULL_TEXT.length) typeRef.current = setTimeout(tick, CHAR_DELAY);
      else restartRef.current = setTimeout(startTypewriter, RESTART_DELAY);
    };
    typeRef.current = setTimeout(tick, CHAR_DELAY);
  };
  useEffect(() => {
    const d = setTimeout(startTypewriter, 800);
    return () => {
      clearTimeout(d);
      if (typeRef.current) clearTimeout(typeRef.current);
      if (restartRef.current) clearTimeout(restartRef.current);
    };
  }, []); // eslint-disable-line
  useEffect(() => {
    const id = setInterval(() => {
      setGlitchTitle(true);
      setTimeout(() => setGlitchTitle(false), 130);
    }, 7000);
    return () => clearInterval(id);
  }, []);

  const triggerGlitch = (cb?: () => void) => {
    setGlitchTitle(true);
    setGlitchBtn(true);
    setTimeout(() => {
      setGlitchTitle(false);
      setGlitchBtn(false);
      cb?.();
    }, 120);
  };
  const sanitise = (raw: string) =>
    raw.replace(/^https?:\/\//i, "").replace(/^\/\//, "");
  const handleChange = (raw: string) => {
    const c = sanitise(raw);
    setUrl(c);
    if (urlTouched) setUrlError(validateUrl(c).message);
  };
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const c = sanitise(e.clipboardData.getData("text"));
    setUrl(c);
    setUrlTouched(true);
    setUrlError(validateUrl(c).message);
  };
  const handle = () => {
    const c = url.trim();
    setUrlTouched(true);
    const { valid, message } = validateUrl(c);
    if (!valid) {
      setUrlError(message || "INVALID TARGET");
      return;
    }
    setUrlError("");
    triggerGlitch(() => onScan(`https://${c}`));
  };

  const hasError = urlTouched && !!urlError;
  const isValid = urlTouched && !urlError && url.trim().length > 0;
  const borderCol = hasError
    ? "rgba(255,0,64,0.6)"
    : isValid
      ? "rgba(0,255,136,0.5)"
      : focused
        ? "rgba(0,245,255,0.5)"
        : "rgba(0,245,255,0.12)";
  const glowShadow = hasError
    ? "0 0 0 1px rgba(255,0,64,0.3),0 0 40px rgba(255,0,64,0.1)"
    : isValid
      ? "0 0 0 1px rgba(0,255,136,0.25),0 0 40px rgba(0,255,136,0.08)"
      : "0 0 0 1px rgba(0,245,255,0.3),0 0 40px rgba(0,245,255,0.1)";

  const rv = (delay: number): React.CSSProperties => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? "translateY(0)" : "translateY(22px)",
    transition: `opacity 0.85s cubic-bezier(0.16,1,0.3,1) ${delay}ms,transform 0.85s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
  });
  const ts: React.CSSProperties = {
    fontFamily: "'Orbitron',monospace",
    fontWeight: 900,
    fontSize: "clamp(42px,8vw,88px)",
    lineHeight: 0.92,
    letterSpacing: "-0.02em",
  };

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center px-6"
      style={{ zIndex: 2, paddingTop: "80px", paddingBottom: "60px" }}
    >
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        style={{ zIndex: 0 }}
      >
        <div
          style={{
            width: "900px",
            height: "900px",
            background:
              "radial-gradient(circle,rgba(0,245,255,0.028) 0%,transparent 65%)",
            animation: "orbFloat 14s ease-in-out infinite",
          }}
        />
      </div>

      <div
        className="relative w-full"
        style={{ maxWidth: "1040px", margin: "0 auto", zIndex: 1 }}
      >
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-20 mb-20">
          <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left">
            <div
              style={{
                ...rv(100),
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "28px",
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: 7,
                  height: 7,
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "50%",
                    background: "rgba(0,245,255,0.35)",
                    animation: "pulseRing 1.5s ease-out infinite",
                  }}
                />
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "#00F5FF",
                    boxShadow: "0 0 10px #00F5FF",
                  }}
                />
              </div>
              <span
                style={{
                  fontFamily: "'Share Tech Mono',monospace",
                  fontSize: "10px",
                  letterSpacing: "0.25em",
                  color: "rgba(0,245,255,0.65)",
                }}
              >
                AUTONOMOUS QA // AI-POWERED // v1.0.0
              </span>
            </div>

            <div
              style={{ ...rv(200), position: "relative", marginBottom: "20px" }}
            >
              {glitchTitle && (
                <>
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      ...ts,
                      color: "#FF0040",
                      opacity: 0.6,
                      transform: "translate(-4px,1px)",
                    }}
                  >
                    THE BugBot
                    <br />
                  </div>
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      ...ts,
                      color: "#00F5FF",
                      opacity: 0.4,
                      transform: "translate(4px,-1px)",
                    }}
                  >
                    THE BugBot
                    <br />
                  </div>
                </>
              )}
              <h1 style={{ ...ts, position: "relative", margin: 0 }}>
                <span style={{ color: "#fff" }}>THE </span>
                <span
                  style={{
                    color: "#00F5FF",
                    textShadow:
                      "0 0 30px rgba(0,245,255,0.7),0 0 80px rgba(0,245,255,0.3)",
                    animation: "heartbeat 2s ease-in-out infinite",
                  }}
                >
                  BugBot
                </span>
                <br />
                <span style={{ color: "#fff" }}></span>
              </h1>
            </div>

            <div
              style={{
                ...rv(320),
                fontFamily: "'Share Tech Mono',monospace",
                fontSize: "10px",
                letterSpacing: "0.18em",
                color: "rgba(0,245,255,0.5)",
                minHeight: "18px",
                marginBottom: "36px",
              }}
            >
              {typeText}
              <span className="cursor-blink" style={{ color: "#00F5FF" }}>
                █
              </span>
            </div>

            <div
              style={{
                ...rv(420),
                display: "flex",
                gap: "28px",
                marginBottom: "38px",
                alignItems: "center",
              }}
            >
              {[
                { v: "3", l: "AI AGENTS" },
                { v: "∞", l: "DOMAINS" },
                { v: "0s", l: "SETUP" },
              ].map((s, i) => (
                <div
                  key={s.l}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: i > 0 ? 0 : undefined,
                  }}
                >
                  {i > 0 && (
                    <div
                      style={{
                        width: 1,
                        height: 32,
                        background: "rgba(0,245,255,0.1)",
                        marginRight: "28px",
                      }}
                    />
                  )}
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontFamily: "'Orbitron',monospace",
                        fontWeight: 900,
                        fontSize: "20px",
                        color: "#00F5FF",
                        textShadow: "0 0 16px rgba(0,245,255,0.55)",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {s.v}
                    </div>
                    <div
                      style={{
                        fontFamily: "'Share Tech Mono',monospace",
                        fontSize: "7.5px",
                        letterSpacing: "0.18em",
                        color: "rgba(0,245,255,0.32)",
                        marginTop: "3px",
                      }}
                    >
                      {s.l}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ ...rv(520), width: "100%", maxWidth: "580px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  overflow: "hidden",
                  borderRadius: "4px",
                  border: `1px solid ${borderCol}`,
                  background: "rgba(0,245,255,0.022)",
                  boxShadow:
                    focused || hasError || isValid ? glowShadow : "none",
                  transition: "border-color 0.2s,box-shadow 0.2s",
                }}
              >
                <div
                  style={{
                    fontFamily: "'Share Tech Mono',monospace",
                    fontSize: "10px",
                    letterSpacing: "0.1em",
                    padding: "15px 16px",
                    borderRight: `1px solid ${focused ? "rgba(0,245,255,0.2)" : "rgba(0,245,255,0.06)"}`,
                    color: hasError
                      ? "rgba(255,0,64,0.7)"
                      : isValid
                        ? "rgba(0,255,136,0.7)"
                        : focused
                          ? "rgba(0,245,255,0.65)"
                          : "#2a2a2a",
                    flexShrink: 0,
                    transition: "color 0.2s",
                  }}
                >
                  TARGET://
                </div>
                <input
                  className="flex-1 bg-transparent outline-none"
                  style={{
                    fontFamily: "'Share Tech Mono',monospace",
                    fontSize: "12px",
                    color: "#fff",
                    letterSpacing: "0.04em",
                    padding: "15px 14px",
                  }}
                  placeholder="domain.com"
                  value={url}
                  onChange={(e) => handleChange(e.target.value)}
                  onPaste={handlePaste}
                  onFocus={() => setFocused(true)}
                  onBlur={() => {
                    setFocused(false);
                    if (url.trim()) {
                      setUrlTouched(true);
                      setUrlError(validateUrl(url).message);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handle();
                  }}
                />
                {urlTouched && url.trim() && (
                  <div
                    style={{
                      padding: "0 10px",
                      fontSize: "12px",
                      flexShrink: 0,
                    }}
                  >
                    {isValid ? (
                      <span
                        style={{
                          color: "#00FF88",
                          textShadow: "0 0 8px #00FF88",
                        }}
                      >
                        ✓
                      </span>
                    ) : (
                      <span style={{ color: "#FF0040" }}>✕</span>
                    )}
                  </div>
                )}
                <button
                  onClick={handle}
                  onMouseEnter={() => setHovBtn(true)}
                  onMouseLeave={() => setHovBtn(false)}
                  className="shrink-0 relative overflow-hidden flex items-center gap-2"
                  style={{
                    fontFamily: "'Orbitron',monospace",
                    fontWeight: 700,
                    fontSize: "10px",
                    letterSpacing: "0.1em",
                    padding: "15px 22px",
                    border: "none",
                    cursor: "pointer",
                    background: hovBtn ? "#00F5FF" : "rgba(0,245,255,0.9)",
                    color: "#050505",
                    boxShadow: hovBtn
                      ? "0 0 40px rgba(0,245,255,0.9),0 0 80px rgba(0,245,255,0.4)"
                      : "0 0 20px rgba(0,245,255,0.4)",
                    transition: "background 0.15s,box-shadow 0.15s",
                    animation: "heartbeat-btn 2s ease-in-out infinite",
                  }}
                >
                  {hovBtn && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.28) 50%,transparent 60%)",
                        animation: "shimmerSweep 0.55s ease forwards",
                      }}
                    />
                  )}
                  {glitchBtn && (
                    <span
                      className="pointer-events-none absolute inset-0 flex items-center justify-center"
                      style={{
                        fontFamily: "'Orbitron',monospace",
                        fontWeight: 700,
                        fontSize: "10px",
                        color: "#FF0040",
                        opacity: 0.8,
                      }}
                    >
                      LAUNCH
                    </span>
                  )}
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#050505"
                    strokeWidth="2.5"
                  >
                    <path d="M12 2L12 8M12 16L12 22M2 12L8 12M16 12L22 12" />
                    <circle cx="12" cy="12" r="3" />
                    <circle cx="4" cy="4" r="2" />
                    <circle cx="20" cy="4" r="2" />
                    <circle cx="4" cy="20" r="2" />
                    <circle cx="20" cy="20" r="2" />
                  </svg>
                  LAUNCH
                </button>
              </div>
              <div
                style={{
                  minHeight: "20px",
                  marginTop: "8px",
                  paddingLeft: "2px",
                }}
              >
                {hasError && (
                  <div
                    style={{
                      fontFamily: "'Share Tech Mono',monospace",
                      fontSize: "9px",
                      letterSpacing: "0.15em",
                      color: "#FF0040",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      animation: "fadeUp 0.2s ease both",
                    }}
                  >
                    <span style={{ opacity: 0.7 }}>⚠</span>
                    {urlError}
                  </div>
                )}
                {isValid && (
                  <div
                    style={{
                      fontFamily: "'Share Tech Mono',monospace",
                      fontSize: "9px",
                      letterSpacing: "0.15em",
                      color: "#00FF88",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      animation: "fadeUp 0.2s ease both",
                    }}
                  >
                    <span style={{ opacity: 0.7 }}>◈</span>TARGET LOCKED — READY
                    TO LAUNCH
                  </div>
                )}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "6px",
                marginTop: "20px",
              }}
            >
              {[
                "◈ BROKEN LINKS",
                "◎ FORM VALIDATION",
                "⬡ DEAD BUTTONS",
                "◈ HTTP ERRORS",
                "◎ SCREENSHOTS",
                "⬡ AI DIAGNOSIS",
              ].map((c, i) => (
                <span
                  key={c}
                  style={{
                    fontFamily: "'Share Tech Mono',monospace",
                    fontSize: "9px",
                    letterSpacing: "0.12em",
                    padding: "5px 11px",
                    border: "1px solid rgba(0,245,255,0.08)",
                    background: "rgba(0,245,255,0.018)",
                    color: "#3a4a5a",
                    borderRadius: "3px",
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? "translateY(0)" : "translateY(8px)",
                    transition: `all 0.55s cubic-bezier(0.16,1,0.3,1) ${640 + i * 55}ms`,
                  }}
                >
                  {c}
                </span>
              ))}
            </div>
          </div>

          <div
            style={{
              ...rv(150),
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ position: "relative" }}>
              <ParticleOrb />
              {(
                [
                  ["0", "auto", "auto", "0"],
                  ["0", "auto", "0", "auto"],
                  ["auto", "0", "auto", "0"],
                  ["auto", "0", "0", "auto"],
                ] as string[][]
              ).map(([t, b, r, l], i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    top: t === "auto" ? undefined : "-4px",
                    bottom: b === "auto" ? undefined : "-4px",
                    left: l === "auto" ? undefined : "-4px",
                    right: r === "auto" ? undefined : "-4px",
                    width: 18,
                    height: 18,
                    borderTop:
                      i < 2 ? "1px solid rgba(0,245,255,0.35)" : undefined,
                    borderBottom:
                      i >= 2 ? "1px solid rgba(0,245,255,0.35)" : undefined,
                    borderLeft:
                      i % 2 === 0
                        ? "1px solid rgba(0,245,255,0.35)"
                        : undefined,
                    borderRight:
                      i % 2 === 1
                        ? "1px solid rgba(0,245,255,0.35)"
                        : undefined,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div style={rv(700)}>
          <div
            style={{
              fontFamily: "'Share Tech Mono',monospace",
              fontSize: "9px",
              letterSpacing: "0.3em",
              color: "rgba(0,245,255,0.22)",
              textAlign: "center",
              marginBottom: "18px",
            }}
          >
            ── PROTOCOL SEQUENCE ──
          </div>
          <div
            className="grid grid-cols-1 md:grid-cols-3"
            style={{ gap: "12px" }}
          >
            {[
              {
                n: "01",
                icon: "◈",
                title: "SUBMIT TARGET",
                body: "Input any public domain. Zero credentials, zero config — instant entry into the QA nexus.",
              },
              {
                n: "02",
                icon: "◎",
                title: "AGENTS DEPLOY",
                body: "Crawler, Tester, and Explainer agents activate in sequence. Fully autonomous operation.",
              },
              {
                n: "03",
                icon: "⬡",
                title: "EXTRACT INTEL",
                body: "Complete anomaly dashboard with AI-synthesized remediation vectors for every issue.",
              },
            ].map((s, i) => (
              <ProtocolCard
                key={s.n}
                {...s}
                delay={780 + i * 90}
                mounted={mounted}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
