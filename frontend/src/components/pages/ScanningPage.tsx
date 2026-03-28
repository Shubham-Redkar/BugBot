import { type FC, useEffect, useRef } from "react";
import { AGENT_STEPS } from "../../lib/constants";
import { type LogLine } from "../../types";

interface ScanningPageProps {
  activeStep: number;
  doneSteps: number[];
  logLines: LogLine[];
  scannedUrl: string;
}

const ScanningPage: FC<ScanningPageProps> = ({
  activeStep,
  doneSteps,
  logLines,
  scannedUrl,
}) => {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logLines]);

  const totalLogs = AGENT_STEPS.reduce((acc, s) => acc + s.logLines.length, 0);
  const progress = Math.min(
    100,
    Math.round((logLines.length / totalLogs) * 100),
  );

  return (
    <div
      className="mx-auto max-w-[720px] px-6 pt-[100px] pb-[80px]"
      style={{ position: "relative", zIndex: 2 }}
    >
      {/* Header */}
      <div className="fade-up mb-8">
        <div
          className="font-mono-tech mb-2 flex items-center gap-2"
          style={{ fontSize: "9px", letterSpacing: "0.25em", color: "#00F5FF" }}
        >
          <span
            className="inline-block h-[6px] w-[6px] rounded-full"
            style={{
              background: "#00F5FF",
              boxShadow: "0 0 8px #00F5FF",
              animation: "heartbeat-btn 1s ease-in-out infinite",
            }}
          />
          SCAN IN PROGRESS — AUTONOMOUS AGENTS ACTIVE
        </div>
        <h2
          className="font-orbitron font-black break-all"
          style={{
            fontSize: "clamp(16px, 3vw, 22px)",
            color: "#FFFFFF",
            letterSpacing: "0.02em",
          }}
        >
          {scannedUrl}
        </h2>
      </div>

      {/* Progress bar */}
      <div
        className="fade-up mb-8 rounded-[2px]"
        style={{
          border: "1px solid rgba(0,245,255,0.18)",
          background: "#0a0d12",
        }}
      >
        <div
          className="font-mono-tech flex items-center justify-between px-4 py-2"
          style={{
            fontSize: "9px",
            color: "#333",
            letterSpacing: "0.15em",
            borderBottom: "1px solid rgba(0,245,255,0.06)",
          }}
        >
          <span>MISSION PROGRESS</span>
          <span style={{ color: "rgba(0,245,255,0.6)" }}>{progress}%</span>
        </div>
        <div
          className="h-[2px] w-full"
          style={{ background: "rgba(0,245,255,0.05)" }}
        >
          <div
            className="h-full transition-[width] duration-500 ease-out"
            style={{
              width: `${progress}%`,
              background: "#00F5FF",
              boxShadow: "0 0 10px #00F5FF, 0 0 30px rgba(0,245,255,0.4)",
            }}
          />
        </div>
      </div>

      {/* Agent steps */}
      <div className="mb-6 flex flex-col gap-[8px]">
        {AGENT_STEPS.map((step, i) => {
          const isActive = activeStep === i;
          const isDone = doneSteps.includes(i);

          return (
            <div
              key={step.id}
              className="relative overflow-hidden rounded-[4px] flex items-center gap-4 px-5 py-4 transition-all duration-400"
              style={{
                border: `1px solid ${isActive ? "rgba(0,245,255,0.3)" : isDone ? "rgba(0,245,255,0.1)" : "rgba(255,255,255,0.04)"}`,
                background: isActive
                  ? "rgba(0,245,255,0.04)"
                  : isDone
                    ? "rgba(0,245,255,0.015)"
                    : "rgba(255,255,255,0.008)",
                animation: `fadeUp 0.4s ${i * 0.1}s ease both`,
                opacity: 0,
              }}
            >
              {/* Scan sweep on active */}
              {isActive && <div className="scan-sweep" />}

              {/* Icon */}
              <div
                className="relative flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[4px] font-mono-tech text-[20px]"
                style={{
                  border: `1px solid ${isActive ? "rgba(0,245,255,0.3)" : isDone ? "rgba(0,245,255,0.1)" : "rgba(255,255,255,0.05)"}`,
                  background: isActive
                    ? "rgba(0,245,255,0.1)"
                    : isDone
                      ? "rgba(0,245,255,0.04)"
                      : "rgba(255,255,255,0.02)",
                  color: isActive
                    ? "#00F5FF"
                    : isDone
                      ? "rgba(0,245,255,0.5)"
                      : "#333",
                  boxShadow: isActive ? "0 0 20px rgba(0,245,255,0.2)" : "none",
                }}
              >
                {step.icon}
                {isActive && (
                  <div
                    className="absolute inset-[-2px] rounded-[5px]"
                    style={{
                      border: "1px solid rgba(0,245,255,0.4)",
                      animation: "pulseRing 1.5s ease-out infinite",
                    }}
                  />
                )}
              </div>

              {/* Text */}
              <div className="flex-1">
                <div
                  className="font-orbitron mb-1"
                  style={{
                    fontSize: "11px",
                    letterSpacing: "0.1em",
                    color: isDone || isActive ? "#FFFFFF" : "#333",
                  }}
                >
                  {step.label}
                </div>
                <div
                  className="font-mono-tech"
                  style={{
                    fontSize: "9px",
                    letterSpacing: "0.12em",
                    color: isActive
                      ? "rgba(0,245,255,0.6)"
                      : isDone
                        ? "rgba(0,245,255,0.3)"
                        : "#222",
                  }}
                >
                  {isDone
                    ? "✓ COMPLETE — SIGNAL NOMINAL"
                    : isActive
                      ? step.sub
                      : "STANDBY..."}
                </div>
              </div>

              {/* Status tag */}
              <div
                className="font-mono-tech shrink-0 rounded-[2px] px-3 py-1"
                style={{
                  fontSize: "8px",
                  letterSpacing: "0.15em",
                  border: `1px solid ${isActive ? "rgba(0,245,255,0.3)" : isDone ? "rgba(0,245,255,0.12)" : "rgba(255,255,255,0.04)"}`,
                  color: isActive
                    ? "#00F5FF"
                    : isDone
                      ? "rgba(0,245,255,0.5)"
                      : "#222",
                  background: isActive ? "rgba(0,245,255,0.08)" : "transparent",
                  boxShadow: isActive ? "0 0 10px rgba(0,245,255,0.2)" : "none",
                }}
              >
                {isActive ? "RUNNING" : isDone ? "DONE" : "IDLE"}
              </div>
            </div>
          );
        })}
      </div>

      {/* Terminal log */}
      <div
        className="fade-up overflow-hidden rounded-[4px]"
        style={{
          border: "1px solid rgba(0,245,255,0.08)",
          background: "rgba(0,0,0,0.6)",
          animationDelay: "0.35s",
        }}
      >
        {/* Terminal titlebar */}
        <div
          className="flex items-center gap-2 border-b px-4 py-[10px]"
          style={{ borderColor: "rgba(0,245,255,0.06)" }}
        >
          {[
            "rgba(255,0,64,0.6)",
            "rgba(255,180,0,0.6)",
            "rgba(0,245,255,0.4)",
          ].map((c) => (
            <span
              key={c}
              className="inline-block h-[9px] w-[9px] rounded-full"
              style={{ background: c }}
            />
          ))}
          <span
            className="ml-2 font-mono-tech"
            style={{ fontSize: "9px", letterSpacing: "0.15em", color: "#333" }}
          >
            bugbot:agent-log // ENCRYPTED STREAM
          </span>
        </div>

        <div ref={logRef} className="h-[180px] overflow-y-auto px-4 py-3">
          {logLines.length === 0 ? (
            <div
              className="font-mono-tech"
              style={{ fontSize: "10px", color: "#222" }}
            >
              AWAITING AGENT OUTPUT<span className="cursor-blink">_</span>
            </div>
          ) : (
            logLines.map((line, idx) => (
              <div
                key={line.id}
                className="log-line font-mono-tech"
                style={{ fontSize: "10px", lineHeight: 1.9 }}
              >
                <span
                  style={{ color: "rgba(0,245,255,0.2)", marginRight: "8px" }}
                >
                  ›
                </span>
                <span
                  style={{
                    color: idx === logLines.length - 1 ? "#00F5FF" : "#2a2a2a",
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
      </div>
    </div>
  );
};

export default ScanningPage;
