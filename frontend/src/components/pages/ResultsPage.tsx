import { type FC, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { downloadHTMLReport, downloadPDFReport } from "../../lib/reports";
import type { Filter, Issue, ScanResults } from "../../types";
import AnimatedCounter from "../ui/AnimatedCounter";
import HeatMap from "../ui/HeatMap";
import IssueCard from "../ui/IssueCard";

// ── Screenshot URL helper ─────────────────────────────────────────────────────
// Fixes 404s: if the backend returns a relative path like "/screenshots/x.png"
// we prefix it with the API origin so it resolves correctly.
// If it's already an absolute URL (starts with http/https/data:) it passes through.
const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export function resolveScreenshotUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  if (/^(https?:|data:)/i.test(raw)) return raw;           // already absolute
  const base = API_BASE.replace(/\/$/, "");                 // strip trailing slash
  return `${base}${raw.startsWith("/") ? "" : "/"}${raw}`;
}

interface ResultsPageProps { results: ScanResults; onReset: () => void; }
interface MetricCardProps { label: string; val: number; color: string; delay: number; }
interface FilterTabProps { label: Filter; rgb: string; isActive: boolean; onClick: () => void; }

// ── Health arc SVG ────────────────────────────────────────────────────────────
const HealthArc: FC<{ score: number; color: string; status: string }> = ({ score, color, status }) => {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 300); return () => clearTimeout(t); }, []);
  const R = 44; const C = Math.PI * R;
  const offset = C - (animated ? score / 100 : 0) * C;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
      <div style={{ position: "relative", flexShrink: 0 }}>
        <svg width="100" height="54" viewBox="0 0 100 54">
          <path d="M 6 50 A 44 44 0 0 1 94 50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" strokeLinecap="round" />
          <path d="M 6 50 A 44 44 0 0 1 94 50" fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={offset}
            style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: "stroke-dashoffset 1.2s cubic-bezier(0.34,1.1,0.64,1) 0.3s" }}
          />
        </svg>
        <div style={{ position: "absolute", bottom: "-4px", left: "50%", transform: "translateX(-50%)", textAlign: "center" }}>
          <div style={{ fontFamily: "'Orbitron',monospace", fontWeight: 900, fontSize: "20px", color, textShadow: `0 0 16px ${color}`, lineHeight: 1 }}>{score}</div>
          <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: "7px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.15em" }}>/ 100</div>
        </div>
      </div>
      <div>
        <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: "9px", letterSpacing: "0.15em", color: "rgba(255,255,255,0.3)", marginBottom: "4px" }}>WEBSITE HEALTH</div>
        <div style={{ fontFamily: "'Orbitron',monospace", fontSize: "14px", fontWeight: 900, color, textShadow: `0 0 12px ${color}`, letterSpacing: "0.06em" }}>{status.toUpperCase()}</div>
      </div>
    </div>
  );
};

// ── Metric card ───────────────────────────────────────────────────────────────
const MetricCard: FC<MetricCardProps> = ({ label, val, color, delay }) => {
  const [hov, setHov] = useState(false);
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), delay); return () => clearTimeout(t); }, [delay]);
  const rgb = color === "#00F5FF" ? "0,245,255" : color === "#FF0040" ? "255,0,64" : color === "#FFB400" ? "255,180,0" : "255,255,255";
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        borderRadius: "8px", padding: "18px 14px", textAlign: "center",
        border: `1px solid ${hov ? `rgba(${rgb},0.45)` : "rgba(255,255,255,0.055)"}`,
        background: hov ? `rgba(${rgb},0.05)` : "rgba(255,255,255,0.014)",
        boxShadow: hov ? `0 0 28px rgba(${rgb},0.15),0 8px 32px rgba(0,0,0,0.5)` : "none",
        transform: vis ? (hov ? "translateY(-5px)" : "translateY(0)") : "translateY(16px)",
        opacity: vis ? 1 : 0,
        transition: `opacity 0.65s cubic-bezier(0.16,1,0.3,1) ${delay}ms,transform 0.65s cubic-bezier(0.34,1.4,0.64,1) ${delay}ms,border-color 0.2s,background 0.2s,box-shadow 0.2s`,
        cursor: "default",
      }}
    >
      <div style={{ fontFamily: "'Orbitron',monospace", fontWeight: 900, fontSize: "clamp(22px,4vw,30px)", color, lineHeight: 1, marginBottom: "8px", textShadow: hov ? `0 0 20px rgba(${rgb},0.9),0 0 50px rgba(${rgb},0.4)` : color === "#00F5FF" ? "0 0 16px rgba(0,245,255,0.4)" : "none", transition: "text-shadow 0.2s" }}>
        <AnimatedCounter to={val} />
      </div>
      <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: "7px", letterSpacing: "0.16em", color: hov ? `rgba(${rgb},0.5)` : "#2a2a2a", transition: "color 0.2s" }}>{label}</div>
    </div>
  );
};

