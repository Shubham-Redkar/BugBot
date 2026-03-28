import { type FC, useEffect, useRef, useState } from "react";

interface HomePageProps {
  onScan: (url: string) => void;
}

// Validate that the input looks like a real hostname/URL
function validateUrl(raw: string): { valid: boolean; message: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { valid: false, message: "" };

  // Strip any protocol the user may have typed manually before we validate
  const stripped = trimmed.replace(/^https?:\/\//i, "").replace(/^\/\//, "");

  // Must have at least one dot and a valid TLD-like segment
  const domainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(\/.*)?$/;
  if (!domainRegex.test(stripped)) {
    return { valid: false, message: "INVALID TARGET — ENTER A VALID DOMAIN (e.g. example.com)" };
  }

  // Block localhost / bare IPs as public targets
  if (/^localhost/.test(stripped) || /^\d{1,3}(\.\d{1,3}){3}/.test(stripped)) {
    return { valid: false, message: "INVALID TARGET — PUBLIC DOMAIN REQUIRED" };
  }

  return { valid: true, message: "" };
}

const FULL_TEXT = "INITIALIZE AUTONOMOUS DEBUGGING VIA QUANTUM TUNNELING";
const RESTART_DELAY = 15000; // 15 s before restarting typewriter
const CHAR_DELAY    = 26;    // ms per character

const HomePage: FC<HomePageProps> = ({ onScan }) => {
  const [url, setUrl]               = useState<string>("");
  const [focused, setFocused]       = useState<boolean>(false);
  const [hovBtn, setHovBtn]         = useState<boolean>(false);
  const [glitchTitle, setGlitchTitle] = useState(false);
  const [glitchBtn, setGlitchBtn]   = useState(false);
  const [typeText, setTypeText]     = useState("");
  const [urlError, setUrlError]     = useState<string>("");
  const [urlTouched, setUrlTouched] = useState<boolean>(false);

  const typeRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restartRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Looping typewriter ──────────────────────────────────────────────────
  const startTypewriter = () => {
    // Clear any in-flight timers
    if (typeRef.current)    clearTimeout(typeRef.current);
    if (restartRef.current) clearTimeout(restartRef.current);

    setTypeText("");
    let i = 0;

    const tick = () => {
      i++;
      setTypeText(FULL_TEXT.slice(0, i));
      if (i < FULL_TEXT.length) {
        typeRef.current = setTimeout(tick, CHAR_DELAY);
      } else {
        // Full text shown — wait RESTART_DELAY then loop
        restartRef.current = setTimeout(startTypewriter, RESTART_DELAY);
      }
    };

    typeRef.current = setTimeout(tick, CHAR_DELAY);
  };

  useEffect(() => {
    const initDelay = setTimeout(startTypewriter, 600);
    return () => {
      clearTimeout(initDelay);
      if (typeRef.current)    clearTimeout(typeRef.current);
      if (restartRef.current) clearTimeout(restartRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Periodic title glitch every 7s ─────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      setGlitchTitle(true);
      setTimeout(() => setGlitchTitle(false), 130);
    }, 7000);
    return () => clearInterval(id);
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────
  const triggerGlitch = (cb?: () => void) => {
    setGlitchTitle(true);
    setGlitchBtn(true);
    setTimeout(() => {
      setGlitchTitle(false);
      setGlitchBtn(false);
      cb?.();
    }, 120);
  };

  // Strip https:// (or http://) prefix from pasted / typed value
  const sanitiseInput = (raw: string): string =>
    raw.replace(/^https?:\/\//i, "").replace(/^\/\//, "");

  const handleChange = (raw: string) => {
    const clean = sanitiseInput(raw);
    setUrl(clean);
    if (urlTouched) {
      const { message } = validateUrl(clean);
      setUrlError(message);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text");
    const clean  = sanitiseInput(pasted);
    setUrl(clean);
    setUrlTouched(true);
    const { message } = validateUrl(clean);
    setUrlError(message);
  };

  const handle = (): void => {
    const clean = url.trim();
    setUrlTouched(true);
    const { valid, message } = validateUrl(clean);
    if (!valid) {
      setUrlError(message || "INVALID TARGET — ENTER A VALID DOMAIN");
      return;
    }
    setUrlError("");
    triggerGlitch(() => {
      onScan(`https://${clean}`);
    });
  };

  const capabilities = [
    "◈ BROKEN LINKS", "◎ FORM VALIDATION", "⬡ DEAD BUTTONS",
    "◈ HTTP ERRORS",  "◎ SCREENSHOTS",     "⬡ AI DIAGNOSIS",
  ];

  const titleStyle: React.CSSProperties = {
    fontFamily: "'Orbitron', monospace",
    fontWeight: 900,
    fontSize: "clamp(46px, 9vw, 100px)",
    lineHeight: 0.95,
    letterSpacing: "-0.02em",
  };

  const hasError  = urlTouched && !!urlError;
  const isValid   = urlTouched && !urlError && url.trim().length > 0;
  const borderCol = hasError
    ? "rgba(255,0,64,0.6)"
    : isValid
    ? "rgba(0,255,136,0.5)"
    : focused
    ? "rgba(0,245,255,0.5)"
    : "rgba(0,245,255,0.12)";
  const glowShadow = hasError
    ? "0 0 0 1px rgba(255,0,64,0.25), 0 0 50px rgba(255,0,64,0.08)"
    : isValid
    ? "0 0 0 1px rgba(0,255,136,0.2), 0 0 50px rgba(0,255,136,0.06)"
    : focused
    ? "0 0 0 1px rgba(0,245,255,0.25), 0 0 50px rgba(0,245,255,0.08)"
    : "none";

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-[80px] pb-[80px]"
      style={{ zIndex: 2 }}
    >
      {/* Radial bloom */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: "900px", height: "900px",
          background: "radial-gradient(circle, rgba(0,245,255,0.035) 0%, transparent 60%)",
        }}
      />

      {/* Eyebrow badge */}
      <div className="fade-up mb-6 flex items-center gap-2 select-none" style={{ animationDelay: "0.1s", zIndex: 1 }}>
        <div className="relative flex h-[7px] w-[7px]">
          <div className="pulse-ring absolute inset-0 rounded-full" style={{ background: "rgba(0,245,255,0.4)" }} />
          <div className="h-[7px] w-[7px] rounded-full" style={{ background: "#00F5FF", boxShadow: "0 0 10px #00F5FF" }} />
        </div>
        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "10px", letterSpacing: "0.25em", color: "rgba(0,245,255,0.65)" }}>
          AUTONOMOUS QA // AI-POWERED // v2.4.1
        </span>
      </div>

      {/* Hero title */}
      <div
        className="fade-up relative mb-2 text-center select-none"
        style={{ animationDelay: "0.2s", zIndex: 1 }}
      >
        {glitchTitle && (
          <div className="pointer-events-none absolute inset-0" style={{ ...titleStyle, color: "#FF0040", opacity: 0.6, transform: "translate(-4px, 1px)" }}>
            <span>THE </span>BugBot<br /><span>GATE</span>
          </div>
        )}
        {glitchTitle && (
          <div className="pointer-events-none absolute inset-0" style={{ ...titleStyle, color: "#00F5FF", opacity: 0.4, transform: "translate(4px, -1px)" }}>
            <span>THE </span>BugBot<br /><span>GATE</span>
          </div>
        )}
        <h1 style={{ ...titleStyle, position: "relative" }}>
          <span style={{ color: "#FFFFFF" }}>THE </span>
          <span style={{
            color: "#00F5FF",
            textShadow: "0 0 20px rgba(0,245,255,0.6), 0 0 60px rgba(0,245,255,0.3), 0 0 120px rgba(0,245,255,0.1)",
            animation: "heartbeat 2s ease-in-out infinite",
          }}>BugBot</span>
          <br />
          <span style={{ color: "#FFFFFF" }}>GATE</span>
        </h1>
      </div>

      {/* Typewriter sub-header */}
      <div
        className="fade-up mb-10"
        style={{
          animationDelay: "0.3s",
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: "10px",
          letterSpacing: "0.2em",
          color: "rgba(0,245,255,0.45)",
          zIndex: 1,
          minHeight: "18px",
          textAlign: "center",
        }}
      >
        {typeText}
        <span className="cursor-blink" style={{ color: "#00F5FF" }}>█</span>
      </div>

      {/* Command input + validation wrapper */}
      <div className="fade-up mb-1 w-full max-w-[680px]" style={{ animationDelay: "0.4s", zIndex: 1 }}>
        <div
          className="flex items-center rounded-[3px] overflow-hidden transition-all duration-300"
          style={{
            background: "rgba(0,245,255,0.025)",
            border: `1px solid ${borderCol}`,
            boxShadow: (focused || hasError || isValid) ? glowShadow : "none",
          }}
        >
          {/* Prefix label */}
          <div
            style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: "10px",
              letterSpacing: "0.1em",
              padding: "14px 16px",
              borderRight: `1px solid ${focused ? "rgba(0,245,255,0.2)" : "rgba(0,245,255,0.06)"}`,
              color: hasError
                ? "rgba(255,0,64,0.7)"
                : isValid
                ? "rgba(0,255,136,0.7)"
                : focused
                ? "rgba(0,245,255,0.65)"
                : "#2a2a2a",
              flexShrink: 0,
              transition: "all 0.2s",
            }}
          >
            TARGET://
          </div>

          <input
            className="flex-1 bg-transparent outline-none"
            style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: "12px",
              color: "#FFFFFF",
              letterSpacing: "0.04em",
              padding: "14px 16px",
            }}
            placeholder="ENTER TARGET DOMAIN OR SYSTEM ENDPOINT..."
            value={url}
            onChange={(e) => handleChange(e.target.value)}
            onPaste={handlePaste}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              setFocused(false);
              if (url.trim()) {
                setUrlTouched(true);
                const { message } = validateUrl(url);
                setUrlError(message);
              }
            }}
            onKeyDown={(e) => { if (e.key === "Enter") handle(); }}
          />

          {/* Validation status icon inside input */}
          {urlTouched && url.trim() && (
            <div style={{ padding: "0 12px", flexShrink: 0, fontSize: "12px" }}>
              {isValid
                ? <span style={{ color: "#00FF88", textShadow: "0 0 8px #00FF88" }}>✓</span>
                : <span style={{ color: "#FF0040", textShadow: "0 0 8px rgba(255,0,64,0.8)" }}>✕</span>
              }
            </div>
          )}

          {/* LAUNCH button */}
          <button
            onClick={handle}
            onMouseEnter={() => setHovBtn(true)}
            onMouseLeave={() => setHovBtn(false)}
            className="shrink-0 flex items-center gap-[8px] cursor-pointer border-none transition-all duration-150 relative overflow-hidden"
            style={{
              fontFamily: "'Orbitron', monospace",
              fontWeight: 700,
              fontSize: "10px",
              letterSpacing: "0.1em",
              padding: "14px 24px",
              background: hovBtn ? "#00F5FF" : "rgba(0,245,255,0.88)",
              color: "#050505",
              boxShadow: hovBtn
                ? "0 0 40px rgba(0,245,255,0.9), 0 0 100px rgba(0,245,255,0.4), 0 0 160px rgba(0,245,255,0.15)"
                : "0 0 20px rgba(0,245,255,0.5), 0 0 60px rgba(0,245,255,0.2)",
              animation: "heartbeat-btn 2s ease-in-out infinite",
            }}
          >
            {glitchBtn && (
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center"
                style={{ fontFamily: "'Orbitron', monospace", fontWeight: 700, fontSize: "10px", letterSpacing: "0.1em", color: "#FF0040", transform: "translate(-3px, 0)", opacity: 0.8 }}>
                LAUNCH AUTONOMOUS BOT
              </span>
            )}
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#050505" strokeWidth="2.5">
              <path d="M12 2L12 8M12 16L12 22M2 12L8 12M16 12L22 12"/>
              <circle cx="12" cy="12" r="3"/>
              <circle cx="4" cy="4" r="2"/><circle cx="20" cy="4" r="2"/>
              <circle cx="4" cy="20" r="2"/><circle cx="20" cy="20" r="2"/>
            </svg>
            LAUNCH AUTONOMOUS BOT
          </button>
        </div>

        {/* Validation error / success message */}
        <div style={{ minHeight: "20px", marginTop: "6px", paddingLeft: "4px" }}>
          {hasError && (
            <div
              style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: "9px",
                letterSpacing: "0.15em",
                color: "#FF0040",
                textShadow: "0 0 8px rgba(255,0,64,0.5)",
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
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: "9px",
                letterSpacing: "0.15em",
                color: "#00FF88",
                textShadow: "0 0 8px rgba(0,255,136,0.4)",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                animation: "fadeUp 0.2s ease both",
              }}
            >
              <span style={{ opacity: 0.7 }}>◈</span>
              TARGET LOCKED — READY TO LAUNCH
            </div>
          )}
        </div>
      </div>

      {/* Capability tags */}
      <div className="fade-up mb-16 flex flex-wrap justify-center gap-[6px]" style={{ animationDelay: "0.5s", zIndex: 1 }}>
        {capabilities.map((c) => (
          <span
            key={c}
            style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: "9px",
              letterSpacing: "0.12em",
              padding: "5px 12px",
              border: "1px solid rgba(0,245,255,0.07)",
              background: "rgba(0,245,255,0.015)",
              color: "#2a2a2a",
              borderRadius: "2px",
            }}
          >
            {c}
          </span>
        ))}
      </div>

      {/* Protocol sequence */}
      <div className="fade-up w-full max-w-[740px]" style={{ animationDelay: "0.6s", zIndex: 1 }}>
        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "9px", letterSpacing: "0.25em", color: "#222", marginBottom: "16px", textAlign: "center" }}>
          — PROTOCOL SEQUENCE —
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {[
            { n: "01", title: "SUBMIT TARGET", body: "Input any public domain. No credentials, no config, zero friction entry point to the QA nexus." },
            { n: "02", title: "AGENTS DEPLOY", body: "Crawler, Tester, and Explainer agents activate in sequence. Full autonomous operation initiated." },
            { n: "03", title: "EXTRACT INTEL", body: "Complete anomaly dashboard with AI-synthesized remediation vectors for every detected issue." },
          ].map((s) => (
            <div
              key={s.n}
              className="relative overflow-hidden p-5"
              style={{
                border: "1px solid rgba(0,245,255,0.07)",
                background: "rgba(0,245,255,0.018)",
                borderRadius: "3px",
              }}
            >
              <div className="scan-sweep" />
              <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "9px", color: "rgba(0,245,255,0.45)", letterSpacing: "0.15em", marginBottom: "8px" }}>
                {s.n}
              </div>
              <div style={{ fontFamily: "'Orbitron', monospace", fontSize: "11px", fontWeight: 700, color: "#FFFFFF", letterSpacing: "0.08em", marginBottom: "8px" }}>
                {s.title}
              </div>
              <div style={{ fontFamily: "'Exo 2', sans-serif", fontSize: "12px", lineHeight: 1.65, color: "#383838" }}>
                {s.body}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
