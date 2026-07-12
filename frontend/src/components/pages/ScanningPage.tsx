import { type FC, useEffect, useRef, useState } from "react";
import { AGENT_STEPS } from "../../lib/constants";
import { type LogLine } from "../../types";

interface ScanningPageProps {
  activeStep: number;
  doneSteps: number[];
  logLines: LogLine[];
  scannedUrl: string;
}

// ── Circular progress ring ────────────────────────────────────────────────────
const CircularProgress: FC<{ progress: number }> = ({ progress }) => {
  const R = 54;
  const C = 2 * Math.PI * R;
  const offset = C - (progress / 100) * C;
  return (
    <div
      style={{ position: "relative", width: 140, height: 140, flexShrink: 0 }}
    >
      <svg
        width="140"
        height="140"
        viewBox="0 0 140 140"
        style={{ transform: "rotate(-90deg)" }}
      >
        {/* Track */}
        <circle
          cx="70"
          cy="70"
          r={R}
          fill="none"
          stroke="rgba(0,245,255,0.06)"
          strokeWidth="3"
        />
        {/* Progress */}
        <circle
          cx="70"
          cy="70"
          r={R}
          fill="none"
          stroke="#00F5FF"
          strokeWidth="3"
          strokeDasharray={C}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            filter: "drop-shadow(0 0 6px rgba(0,245,255,0.8))",
            transition: "stroke-dashoffset 0.5s ease",
          }}
        />
        {/* Secondary dim ring */}
        <circle
          cx="70"
          cy="70"
          r="44"
          fill="none"
          stroke="rgba(0,245,255,0.04)"
          strokeWidth="1"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontFamily: "'Orbitron',monospace",
            fontWeight: 900,
            fontSize: "26px",
            color: "#00F5FF",
            textShadow: "0 0 20px rgba(0,245,255,0.7)",
            lineHeight: 1,
          }}
        >
          {progress}
        </div>
        <div
          style={{
            fontFamily: "'Share Tech Mono',monospace",
            fontSize: "8px",
            letterSpacing: "0.2em",
            color: "rgba(0,245,255,0.45)",
            marginTop: "3px",
          }}
        >
          %
        </div>
      </div>
      {/* Rotating indicator dot */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          animation: "rotateDot 3s linear infinite",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "8px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "5px",
            height: "5px",
            borderRadius: "50%",
            background: "#00F5FF",
            boxShadow: "0 0 8px #00F5FF",
          }}
        />
      </div>
    </div>
  );
};