// ── Filter tab ────────────────────────────────────────────────────────────────
const FilterTab: FC<FilterTabProps> = ({ label, rgb, isActive, onClick }) => {
  const [hov, setHov] = useState(false);
  const lit = isActive || hov;
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        fontFamily: "'Share Tech Mono',monospace", fontSize: "9px", letterSpacing: "0.12em",
        padding: "6px 16px", borderRadius: "20px", cursor: "pointer",
        border: `1px solid ${lit ? `rgba(${rgb},${isActive ? 0.5 : 0.3})` : "rgba(255,255,255,0.05)"}`,
        background: lit ? `rgba(${rgb},${isActive ? 0.12 : 0.06})` : "transparent",
        color: lit ? `rgb(${rgb})` : "#2a2a2a",
        boxShadow: lit ? `0 0 16px rgba(${rgb},${isActive ? 0.28 : 0.14}),0 0 40px rgba(${rgb},${isActive ? 0.1 : 0.05})` : "none",
        textShadow: lit ? `0 0 8px rgba(${rgb},0.7)` : "none",
        transform: hov && !isActive ? "translateY(-1px)" : "translateY(0)",
        transition: "all 0.18s ease",
      }}
    >{label.toUpperCase()}</button>
  );
};

// ── Export dropdown — menu item extracted into its own component ──────────────
// FIX: The original code called useState() inside a .map() callback which is an
// illegal React Hook invocation and causes an immediate crash. Each menu entry
// is now its own component so hooks are always called at the top level.
interface ExportMenuItemProps {
  icon: string;
  label: string;
  sub: string;
  rgb: string;
  onClick: () => void;
  divider: boolean;
}

const ExportMenuItem: FC<ExportMenuItemProps> = ({ icon, label, sub, rgb, onClick, divider }) => {
  const [hov, setHov] = useState(false);
  return (
    <div>
      {divider && <div style={{ height: 1, background: "rgba(255,255,255,0.04)", margin: "0 12px" }} />}
      <button
        onClick={e => { e.stopPropagation(); onClick(); }}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          display: "flex", alignItems: "center", gap: "12px", width: "100%",
          padding: "12px 14px",
          background: hov ? `rgba(${rgb},0.08)` : "transparent",
          border: "none", cursor: "pointer", textAlign: "left",
          transition: "background 0.15s",
        }}
      >
        <span style={{ color: hov ? `rgb(${rgb})` : "rgba(255,255,255,0.35)", fontSize: "14px", transition: "color 0.15s" }}>{icon}</span>
        <span style={{ flex: 1 }}>
          <span style={{ display: "block", fontFamily: "'Share Tech Mono',monospace", fontSize: "10px", letterSpacing: "0.12em", color: hov ? `rgb(${rgb})` : "rgba(255,255,255,0.7)", marginBottom: "2px", transition: "color 0.15s" }}>{label}</span>
          <span style={{ display: "block", fontFamily: "'Share Tech Mono',monospace", fontSize: "8px", letterSpacing: "0.1em", color: "rgba(255,255,255,0.2)" }}>{sub}</span>
        </span>
      </button>
    </div>
  );
};

