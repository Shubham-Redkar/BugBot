import { type FC } from "react";
import { type Phase } from "../../types";

interface NavBarProps {
  phase: Phase;
  onReset: () => void;
}

const NavBar: FC<NavBarProps> = ({ phase, onReset }) => {
  const phaseLabel: Record<Phase, string> = {
    home: "STANDBY",
    scanning: "SCANNING",
    results: "INTEL READY",
  };
  const phaseColor: Record<Phase, string> = {
    home: "#2a3a4a",
    scanning: "#00F5FF",
    results: "#00FF88",
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex h-[56px] items-center justify-between px-6"
      style={{
        background: "rgba(5,5,5,0.92)",
        borderBottom: "1px solid rgba(0,245,255,0.05)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      {/* Logo */}
      <button
        onClick={onReset}
        className="flex items-center gap-3 select-none border-none bg-transparent cursor-pointer"
        style={{ padding: 0 }}
      >
        <span
          style={{
            fontFamily: "'Orbitron', monospace",
            fontWeight: 900,
            fontSize: "17px",
            color: "#00F5FF",
            letterSpacing: "0.05em",
            textShadow:
              "0 0 20px rgba(0,245,255,0.55), 0 0 50px rgba(0,245,255,0.25)",
            animation: "heartbeat 2s ease-in-out infinite",
          }}
        >
          BugBot
        </span>
        <span
          style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: "8px",
            letterSpacing: "0.2em",
            color: "rgba(0,245,255,0.3)",
            marginTop: "2px",
          }}
        >
          QA//NEXUS
        </span>
      </button>

      {/* Phase status */}
      <div className="flex items-center gap-2">
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: phaseColor[phase],
            boxShadow: `0 0 8px ${phaseColor[phase]}, 0 0 18px ${phaseColor[phase]}44`,
            animation:
              phase === "scanning"
                ? "heartbeat-btn 0.8s ease-in-out infinite"
                : undefined,
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
