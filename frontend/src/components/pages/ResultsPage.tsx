import { type FC, useState } from "react";
import { downloadReport } from "../../lib/reports";
import type { DlState, Filter, Issue, ScanResults } from "../../types";
import AnimatedCounter from "../ui/AnimatedCounter";
import IssueCard from "../ui/IssueCard";

interface ResultsPageProps {
  results: ScanResults;
  onReset: () => void;
}

const ResultsPage: FC<ResultsPageProps> = ({ results, onReset }) => {
  const high = results.issues.filter((i) => i.severity === "High").length;
  const med = results.issues.filter((i) => i.severity === "Medium").length;
  const low = results.issues.filter((i) => i.severity === "Low").length;

  const [filter, setFilter] = useState<Filter>("All");
  const [hovReset, setHovReset] = useState<boolean>(false);
  const [hovDl, setHovDl] = useState<boolean>(false);
  const [dlState, setDlState] = useState<DlState>("idle");

  const filtered: Issue[] =
    filter === "All" ? results.issues : results.issues.filter((i) => i.severity === filter);

  const handleDownload = async (): Promise<void> => {
    setDlState("generating");
    await new Promise<void>((r) => setTimeout(r, 900));
    downloadReport(results);
    setDlState("done");
    setTimeout(() => setDlState("idle"), 2500);
  };

  const metrics = [
    { label: "NODES SCANNED", val: results.pages_scanned, color: "#00F5FF" },
    { label: "ANOMALIES FOUND", val: results.issues_found, color: "#FFFFFF" },
    { label: "CRITICAL", val: high, color: "#FF0040" },
    { label: "NEEDS FIX", val: high + med, color: "#FFB400" },
  ];

  const sevBars: [string, number, string][] = [
    ["#FF0040", high, "HIGH"],
    ["#FFB400", med, "MEDIUM"],
    ["#00F5FF", low, "LOW"],
  ];

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
          {/* Download */}
          <button
            onClick={handleDownload}
            onMouseEnter={() => setHovDl(true)}
            onMouseLeave={() => setHovDl(false)}
            disabled={dlState === "generating"}
            className="font-mono-tech flex items-center gap-2 whitespace-nowrap rounded-[3px] px-4 py-2 transition-all duration-200 cursor-pointer border"
            style={{
              fontSize: "9px",
              letterSpacing: "0.15em",
              border: `1px solid ${dlState === "done" ? "rgba(0,255,136,0.3)" : hovDl ? "rgba(0,245,255,0.4)" : "rgba(0,245,255,0.15)"}`,
              background: dlState === "done" ? "rgba(0,255,136,0.06)" : hovDl ? "rgba(0,245,255,0.08)" : "rgba(0,245,255,0.03)",
              color: dlState === "done" ? "#00FF88" : "#00F5FF",
              boxShadow: hovDl && dlState === "idle" ? "0 0 20px rgba(0,245,255,0.2)" : "none",
              cursor: dlState === "generating" ? "wait" : "pointer",
            }}
          >
            {dlState === "generating" && (
              <span className="spin-slow inline-block h-[8px] w-[8px] rounded-full border-[1.5px]"
                style={{ borderColor: "rgba(0,245,255,0.2)", borderTopColor: "#00F5FF" }} />
            )}
            {dlState === "done" ? "✓ DOWNLOADED" : dlState === "generating" ? "COMPILING..." : "↓ EXPORT REPORT"}
          </button>

          {/* New scan */}
          <button
            onClick={onReset}
            onMouseEnter={() => setHovReset(true)}
            onMouseLeave={() => setHovReset(false)}
            className="font-mono-tech whitespace-nowrap rounded-[3px] px-4 py-2 transition-all duration-200 cursor-pointer border bg-transparent"
            style={{
              fontSize: "9px",
              letterSpacing: "0.15em",
              color: hovReset ? "#666" : "#333",
              borderColor: hovReset ? "#333" : "#1a1a1a",
            }}
          >
            ← NEW TARGET
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="fade-up mb-4 grid grid-cols-2 gap-[8px] md:grid-cols-4" style={{ animationDelay: "0.1s" }}>
        {metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-[4px] p-4 text-center"
            style={{
              border: "1px solid rgba(255,255,255,0.05)",
              background: "rgba(255,255,255,0.015)",
            }}
          >
            <div
              className="font-orbitron font-black leading-[1] mb-2"
              style={{ fontSize: "clamp(24px, 4vw, 32px)", color: m.color, textShadow: m.color === "#00F5FF" ? "0 0 20px rgba(0,245,255,0.5)" : "none" }}
            >
              <AnimatedCounter to={m.val} />
            </div>
            <div
              className="font-mono-tech"
              style={{ fontSize: "7px", letterSpacing: "0.15em", color: "#333" }}
            >
              {m.label}
            </div>
          </div>
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

      {/* Filter tabs */}
      <div
        className="fade-up mb-4 flex gap-2"
        style={{ animationDelay: "0.22s" }}
      >
        {(["All", "High", "Medium", "Low"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="font-mono-tech cursor-pointer rounded-[3px] px-4 py-[6px] transition-all duration-200 border bg-transparent"
            style={{
              fontSize: "9px",
              letterSpacing: "0.12em",
              border: `1px solid ${filter === f ? "rgba(0,245,255,0.25)" : "rgba(255,255,255,0.04)"}`,
              background: filter === f ? "rgba(0,245,255,0.06)" : "transparent",
              color: filter === f ? "#00F5FF" : "#333",
              boxShadow: filter === f ? "0 0 10px rgba(0,245,255,0.1)" : "none",
            }}
          >
            {f.toUpperCase()}
          </button>
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