// ── Export dropdown ───────────────────────────────────────────────────────────
type ExportState = "idle" | "generating-html" | "generating-pdf" | "done-html" | "done-pdf";

const ExportDropdown: FC<{ results: ScanResults }> = ({ results }) => {
  const [open, setOpen]       = useState(false);
  const [dlState, setDlState] = useState<ExportState>("idle");
  const [hov, setHov]         = useState(false);
  const [rect, setRect]       = useState<DOMRect | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onKey  = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      const p = document.getElementById("export-dropdown-panel");
      if (!btnRef.current?.contains(t) && !p?.contains(t)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onDown); };
  }, []);

  const busy  = dlState === "generating-html" || dlState === "generating-pdf";
  const done  = dlState === "done-html"       || dlState === "done-pdf";
  const label = busy ? "COMPILING..." : done ? (dlState === "done-html" ? "✓ HTML SAVED" : "✓ PDF READY") : "↓ EXPORT";

  const handleHTML = async () => {
    setOpen(false);
    setDlState("generating-html");
    await new Promise<void>(r => setTimeout(r, 700));
    downloadHTMLReport(results);
    setDlState("done-html");
    setTimeout(() => setDlState("idle"), 2500);
  };

  const handlePDF = async () => {
    setOpen(false);
    setDlState("generating-pdf");
    await new Promise<void>(r => setTimeout(r, 700));
    downloadPDFReport(results);
    setDlState("done-pdf");
    setTimeout(() => setDlState("idle"), 2500);
  };

  const bc = done ? "rgba(0,255,136,0.35)" : open || hov ? "rgba(0,245,255,0.45)" : "rgba(0,245,255,0.15)";

  const menuItems = [
    { icon: "◼", label: "HTML Page",     sub: "Interactive · Themed", rgb: "0,245,255",  fn: handleHTML },
    { icon: "◻", label: "PDF Document",  sub: "Print-ready · A4",     rgb: "255,180,0",  fn: handlePDF  },
  ];

  const menu = rect && open
    ? createPortal(
        <div
          id="export-dropdown-panel"
          style={{
            position: "fixed", top: rect.bottom + 6, left: rect.right - 220,
            width: "220px", zIndex: 2147483647,
            background: "#12151e",
            border: "1px solid rgba(0,245,255,0.18)",
            borderRadius: "8px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.8),0 0 0 1px rgba(0,245,255,0.06)",
            overflow: "hidden",
            animation: "expandDown 0.18s ease both",
          }}
        >
          {menuItems.map((item, i) => (
            <ExportMenuItem
              key={item.label}
              icon={item.icon}
              label={item.label}
              sub={item.sub}
              rgb={item.rgb}
              onClick={item.fn}
              divider={i > 0}
            />
          ))}
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <button
        ref={btnRef}
        disabled={busy}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        onClick={() => {
          if (busy) return;
          const r = btnRef.current?.getBoundingClientRect() ?? null;
          setRect(r);
          setOpen(o => !o);
        }}
        style={{
          fontFamily: "'Share Tech Mono',monospace", fontSize: "9px", letterSpacing: "0.15em",
          padding: "8px 14px", borderRadius: "4px", cursor: busy ? "not-allowed" : "pointer",
          border: `1px solid ${bc}`,
          background: done ? "rgba(0,255,136,0.06)" : open || hov ? "rgba(0,245,255,0.08)" : "rgba(0,245,255,0.025)",
          color: done ? "#00FF88" : open || hov ? "#00F5FF" : "rgba(0,245,255,0.5)",
          boxShadow: open || hov ? "0 0 20px rgba(0,245,255,0.15)" : "none",
          transition: "all 0.2s", display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap",
          opacity: busy ? 0.7 : 1,
        }}
      >
        {busy && (
          <span style={{ display: "inline-block", width: 8, height: 8, border: "1px solid rgba(0,245,255,0.5)", borderTopColor: "#00F5FF", borderRadius: "50%", animation: "spinSlow 0.8s linear infinite" }} />
        )}
        {label}
        {!busy && !done && (
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none" style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>
            <path d="M1 2.5L4 5.5L7 2.5" stroke="#00F5FF" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        )}
      </button>
      {menu}
    </>
  );
};