// ── Agent step row ────────────────────────────────────────────────────────────
const AgentStep: FC<{
  step: (typeof AGENT_STEPS)[0];
  index: number;
  isActive: boolean;
  isDone: boolean;
}> = ({ step, index, isActive, isDone }) => {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="relative overflow-hidden flex items-center gap-4 px-5 py-4"
      style={{
        borderRadius: "6px",
        border: `1px solid ${isActive ? "rgba(0,245,255,0.35)" : isDone ? "rgba(0,245,255,0.12)" : "rgba(255,255,255,0.04)"}`,
        background: isActive
          ? "rgba(0,245,255,0.05)"
          : isDone
            ? "rgba(0,245,255,0.018)"
            : "rgba(255,255,255,0.008)",
        animation: `fadeUp 0.45s ${index * 0.12}s ease both`,
        opacity: 0,
        transition: "border-color 0.3s, background 0.3s",
        boxShadow: isActive
          ? "0 0 30px rgba(0,245,255,0.06),inset 0 0 30px rgba(0,245,255,0.02)"
          : "none",
      }}
    >
      {isActive && <div className="scan-sweep" />}

      {/* Step number */}
      <div
        style={{
          fontFamily: "'Share Tech Mono',monospace",
          fontSize: "9px",
          color: "rgba(0,245,255,0.2)",
          letterSpacing: "0.1em",
          flexShrink: 0,
          width: "20px",
        }}
      >
        {String(index + 1).padStart(2, "0")}
      </div>

      {/* Icon box */}
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 46,
          height: 46,
          borderRadius: "8px",
          flexShrink: 0,
          fontSize: "20px",
          border: `1px solid ${isActive ? "rgba(0,245,255,0.35)" : isDone ? "rgba(0,245,255,0.12)" : "rgba(255,255,255,0.05)"}`,
          background: isActive
            ? "rgba(0,245,255,0.1)"
            : isDone
              ? "rgba(0,245,255,0.04)"
              : "rgba(255,255,255,0.02)",
          color: isActive
            ? "#00F5FF"
            : isDone
              ? "rgba(0,245,255,0.5)"
              : "#2a2a2a",
          boxShadow: isActive ? "0 0 24px rgba(0,245,255,0.25)" : "none",
          transition: "all 0.3s",
        }}
      >
        {step.icon}
        {isActive && (
          <div
            style={{
              position: "absolute",
              inset: "-3px",
              borderRadius: "10px",
              border: "1px solid rgba(0,245,255,0.4)",
              animation: "pulseRing 1.5s ease-out infinite",
            }}
          />
        )}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: "'Orbitron',monospace",
            fontSize: "11px",
            letterSpacing: "0.1em",
            color: isDone || isActive ? "#fff" : "#2a2a2a",
            marginBottom: "4px",
            transition: "color 0.3s",
          }}
        >
          {step.label}
        </div>
        <div
          style={{
            fontFamily: "'Share Tech Mono',monospace",
            fontSize: "9px",
            letterSpacing: "0.1em",
            color: isActive
              ? "rgba(0,245,255,0.65)"
              : isDone
                ? "rgba(0,245,255,0.35)"
                : "#1a1a1a",
            transition: "color 0.3s",
          }}
        >
          {isDone
            ? "✓ COMPLETE — SIGNAL NOMINAL"
            : isActive
              ? step.sub
              : "STANDBY..."}
        </div>
      </div>

      {/* Status pill */}
      <div
        style={{
          fontFamily: "'Share Tech Mono',monospace",
          fontSize: "8px",
          letterSpacing: "0.15em",
          padding: "4px 12px",
          borderRadius: "20px",
          flexShrink: 0,
          border: `1px solid ${isActive ? "rgba(0,245,255,0.4)" : isDone ? "rgba(0,245,255,0.15)" : "rgba(255,255,255,0.04)"}`,
          background: isActive
            ? "rgba(0,245,255,0.1)"
            : isDone
              ? "rgba(0,245,255,0.04)"
              : "transparent",
          color: isActive
            ? "#00F5FF"
            : isDone
              ? "rgba(0,245,255,0.55)"
              : "#1a1a1a",
          boxShadow: isActive ? "0 0 12px rgba(0,245,255,0.25)" : "none",
          transition: "all 0.3s",
        }}
      >
        {isActive ? "● RUNNING" : isDone ? "✓ DONE" : "IDLE"}
      </div>
    </div>
  );
};

