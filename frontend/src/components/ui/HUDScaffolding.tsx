import { type FC, useEffect, useRef, useState } from "react";
import { HUD_LOGS } from "../../lib/constants";

const HUDScaffolding: FC = () => {
  const [entropy, setEntropy] = useState<string>("7F3A9C12");
  const [clock, setClock] = useState<string>("00:00:00");
  const [ms, setMs] = useState<string>("000");
  const [logs, setLogs] = useState<string[]>([]);
  const [packetCount, setPacketCount] = useState(0);
  const logRef = useRef<HTMLDivElement>(null);

  // Live clock (50ms precision)
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, "0");
      const m = String(now.getMinutes()).padStart(2, "0");
      const s = String(now.getSeconds()).padStart(2, "0");
      setClock(`${h}:${m}:${s}`);
      setMs(String(now.getMilliseconds()).padStart(3, "0"));
    };
    tick();
    const id = setInterval(tick, 50);
    return () => clearInterval(id);
  }, []);

  // Entropy scramble
  useEffect(() => {
    const id = setInterval(() => {
      setEntropy(
        Math.floor(Math.random() * 0xffffffff)
          .toString(16)
          .toUpperCase()
          .padStart(8, "0"),
      );
    }, 160);
    return () => clearInterval(id);
  }, []);

  // Packet counter
  useEffect(() => {
    const id = setInterval(() => {
      setPacketCount((p) => p + Math.floor(Math.random() * 8 + 1));
    }, 200);
    return () => clearInterval(id);
  }, []);

  // Live log stream
  useEffect(() => {
    let idx = 0;
    const addLog = () => {
      setLogs((prev) => [...prev.slice(-14), HUD_LOGS[idx % HUD_LOGS.length]]);
      idx++;
    };
    addLog();
    const id = setInterval(addLog, 820);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  const monoStyle: React.CSSProperties = {
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: "9px",
    lineHeight: 1.9,
  };

  return (
    <>
      {/* CRT Vignette */}
      <div className="crt-vignette" />

      {/* TOP LEFT */}
      <div
        className="pointer-events-none fixed top-[64px] left-4 z-10 select-none"
        style={{ ...monoStyle, color: "#2a2a2a" }}
      >
        <div style={{ color: "#333", marginBottom: "2px" }}>
          37.7749° N // 122.4194° W
        </div>
        <div>ALT: 000016m // HDG: 359°</div>
        <div>
          SECTOR: <span style={{ color: "#383838" }}>GRID_07_ALPHA</span>
        </div>
        <div
          style={{
            marginTop: "6px",
            borderTop: "1px solid #111",
            paddingTop: "6px",
          }}
        >
          <span style={{ color: "#222" }}>UTC: </span>
          <span
            style={{ color: "rgba(0,245,255,0.45)", letterSpacing: "0.08em" }}
          >
            {clock}
          </span>
          <span style={{ color: "rgba(0,245,255,0.2)", fontSize: "8px" }}>
            .{ms}
          </span>
        </div>
      </div>

      {/* TOP RIGHT */}
      <div
        className="pointer-events-none fixed top-[64px] right-4 z-10 select-none text-right flicker"
        style={{ ...monoStyle, color: "#2a2a2a" }}
      >
        <div>v1.0.0 // BUILD 20250328</div>
        <div>
          ENTROPY:{" "}
          <span style={{ color: "rgba(0,245,255,0.4)", fontWeight: 700 }}>
            {entropy}
          </span>
        </div>
        <div>
          PKT_RX:{" "}
          <span style={{ color: "rgba(0,245,255,0.3)" }}>
            {String(packetCount).padStart(6, "0")}
          </span>
        </div>
        <div>
          LATENCY: <span style={{ color: "rgba(80,220,160,0.5)" }}>1.2ms</span>
        </div>
      </div>

      {/* BOTTOM LEFT: live logs */}
      <div className="pointer-events-none fixed bottom-5 left-4 z-10 w-[300px] select-none">
        <div
          style={{
            ...monoStyle,
            fontSize: "8px",
            letterSpacing: "0.18em",
            color: "rgba(0,245,255,0.25)",
            marginBottom: "4px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: "rgba(0,245,255,0.5)",
              boxShadow: "0 0 6px rgba(0,245,255,0.5)",
              animation: "heartbeat-btn 1s ease-in-out infinite",
            }}
          />
          SYSTEM LOG // LIVE STREAM
        </div>
        <div ref={logRef} style={{ maxHeight: "130px", overflow: "hidden" }}>
          {logs.map((line, i) => (
            <div
              key={`${i}-${line}`}
              className="log-line"
              style={{
                ...monoStyle,
                color:
                  i === logs.length - 1 ? "rgba(0,245,255,0.55)" : "#1a1a1a",
              }}
            >
              <span
                style={{ color: "rgba(0,245,255,0.18)", marginRight: "6px" }}
              >
                ›
              </span>
              {line}
              {i === logs.length - 1 && (
                <span
                  className="cursor-blink"
                  style={{ color: "#00F5FF", marginLeft: "2px" }}
                >
                  _
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* BOTTOM RIGHT: system status */}
      <div
        className="pointer-events-none fixed bottom-5 right-4 z-10 select-none text-right"
        style={{ ...monoStyle, color: "#1a1a1a" }}
      >
        <div>
          STATUS:{" "}
          <span
            style={{
              color: "rgba(0,245,255,0.45)",
              textShadow: "0 0 6px rgba(0,245,255,0.3)",
            }}
          >
            ONLINE
          </span>
        </div>
        <div>AGENTS: 03 STANDBY</div>
        <div>UPTIME: 99.97%</div>
      </div>

      {/* CORNER BRACKETS */}
      {/* Top-left */}
      <svg
        className="pointer-events-none fixed top-[60px] left-0 z-10"
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
      >
        <path
          d="M2 20 L2 2 L20 2"
          stroke="rgba(0,245,255,0.12)"
          strokeWidth="1"
        />
        <path d="M2 2 L10 2" stroke="rgba(0,245,255,0.5)" strokeWidth="1.5" />
        <path d="M2 2 L2 10" stroke="rgba(0,245,255,0.5)" strokeWidth="1.5" />
      </svg>
      {/* Top-right */}
      <svg
        className="pointer-events-none fixed top-[60px] right-0 z-10"
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
      >
        <path
          d="M30 20 L30 2 L12 2"
          stroke="rgba(0,245,255,0.12)"
          strokeWidth="1"
        />
        <path d="M30 2 L22 2" stroke="rgba(0,245,255,0.5)" strokeWidth="1.5" />
        <path d="M30 2 L30 10" stroke="rgba(0,245,255,0.5)" strokeWidth="1.5" />
      </svg>
      {/* Bottom-left */}
      <svg
        className="pointer-events-none fixed bottom-0 left-0 z-10"
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
      >
        <path
          d="M2 12 L2 30 L20 30"
          stroke="rgba(0,245,255,0.12)"
          strokeWidth="1"
        />
        <path d="M2 30 L10 30" stroke="rgba(0,245,255,0.5)" strokeWidth="1.5" />
        <path d="M2 30 L2 22" stroke="rgba(0,245,255,0.5)" strokeWidth="1.5" />
      </svg>
      {/* Bottom-right */}
      <svg
        className="pointer-events-none fixed bottom-0 right-0 z-10"
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
      >
        <path
          d="M30 12 L30 30 L12 30"
          stroke="rgba(0,245,255,0.12)"
          strokeWidth="1"
        />
        <path
          d="M30 30 L22 30"
          stroke="rgba(0,245,255,0.5)"
          strokeWidth="1.5"
        />
        <path
          d="M30 30 L30 22"
          stroke="rgba(0,245,255,0.5)"
          strokeWidth="1.5"
        />
      </svg>

      {/* HORIZONTAL RULE under navbar */}
      <div
        className="pointer-events-none fixed top-[60px] left-0 right-0 z-10"
        style={{
          height: "1px",
          background:
            "linear-gradient(90deg, transparent, rgba(0,245,255,0.08) 20%, rgba(0,245,255,0.08) 80%, transparent)",
        }}
      />
    </>
  );
};

export default HUDScaffolding;