// ── Main ResultsPage ──────────────────────────────────────────────────────────
const ResultsPage: FC<ResultsPageProps> = ({ results, onReset }) => {
  // Resolve screenshot URLs once so IssueCard always gets absolute URLs
  // FIX: patches relative paths like "/screenshots/x.png" → "http://localhost:8000/screenshots/x.png"
  const resolvedResults: ScanResults = {
    ...results,
    issues: results.issues.map(issue => ({
      ...issue,
      screenshot: resolveScreenshotUrl(issue.screenshot),
    })),
  };

  const high = resolvedResults.issues.filter(i => i.severity === "High").length;
  const med  = resolvedResults.issues.filter(i => i.severity === "Medium").length;
  const low  = resolvedResults.issues.filter(i => i.severity === "Low").length;

  const [filter, setFilter]     = useState<Filter>("All");
  const [hovReset, setHovReset] = useState(false);
  const [mounted, setMounted]   = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);

  const filtered: Issue[] = filter === "All"
    ? resolvedResults.issues
    : resolvedResults.issues.filter(i => i.severity === filter);

  const metrics = [
    { label: "NODES SCANNED",  val: resolvedResults.pages_scanned, color: "#00F5FF", delay: 100  },
    { label: "ANOMALIES FOUND", val: resolvedResults.issues_found, color: "#FFFFFF", delay: 175  },
    { label: "CRITICAL",        val: high,                         color: "#FF0040", delay: 250  },
    { label: "NEEDS FIX",       val: high + med,                   color: "#FFB400", delay: 325  },
  ];
  const sevBars: [string, number, string][] = [["#FF0040", high, "HIGH"], ["#FFB400", med, "MED"], ["#00F5FF", low, "LOW"]];
  const filterMeta: Record<Filter, string> = { All: "0,245,255", High: "255,0,64", Medium: "255,180,0", Low: "0,245,255" };

  const getHealthColor = (s: string) =>
    s === "Excellent" || s === "Good" ? "#00FF88" : s === "Fair" ? "#FFB400" : s === "Poor" || s === "Error" ? "#FF0040" : "#00F5FF";
  const healthColor = getHealthColor(resolvedResults.health_status);

  const rv = (delay: number): React.CSSProperties => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? "translateY(0)" : "translateY(14px)",
    transition: `opacity 0.75s cubic-bezier(0.16,1,0.3,1) ${delay}ms,transform 0.75s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
  });

  return (
    <div className="mx-auto max-w-[760px] px-6 pt-[100px] pb-[80px]" style={{ position: "relative", zIndex: 2 }}>

      {/* ── Header ── */}
      <div style={{ ...rv(80), display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", marginBottom: "32px" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: "9px", letterSpacing: "0.25em", color: "rgba(0,255,136,0.85)", display: "flex", alignItems: "center", gap: "7px", marginBottom: "10px" }}>
            <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#00FF88", boxShadow: "0 0 8px #00FF88", animation: "heartbeat-btn 1.5s ease-in-out infinite" }} />
            SCAN COMPLETE — INTELLIGENCE EXTRACTED
          </div>
          <h2 style={{ fontFamily: "'Orbitron',monospace", fontWeight: 900, fontSize: "clamp(13px,2.2vw,19px)", color: "#fff", letterSpacing: "0.02em", wordBreak: "break-all", margin: 0 }}>
            {resolvedResults.url}
          </h2>
        </div>
        <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
          <ExportDropdown results={resolvedResults} />
          <button
            onClick={onReset}
            onMouseEnter={() => setHovReset(true)}
            onMouseLeave={() => setHovReset(false)}
            style={{
              fontFamily: "'Share Tech Mono',monospace", fontSize: "9px", letterSpacing: "0.15em",
              padding: "8px 14px", borderRadius: "4px",
              border: `1px solid ${hovReset ? "rgba(0,245,255,0.4)" : "rgba(0,245,255,0.15)"}`,
              background: hovReset ? "rgba(0,245,255,0.08)" : "rgba(0,245,255,0.025)",
              color: hovReset ? "#00F5FF" : "rgba(0,245,255,0.5)",
              boxShadow: hovReset ? "0 0 20px rgba(0,245,255,0.15)" : "none",
              cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap",
            }}
          >
            ← NEW TARGET
          </button>
        </div>
      </div>

      {/* ── Metrics ── */}
      <div style={{ ...rv(120), display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "8px", marginBottom: "16px" }}>
        {metrics.map(m => <MetricCard key={m.label} {...m} />)}
      </div>

      {/* ── Severity + Health row ── */}
      <div style={{ ...rv(260), display: "grid", gridTemplateColumns: "1fr auto", gap: "12px", marginBottom: "20px" }}>
        <div style={{ borderRadius: "8px", padding: "16px 18px", border: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.012)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
            {sevBars.map(([col, cnt, lbl]) => (
              <span key={lbl} style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: "9px", color: col, letterSpacing: "0.08em" }}>
                ● {lbl}: <strong>{cnt}</strong>
              </span>
            ))}
          </div>
          <div style={{ display: "flex", height: "4px", borderRadius: "2px", overflow: "hidden", background: "rgba(255,255,255,0.03)" }}>
            {sevBars.map(([col, cnt]) => (
              <div key={col} style={{ width: `${resolvedResults.issues_found > 0 ? (cnt / resolvedResults.issues_found) * 100 : 0}%`, height: "100%", background: col, boxShadow: `0 0 8px ${col}`, transition: "width 0.6s ease" }} />
            ))}
          </div>
          <div style={{ marginTop: "10px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {resolvedResults.issues.slice(0, 8).map((iss, i) => {
              const c = iss.severity === "High" ? "#FF0040" : iss.severity === "Medium" ? "#FFB400" : "#00F5FF";
              return <span key={i} style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: "7px", padding: "2px 7px", borderRadius: "3px", background: `${c}12`, border: `1px solid ${c}35`, color: `${c}bb`, letterSpacing: "0.05em" }}>{iss.issue_type}</span>;
            })}
          </div>
        </div>
        <div style={{ borderRadius: "8px", padding: "16px 20px", border: `1px solid ${healthColor}22`, background: "rgba(255,255,255,0.012)", display: "flex", alignItems: "center" }}>
          <HealthArc score={resolvedResults.health_score} color={healthColor} status={resolvedResults.health_status} />
        </div>
      </div>

      {/* ── Heatmap ── */}
      <div style={{ ...rv(340), marginBottom: "24px" }}>
        <HeatMap issues={resolvedResults.issues} />
      </div>

      {/* ── Filter tabs ── */}
      <div style={{ ...rv(400), display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        {(["All", "High", "Medium", "Low"] as Filter[]).map(f => (
          <FilterTab key={f} label={f} rgb={filterMeta[f]} isActive={filter === f} onClick={() => setFilter(f)} />
        ))}
        <div style={{ marginLeft: "auto", fontFamily: "'Share Tech Mono',monospace", fontSize: "8px", color: "#2a2a2a", letterSpacing: "0.1em", alignSelf: "center" }}>
          {filtered.length} ISSUE{filtered.length !== 1 ? "S" : ""} SHOWN
        </div>
      </div>

      {/* ── Issue cards ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {filtered.map((issue, i) => (
          <IssueCard key={`${issue.page}-${issue.issue_type}-${i}`} issue={issue} index={i} />
        ))}
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 0", fontFamily: "'Share Tech Mono',monospace", fontSize: "9px", letterSpacing: "0.2em", color: "#1a1a1a" }}>
            NO ISSUES MATCHING FILTER
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultsPage;