import { type FC, useEffect, useRef, useState } from "react";
import { downloadHTMLReport, downloadPDFReport } from "../../lib/reports";
import type { DlState, Filter, Issue, ScanResults } from "../../types";
import AnimatedCounter from "../ui/AnimatedCounter";
import HeatMap from "../ui/HeatMap";
import IssueCard from "../ui/IssueCard";

interface ResultsPageProps {
  results: ScanResults;
  onReset: () => void;
}

interface MetricCardProps {
  label: string;
  val: number;
  color: string;
}

interface FilterTabProps {
  label: Filter;
  rgb: string;
  isActive: boolean;
  onClick: () => void;
}

/* ── Per-color filter tab with hover glow ── */
const FilterTab: FC<FilterTabProps> = ({ label, rgb, isActive, onClick }) => {
  const [hov, setHov] = useState(false);
  const lit = isActive || hov;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="font-mono-tech cursor-pointer rounded-[3px] px-4 py-[6px] border"
      style={{
        fontSize: "9px",
        letterSpacing: "0.12em",
        border: `1px solid ${lit ? `rgba(${rgb}, ${isActive ? 0.45 : 0.3})` : "rgba(255,255,255,0.04)"}`,
        background: lit ? `rgba(${rgb}, ${isActive ? 0.1 : 0.05})` : "transparent",
        color: lit ? `rgb(${rgb})` : "#333",
        boxShadow: lit
          ? `0 0 14px rgba(${rgb}, ${isActive ? 0.25 : 0.15}), 0 0 40px rgba(${rgb}, ${isActive ? 0.1 : 0.06})`
          : "none",
        textShadow: lit ? `0 0 8px rgba(${rgb}, 0.7)` : "none",
        transform: hov && !isActive ? "translateY(-1px)" : "translateY(0)",
        transition: "all 0.18s ease",
      }}
    >
      {label.toUpperCase()}
    </button>
  );
};

/* ── Metric card with lift + bloom on hover ── */
const MetricCard: FC<MetricCardProps> = ({ label, val, color }) => {
  const [hov, setHov] = useState(false);
  const isGlowColor = color === "#00F5FF";
  const glowRgb =
    color === "#00F5FF" ? "0,245,255"
    : color === "#FF0040" ? "255,0,64"
    : color === "#FFB400" ? "255,180,0"
    : "255,255,255";

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="rounded-[4px] p-4 text-center"
      style={{
        border: `1px solid ${hov ? `rgba(${glowRgb}, 0.45)` : "rgba(255,255,255,0.05)"}`,
        background: hov ? `rgba(${glowRgb}, 0.04)` : "rgba(255,255,255,0.015)",
        boxShadow: hov
          ? `0 0 24px rgba(${glowRgb}, 0.15), 0 0 60px rgba(${glowRgb}, 0.06), 0 8px 32px rgba(0,0,0,0.6)`
          : "none",
        transform: hov ? "translateY(-4px)" : "translateY(0px)",
        transition: "transform 0.22s cubic-bezier(0.34,1.56,0.64,1), border-color 0.22s ease, background 0.22s ease, box-shadow 0.22s ease",
        cursor: "default",
      }}
    >
      <div
        className="font-orbitron font-black leading-[1] mb-2"
        style={{
          fontSize: "clamp(24px, 4vw, 32px)",
          color,
          textShadow: hov
            ? `0 0 20px rgba(${glowRgb}, 0.9), 0 0 50px rgba(${glowRgb}, 0.5), 0 0 90px rgba(${glowRgb}, 0.2)`
            : isGlowColor
            ? "0 0 20px rgba(0,245,255,0.5)"
            : "none",
          transition: "text-shadow 0.22s ease",
        }}
      >
        <AnimatedCounter to={val} />
      </div>
      <div
        className="font-mono-tech"
        style={{
          fontSize: "7px",
          letterSpacing: "0.15em",
          color: hov ? `rgba(${glowRgb}, 0.45)` : "#333",
          transition: "color 0.22s ease",
        }}
      >
        {label}
      </div>
    </div>
  );
};

/* ── Export modal ── */
type ExportDlState = "idle" | "generating-html" | "generating-pdf" | "done-html" | "done-pdf";

