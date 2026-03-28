import { type FC, useEffect, useRef, useState } from "react";

interface HomePageProps {
  onScan: (url: string) => void;
}

const HomePage: FC<HomePageProps> = ({ onScan }) => {
  const [url, setUrl] = useState<string>("");
  const [focused, setFocused] = useState<boolean>(false);
  const [hovBtn, setHovBtn] = useState<boolean>(false);
  const [glitchTitle, setGlitchTitle] = useState(false);
  const [glitchBtn, setGlitchBtn] = useState(false);
  const [typeText, setTypeText] = useState("");
  const fullText = "INITIALIZE AUTONOMOUS DEBUGGING VIA QUANTUM TUNNELING";
  const typeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Typewriter for sub-header
  useEffect(() => {
    let i = 0;
    const tick = () => {
      i++;
      setTypeText(fullText.slice(0, i));
      if (i < fullText.length) typeRef.current = setTimeout(tick, 26);
    };
    const start = setTimeout(tick, 600);
    return () => { clearTimeout(start); if (typeRef.current) clearTimeout(typeRef.current); };
  }, []);

  // Periodic auto-glitch on title (every 7s)
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

  const handle = (): void => {
    const clean = url.trim();
    if (!clean) return;
    triggerGlitch(() => {
      onScan(clean.startsWith("http") ? clean : `https://${clean}`);
    });
  };

  const capabilities = [
    "◈ BROKEN LINKS", "◎ FORM VALIDATION", "⬡ DEAD BUTTONS",
    "◈ HTTP ERRORS", "◎ SCREENSHOTS", "⬡ AI DIAGNOSIS",
  ];

  const titleStyle: React.CSSProperties = {
    fontFamily: "'Orbitron', monospace",
    fontWeight: 900,
    fontSize: "clamp(46px, 9vw, 100px)",
    lineHeight: 0.95,
    letterSpacing: "-0.02em",
  };

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
        {/* RGB split R layer */}
        {glitchTitle && (
          <div className="pointer-events-none absolute inset-0" style={{ ...titleStyle, color: "#FF0040", opacity: 0.6, transform: "translate(-4px, 1px)" }}>
            <span>THE </span>BugBot<br /><span>GATE</span>
          </div>
        )}
        {/* RGB split B layer */}
        {glitchTitle && (
          <div className="pointer-events-none absolute inset-0" style={{ ...titleStyle, color: "#00F5FF", opacity: 0.4, transform: "translate(4px, -1px)" }}>
            <span>THE </span>BugBot<br /><span>GATE</span>
          </div>
        )}
        {/* Main title */}
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

      {/* Command input */}
      <div
        className="fade-up mb-4 w-full max-w-[680px] flex items-center rounded-[3px] overflow-hidden transition-all duration-300"
        style={{
          animationDelay: "0.4s",
          background: "rgba(0,245,255,0.025)",
          border: `1px solid ${focused ? "rgba(0,245,255,0.5)" : "rgba(0,245,255,0.12)"}`,
          boxShadow: focused ? "0 0 0 1px rgba(0,245,255,0.25), 0 0 50px rgba(0,245,255,0.08)" : "none",
          zIndex: 1,
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
            color: focused ? "rgba(0,245,255,0.65)" : "#2a2a2a",
            flexShrink: 0,
            transition: "all 0.2s",
          }}
        >
          TARGET://
        </div>

        <input
          className="flex-1 bg-transparent px-4 outline-none"
          style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: "12px",
            color: "#FFFFFF",
            letterSpacing: "0.04em",
            padding: "14px 16px",
          }}
          placeholder="ENTER TARGET DOMAIN OR SYSTEM ENDPOINT..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => { if (e.key === "Enter") handle(); }}
        />

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
          {/* RGB split on glitch */}
          {glitchBtn && (
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center"
              style={{ fontFamily: "'Orbitron', monospace", fontWeight: 700, fontSize: "10px", letterSpacing: "0.1em", color: "#FF0040", transform: "translate(-3px, 0)", opacity: 0.8 }}>
              LAUNCH AUTONOMOUS BOT
            </span>
          )}
          {/* Drone icon */}
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#050505" strokeWidth="2.5">
            <path d="M12 2L12 8M12 16L12 22M2 12L8 12M16 12L22 12"/>
            <circle cx="12" cy="12" r="3"/>
            <circle cx="4" cy="4" r="2"/><circle cx="20" cy="4" r="2"/>
            <circle cx="4" cy="20" r="2"/><circle cx="20" cy="20" r="2"/>
          </svg>
          LAUNCH AUTONOMOUS BOT
        </button>
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
