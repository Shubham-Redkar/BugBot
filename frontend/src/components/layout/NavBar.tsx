import { type FC, useState } from "react";
import { type Phase } from "../../types";

interface NavBarProps {
  phase: Phase;
  onReset: () => void;
}

const NavBar: FC<NavBarProps> = ({ phase, onReset }) => {
  const [glitching, setGlitching] = useState(false);

  const triggerGlitch = (cb?: () => void) => {
    setGlitching(true);
    setTimeout(() => {
      setGlitching(false);
      cb?.();
    }, 130);
  };

  const phaseLabel: Record<Phase, string> = {
    home: "STANDBY",
    scanning: "SCANNING",
    results: "INTEL READY",
  };
  const phaseColor: Record<Phase, string> = {
    home: "#333",
    scanning: "#00F5FF",
    results: "#00FF88",
  };

  const navLinks = ["CONTROL CENTER", "AGENT FLEET", "INTELLIGENCE LOGS"];

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex h-[60px] items-center justify-between px-6"
      style={{
        background: "rgba(5,5,5,0.94)",
        borderBottom: "1px solid rgba(0,245,255,0.06)",
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Logo */}
      <div
        className="relative flex cursor-pointer items-center gap-3 select-none"
        onClick={() => triggerGlitch(onReset)}
      >
        {/* RGB split glitch overlay */}
        {glitching && (
          <>
            <span
              className="pointer-events-none absolute"
              style={{
                fontFamily: "'Orbitron', monospace",
                fontWeight: 900,
                fontSize: "18px",
                color: "#FF0040",
                opacity: 0.7,
                transform: "translate(-3px, 0)",
                letterSpacing: "0.05em",
              }}
            >BugBot</span>
            <span
              className="pointer-events-none absolute"
              style={{
                fontFamily: "'Orbitron', monospace",
                fontWeight: 900,
                fontSize: "18px",
                color: "#00F5FF",
                opacity: 0.5,
                transform: "translate(3px, 0)",
                letterSpacing: "0.05em",
              }}
            >BugBot</span>
          </>
        )}
        <span
          style={{
            fontFamily: "'Orbitron', monospace",
            fontWeight: 900,
            fontSize: "18px",
            color: "#00F5FF",
            letterSpacing: "0.05em",
            textShadow: "0 0 20px rgba(0,245,255,0.6), 0 0 60px rgba(0,245,255,0.3)",
            animation: "heartbeat 2s ease-in-out infinite",
            opacity: glitching ? 0.6 : 1,
            transition: "opacity 0.05s",
          }}
        >
          BugBot
        </span>
        <span
          style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: "9px",
            letterSpacing: "0.2em",
            color: "rgba(0,245,255,0.35)",
            marginTop: "2px",
          }}
        >
          QA//NEXUS
        </span>
      </div>

      {/* Center nav links */}
      <div className="hidden items-center gap-8 md:flex">
        {navLinks.map((link) => (
          <button
            key={link}
            className="cursor-pointer border-none bg-transparent transition-all duration-200"
            style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: "9px",
              letterSpacing: "0.2em",
              color: "#2a2a2a",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.color = "rgba(0,245,255,0.55)";
              el.style.textShadow = "0 0 10px rgba(0,245,255,0.35)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.color = "#2a2a2a";
              el.style.textShadow = "none";
            }}
            onClick={() => triggerGlitch()}
          >
            {link}
          </button>
        ))}
      </div>

      {/* Phase status indicator */}
      <div className="flex items-center gap-[8px]">
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: phaseColor[phase],
            boxShadow: `0 0 8px ${phaseColor[phase]}, 0 0 20px ${phaseColor[phase]}44`,
            animation: phase === "scanning" ? "heartbeat-btn 0.8s ease-in-out infinite" : undefined,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: "9px",
            letterSpacing: "0.2em",
            color: phaseColor[phase],
          }}
        >
          {phaseLabel[phase]}
        </span>
      </div>
    </nav>
  );
};

export default NavBar;