const ExportDropdown: FC<{ results: ScanResults }> = ({ results }) => {
  const [open, setOpen]       = useState(false);
  const [dlState, setDlState] = useState<ExportDlState>("idle");
  const [hov, setHov]         = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const busy = dlState === "generating-html" || dlState === "generating-pdf";
  const done = dlState === "done-html" || dlState === "done-pdf";

  const triggerLabel = busy
    ? "COMPILING..."
    : done
    ? dlState === "done-html" ? "✓ HTML SAVED" : "✓ PDF READY"
    : "↓ EXPORT REPORT";

  const handleHTML = async () => {
    setOpen(false);
    setDlState("generating-html");
    await new Promise<void>((r) => setTimeout(r, 700));
    downloadHTMLReport(results);
    setDlState("done-html");
    setTimeout(() => setDlState("idle"), 2500);
  };

  const handlePDF = async () => {
    setOpen(false);
    setDlState("generating-pdf");
    await new Promise<void>((r) => setTimeout(r, 700));
    downloadPDFReport(results);
    setDlState("done-pdf");
    setTimeout(() => setDlState("idle"), 2500);
  };

  const borderCol = done
    ? "rgba(0,255,136,0.35)"
    : open || hov
    ? "rgba(0,245,255,0.45)"
    : "rgba(0,245,255,0.15)";

  const bgCol = done
    ? "rgba(0,255,136,0.06)"
    : open || hov
    ? "rgba(0,245,255,0.08)"
    : "rgba(0,245,255,0.03)";

  const textCol = done ? "#00FF88" : "#00F5FF";

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => { if (!busy && !done) setOpen(true); }}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        disabled={busy}
        className="font-mono-tech flex items-center gap-2 whitespace-nowrap rounded-[3px] px-4 py-2 cursor-pointer"
        style={{
          fontSize: "9px",
          letterSpacing: "0.15em",
          border: `1px solid ${borderCol}`,
          background: bgCol,
          color: textCol,
          boxShadow: (open || hov) && !done ? "0 0 20px rgba(0,245,255,0.2)" : "none",
          cursor: busy ? "wait" : "pointer",
          transition: "all 0.2s ease",
        }}
      >
        {busy && (
          <span
            className="spin-slow inline-block h-[8px] w-[8px] rounded-full border-[1.5px]"
            style={{ borderColor: "rgba(0,245,255,0.2)", borderTopColor: "#00F5FF" }}
          />
        )}
        {triggerLabel}
        {!busy && !done && (
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M1 2.5L4 5.5L7 2.5" stroke="#00F5FF" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        )}
      </button>

      {/* ── Modal overlay ── */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.88)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
          }}
        >
          {/* Dialog box */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "400px",
              maxWidth: "calc(100vw - 40px)",
              background: "#07080d",
              border: "1px solid rgba(0,245,255,0.28)",
              borderRadius: "8px",
              boxShadow: "0 0 0 1px rgba(0,245,255,0.06), 0 0 80px rgba(0,245,255,0.14), 0 32px 100px rgba(0,0,0,1)",
              overflow: "hidden",
              position: "relative",
            }}
          >
            {/* Modal header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 18px 12px",
                borderBottom: "1px solid rgba(0,245,255,0.08)",
              }}
            >
              <div>
                <div
                  className="font-mono-tech"
                  style={{ fontSize: "7px", letterSpacing: "0.25em", color: "rgba(0,245,255,0.4)", marginBottom: "4px" }}
                >
                  ↓ EXPORT INTELLIGENCE REPORT
                </div>
                <div
                  className="font-orbitron font-black"
                  style={{ fontSize: "13px", color: "#fff", letterSpacing: "0.05em" }}
                >
                  SELECT FORMAT
                </div>
              </div>
              {/* Close button */}
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(0,245,255,0.15)",
                  borderRadius: "3px",
                  color: "rgba(0,245,255,0.5)",
                  cursor: "pointer",
                  width: "24px",
                  height: "24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "14px",
                  lineHeight: 1,
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0,245,255,0.4)";
                  (e.currentTarget as HTMLButtonElement).style.color = "#00F5FF";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0,245,255,0.15)";
                  (e.currentTarget as HTMLButtonElement).style.color = "rgba(0,245,255,0.5)";
                }}
              >
                ×
              </button>
            </div>

            {/* Format options */}
            <div style={{ padding: "10px" }}>
              <ExportOption
                icon={
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="10" y1="12" x2="14" y2="12"/>
                  </svg>
                }
                label="HTML PAGE"
                description="Interactive · Themed · Shareable"
                tags={["INTERACTIVE", "THEMED"]}
                accentRgb="0,245,255"
                onClick={handleHTML}
              />
              <ExportOption
                icon={
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="9" y1="15" x2="15" y2="15"/>
                    <line x1="9" y1="18" x2="12" y2="18"/>
                  </svg>
                }
                label="PDF DOCUMENT"
                description="Print-ready · A4 · Portable"
                tags={["PRINT-READY", "A4"]}
                accentRgb="255,180,0"
                onClick={handlePDF}
              />
            </div>

            {/* Footer hint */}
            <div
              className="font-mono-tech"
              style={{
                fontSize: "7px",
                letterSpacing: "0.15em",
                color: "rgba(255,255,255,0.15)",
                padding: "10px 18px 14px",
                borderTop: "1px solid rgba(255,255,255,0.04)",
                textAlign: "center",
              }}
            >
              ESC OR CLICK OUTSIDE TO DISMISS
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/* ── Export option card inside modal ── */
const ExportOption: FC<{
  icon: React.ReactNode;
  label: string;
  description: string;
  tags: string[];
  accentRgb: string;
  onClick: () => void;
}> = ({ icon, label, description, tags, accentRgb, onClick }) => {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "14px",
        width: "100%",
        padding: "14px 14px",
        marginBottom: "6px",
        background: hov ? `rgba(${accentRgb}, 0.1)` : "#0e0f16",
        border: `1px solid ${hov ? `rgba(${accentRgb}, 0.35)` : "rgba(255,255,255,0.06)"}`,
        borderRadius: "4px",
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.18s ease",
        boxShadow: hov ? `0 0 20px rgba(${accentRgb}, 0.1)` : "none",
      }}
    >
      {/* Icon */}
      <span style={{
        color: hov ? `rgb(${accentRgb})` : "rgba(255,255,255,0.3)",
        flexShrink: 0,
        transition: "color 0.18s",
        filter: hov ? `drop-shadow(0 0 6px rgba(${accentRgb}, 0.6))` : "none",
      }}>
        {icon}
      </span>

      {/* Text */}
      <span style={{ flex: 1 }}>
        <div
          className="font-orbitron font-black"
          style={{
            fontSize: "11px",
            letterSpacing: "0.08em",
            color: hov ? `rgb(${accentRgb})` : "#ccc",
            textShadow: hov ? `0 0 12px rgba(${accentRgb}, 0.6)` : "none",
            transition: "all 0.18s",
            marginBottom: "4px",
          }}
        >
          {label}
        </div>
        <div
          className="font-mono-tech"
          style={{
            fontSize: "7px",
            letterSpacing: "0.1em",
            color: hov ? `rgba(${accentRgb}, 0.5)` : "rgba(255,255,255,0.2)",
            transition: "color 0.18s",
            marginBottom: "8px",
          }}
        >
          {description}
        </div>
        <div style={{ display: "flex", gap: "5px" }}>
          {tags.map((t) => (
            <span
              key={t}
              className="font-mono-tech"
              style={{
                fontSize: "6px",
                letterSpacing: "0.12em",
                padding: "2px 6px",
                borderRadius: "2px",
                border: `1px solid ${hov ? `rgba(${accentRgb}, 0.3)` : "rgba(255,255,255,0.08)"}`,
                color: hov ? `rgba(${accentRgb}, 0.7)` : "rgba(255,255,255,0.2)",
                transition: "all 0.18s",
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </span>

      {/* Arrow */}
      <span style={{
        fontSize: "18px",
        color: hov ? `rgba(${accentRgb}, 0.7)` : "rgba(255,255,255,0.1)",
        transition: "color 0.18s, transform 0.18s",
        transform: hov ? "translateX(3px)" : "translateX(0)",
      }}>›</span>
    </button>
  );
};


/* ── Main page ── */
const ResultsPage: FC<ResultsPageProps> = ({ results, onReset }) => {
  const high = results.issues.filter((i) => i.severity === "High").length;
  const med  = results.issues.filter((i) => i.severity === "Medium").length;
  const low  = results.issues.filter((i) => i.severity === "Low").length;

  const [filter, setFilter]     = useState<Filter>("All");
  const [hovReset, setHovReset] = useState(false);

  const filtered: Issue[] =
    filter === "All" ? results.issues : results.issues.filter((i) => i.severity === filter);

  const metrics = [
    { label: "NODES SCANNED",   val: results.pages_scanned, color: "#00F5FF" },
    { label: "ANOMALIES FOUND", val: results.issues_found,  color: "#FFFFFF" },
    { label: "CRITICAL",        val: high,                  color: "#FF0040" },
    { label: "NEEDS FIX",       val: high + med,            color: "#FFB400" },
  ];

  const sevBars: [string, number, string][] = [
    ["#FF0040", high, "HIGH"],
    ["#FFB400", med,  "MEDIUM"],
    ["#00F5FF", low,  "LOW"],
  ];

  const filterMeta: Record<Filter, string> = {
    All:    "0,245,255",
    High:   "255,0,64",
    Medium: "255,180,0",
    Low:    "0,245,255",
  };

  return (
    <div className="mx-auto max-w-[720px] px-6 pt-[100px] pb-[80px]" style={{ position: "relative", zIndex: 2 }}>

      {/* Header */}
      <div className="fade-up mb-8 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div
            className="font-mono-tech mb-2 flex items-center gap-2"
            style={{ fontSize: "9px", letterSpacing: "0.25em", color: "rgba(0,255,136,0.8)" }}
          >
            <span style={{
              display: "inline-block", width: 6, height: 6,
              borderRadius: "50%", background: "#00FF88",
              boxShadow: "0 0 8px #00FF88",
            }} />
            SCAN COMPLETE — INTELLIGENCE EXTRACTED
          </div>
          <h2
            className="font-orbitron font-black break-all"
            style={{ fontSize: "clamp(14px, 2.5vw, 20px)", color: "#FFFFFF", letterSpacing: "0.02em" }}
          >
            {results.url}
          </h2>
        </div>

        <div className="flex shrink-0 gap-2">
          {/* Export dropdown */}
          <ExportDropdown results={results} />

          {/* New scan */}
          <button
            onClick={onReset}
            onMouseEnter={() => setHovReset(true)}
            onMouseLeave={() => setHovReset(false)}
            className="font-mono-tech whitespace-nowrap rounded-[3px] px-4 py-2 cursor-pointer border"
            style={{
              fontSize: "9px",
              letterSpacing: "0.15em",
              border: `1px solid ${hovReset ? "rgba(0,245,255,0.4)" : "rgba(0,245,255,0.15)"}`,
              background: hovReset ? "rgba(0,245,255,0.08)" : "rgba(0,245,255,0.03)",
              color: hovReset ? "#00F5FF" : "rgba(0,245,255,0.5)",
              boxShadow: hovReset ? "0 0 20px rgba(0,245,255,0.2), 0 0 50px rgba(0,245,255,0.08)" : "none",
              textShadow: hovReset ? "0 0 10px rgba(0,245,255,0.6)" : "none",
              transition: "all 0.2s ease",
            }}
          >
            ← NEW TARGET
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="fade-up mb-4 grid grid-cols-2 gap-[8px] md:grid-cols-4" style={{ animationDelay: "0.1s" }}>
        {metrics.map((m) => (
          <MetricCard key={m.label} label={m.label} val={m.val} color={m.color} />
        ))}
      </div>

      {/* Severity bar */}
      <div
        className="fade-up mb-6 rounded-[4px] px-4 py-3"
        style={{
          border: "1px solid rgba(255,255,255,0.05)",
          background: "rgba(255,255,255,0.01)",
          animationDelay: "0.18s",
        }}
      >
        <div className="mb-3 flex justify-between">
          {sevBars.map(([col, cnt, lbl]) => (
            <span key={lbl} className="font-mono-tech" style={{ fontSize: "9px", color: col, letterSpacing: "0.1em" }}>
              ● {lbl}: {cnt}
            </span>
          ))}
        </div>
        <div className="flex h-[3px] overflow-hidden rounded-full" style={{ background: "#0a0a0a" }}>
          {sevBars.map(([col, cnt]) => (
            <div
              key={col}
              className="h-full"
              style={{
                width: `${(cnt / results.issues_found) * 100}%`,
                background: col,
                boxShadow: `0 0 6px ${col}`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Heatmap */}
      <div className="mb-6">
        <HeatMap issues={results.issues} />
      </div>

      {/* Filter tabs */}
      <div className="fade-up mb-4 flex gap-2" style={{ animationDelay: "0.22s" }}>
        {(["All", "High", "Medium", "Low"] as Filter[]).map((f) => (
          <FilterTab
            key={f}
            label={f}
            rgb={filterMeta[f]}
            isActive={filter === f}
            onClick={() => setFilter(f)}
          />
        ))}
      </div>

      {/* Issue cards */}
      <div className="flex flex-col gap-2">
        {filtered.map((issue, i) => (
          <IssueCard
            key={`${issue.page}-${issue.issue_type}`}
            issue={issue}
            index={i}
          />
        ))}
      </div>
    </div>
  );
};

export default ResultsPage;