const ScanningPage: FC<ScanningPageProps> = ({
  activeStep,
  doneSteps,
  logLines,
  scannedUrl,
}) => {
  const logRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logLines]);

  const totalLogs = AGENT_STEPS.reduce((acc, s) => acc + s.logLines.length, 0);
  const progress = Math.min(
    100,
    Math.round((logLines.length / totalLogs) * 100),
  );

  const rv = (delay: number): React.CSSProperties => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? "translateY(0)" : "translateY(18px)",
    transition: `opacity 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}ms,transform 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
  });

  return (
    <div
      className="mx-auto max-w-[760px] px-6 pt-[100px] pb-[80px]"
      style={{ position: "relative", zIndex: 2 }}
    >
      {/* ── Header + circular progress ── */}
      <div
        style={{
          ...rv(80),
          display: "flex",
          alignItems: "center",
          gap: "32px",
          marginBottom: "40px",
        }}
      >
        <CircularProgress progress={progress} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: "'Share Tech Mono',monospace",
              fontSize: "9px",
              letterSpacing: "0.25em",
              color: "#00F5FF",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "10px",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#00F5FF",
                boxShadow: "0 0 8px #00F5FF",
                animation: "heartbeat-btn 0.9s ease-in-out infinite",
              }}
            />
            SCAN IN PROGRESS — AUTONOMOUS AGENTS ACTIVE
          </div>
          <h2
            style={{
              fontFamily: "'Orbitron',monospace",
              fontWeight: 900,
              fontSize: "clamp(14px,2.5vw,20px)",
              color: "#fff",
              letterSpacing: "0.02em",
              wordBreak: "break-all",
              margin: 0,
              marginBottom: "14px",
            }}
          >
            {scannedUrl}
          </h2>
          {/* Linear progress bar */}
          <div
            style={{
              height: "2px",
              borderRadius: "1px",
              background: "rgba(0,245,255,0.06)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progress}%`,
                background: "#00F5FF",
                boxShadow: "0 0 12px #00F5FF,0 0 30px rgba(0,245,255,0.4)",
                transition: "width 0.5s ease",
                borderRadius: "1px",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "6px",
            }}
          >
            <span
              style={{
                fontFamily: "'Share Tech Mono',monospace",
                fontSize: "8px",
                letterSpacing: "0.15em",
                color: "#222",
              }}
            >
              MISSION PROGRESS
            </span>
            <span
              style={{
                fontFamily: "'Share Tech Mono',monospace",
                fontSize: "8px",
                letterSpacing: "0.1em",
                color: "rgba(0,245,255,0.5)",
              }}
            >
              {doneSteps.length}/{AGENT_STEPS.length} AGENTS COMPLETE
            </span>
          </div>
        </div>
      </div>

      {/* ── Agent steps ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          marginBottom: "28px",
        }}
      >
        {AGENT_STEPS.map((step, i) => (
          <AgentStep
            key={step.id}
            step={step}
            index={i}
            isActive={activeStep === i}
            isDone={doneSteps.includes(i)}
          />
        ))}
      </div>

      {/* ── Terminal ── */}
      <div
        style={{
          ...rv(350),
          overflow: "hidden",
          borderRadius: "8px",
          border: "1px solid rgba(0,245,255,0.08)",
          background: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(4px)",
        }}
      >
        {/* Titlebar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 16px",
            borderBottom: "1px solid rgba(0,245,255,0.06)",
            background: "rgba(0,0,0,0.3)",
          }}
        >
          {[
            "rgba(255,0,64,0.65)",
            "rgba(255,180,0,0.65)",
            "rgba(0,245,255,0.45)",
          ].map((c) => (
            <span
              key={c}
              style={{
                display: "inline-block",
                width: 9,
                height: 9,
                borderRadius: "50%",
                background: c,
              }}
            />
          ))}
          <span
            style={{
              fontFamily: "'Share Tech Mono',monospace",
              fontSize: "9px",
              letterSpacing: "0.15em",
              color: "#2a2a2a",
              marginLeft: "8px",
            }}
          >
            bugbot:agent-log // ENCRYPTED STREAM
          </span>
          <div style={{ marginLeft: "auto", display: "flex", gap: "4px" }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: "24px",
                  height: "2px",
                  borderRadius: "1px",
                  background: `rgba(0,245,255,${0.08 + i * 0.06})`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Log area */}
        <div
          ref={logRef}
          style={{ height: "200px", overflowY: "auto", padding: "14px 16px" }}
        >
          {logLines.length === 0 ? (
            <div
              style={{
                fontFamily: "'Share Tech Mono',monospace",
                fontSize: "10px",
                color: "#1a1a1a",
              }}
            >
              AWAITING AGENT OUTPUT<span className="cursor-blink">_</span>
            </div>
          ) : (
            logLines.map((line, idx) => (
              <div
                key={line.id}
                className="log-line"
                style={{
                  fontFamily: "'Share Tech Mono',monospace",
                  fontSize: "10px",
                  lineHeight: 1.9,
                  display: "flex",
                  alignItems: "baseline",
                  gap: "8px",
                }}
              >
                <span
                  style={{
                    color:
                      idx === logLines.length - 1
                        ? "rgba(0,245,255,0.5)"
                        : "rgba(0,245,255,0.15)",
                    flexShrink: 0,
                  }}
                >
                  ›
                </span>
                <span
                  style={{
                    color: idx === logLines.length - 1 ? "#00F5FF" : "#252525",
                  }}
                >
                  {line.text}
                </span>
                {idx === logLines.length - 1 && (
                  <span className="cursor-blink" style={{ color: "#00F5FF" }}>
                    █
                  </span>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer status bar */}
        <div
          style={{
            padding: "8px 16px",
            borderTop: "1px solid rgba(0,245,255,0.05)",
            background: "rgba(0,0,0,0.2)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontFamily: "'Share Tech Mono',monospace",
              fontSize: "8px",
              color: "#1a1a1a",
              letterSpacing: "0.12em",
            }}
          >
            {logLines.length} EVENTS CAPTURED
          </span>
          <div style={{ display: "flex", gap: "12px" }}>
            {["TLS 1.3", "AES-256", "ACTIVE"].map((s, i) => (
              <span
                key={s}
                style={{
                  fontFamily: "'Share Tech Mono',monospace",
                  fontSize: "7px",
                  letterSpacing: "0.1em",
                  color: i === 2 ? "rgba(0,245,255,0.4)" : "#1a1a1a",
                }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScanningPage;
