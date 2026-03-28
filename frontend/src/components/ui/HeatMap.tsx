import { type FC, useState } from "react";
import type { Issue, Severity } from "../../types";

interface HeatMapProps {
  issues: Issue[];
}

const SEV_WEIGHT: Record<Severity, number> = {
  High: 10,
  Medium: 5,
  Low: 2,
};

const SEV_CELL: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  High: {
    bg: "rgba(255,0,64,0.18)",
    border: "rgba(255,0,64,0.5)",
    text: "#FF0040",
    glow: "0 0 12px rgba(255,0,64,0.4), 0 0 30px rgba(255,0,64,0.15)",
  },
  Medium: {
    bg: "rgba(255,180,0,0.15)",
    border: "rgba(255,180,0,0.45)",
    text: "#FFB400",
    glow: "0 0 12px rgba(255,180,0,0.35), 0 0 30px rgba(255,180,0,0.12)",
  },
  Low: {
    bg: "rgba(0,245,255,0.08)",
    border: "rgba(0,245,255,0.25)",
    text: "#00F5FF",
    glow: "0 0 10px rgba(0,245,255,0.3), 0 0 24px rgba(0,245,255,0.1)",
  },
  none: {
    bg: "rgba(255,255,255,0.012)",
    border: "rgba(255,255,255,0.04)",
    text: "#222",
    glow: "none",
  },
};

// Risk score colour ramp: 0 → dark, high → red
function riskColor(score: number, max: number): string {
  const t = max === 0 ? 0 : Math.min(score / max, 1);
  if (t === 0) return "rgba(255,255,255,0.03)";
  if (t < 0.3) return `rgba(0,245,255,${0.15 + t * 0.4})`;
  if (t < 0.6) return `rgba(255,180,0,${0.2 + t * 0.35})`;
  return `rgba(255,0,64,${0.25 + t * 0.5})`;
}

function riskBorder(score: number, max: number): string {
  const t = max === 0 ? 0 : Math.min(score / max, 1);
  if (t === 0) return "rgba(255,255,255,0.04)";
  if (t < 0.3) return `rgba(0,245,255,${0.2 + t * 0.4})`;
  if (t < 0.6) return `rgba(255,180,0,${0.25 + t * 0.4})`;
  return `rgba(255,0,64,${0.35 + t * 0.5})`;
}

function riskLabel(score: number, max: number): { label: string; color: string } {
  const t = max === 0 ? 0 : score / max;
  if (t === 0) return { label: "CLEAN", color: "#333" };
  if (t < 0.3) return { label: "LOW RISK", color: "#00F5FF" };
  if (t < 0.6) return { label: "MODERATE", color: "#FFB400" };
  return { label: "CRITICAL", color: "#FF0040" };
}

const HeatMap: FC<HeatMapProps> = ({ issues }) => {
  const [hovCell, setHovCell] = useState<string | null>(null);
  const [hovRow, setHovRow] = useState<string | null>(null);
  const [hovCol, setHovCol] = useState<string | null>(null);

  // Derive unique pages and issue types from data
  const pages = Array.from(new Set(issues.map((i) => i.page)));
  const issueTypes = Array.from(new Set(issues.map((i) => i.issue_type)));

  // Build matrix: page → issueType → worst severity found
  const matrix: Record<string, Record<string, Severity | null>> = {};
  for (const page of pages) {
    matrix[page] = {};
    for (const type of issueTypes) {
      const matches = issues.filter((i) => i.page === page && i.issue_type === type);
      if (matches.length === 0) {
        matrix[page][type] = null;
      } else {
        // Worst severity wins
        const haigh = matches.some((m) => m.severity === "High");
        const hasMed = matches.some((m) => m.severity === "Medium");
        matrix[page][type] = haigh ? "High" : hasMed ? "Medium" : "Low";
      }
    }
  }

  // Per-page risk score
  const pageScores: Record<string, number> = {};
  for (const page of pages) {
    pageScores[page] = issues
      .filter((i) => i.page === page)
      .reduce((acc, i) => acc + SEV_WEIGHT[i.severity], 0);
  }
  const maxScore = Math.max(...Object.values(pageScores), 1);

  return (
    <div
      className="fade-up rounded-[4px] overflow-hidden"
      style={{
        border: "1px solid rgba(0,245,255,0.08)",
        background: "rgba(0,0,0,0.35)",
        animationDelay: "0.28s",
      }}
    >
      {/* Section header */}
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ borderBottom: "1px solid rgba(0,245,255,0.06)" }}
      >
        <div className="flex items-center gap-2">
          <span
            style={{
              display: "inline-block", width: 5, height: 5,
              borderRadius: "50%", background: "#00F5FF",
              boxShadow: "0 0 6px #00F5FF",
            }}
          />
          <span
            className="font-mono-tech"
            style={{ fontSize: "9px", letterSpacing: "0.2em", color: "rgba(0,245,255,0.7)" }}
          >
            ANOMALY HEATMAP
          </span>
        </div>
        <span
          className="font-mono-tech"
          style={{ fontSize: "9px", letterSpacing: "0.15em", color: "rgba(0,245,255,0.45)" }}
        >
          {pages.length} NODES · {issueTypes.length} VECTORS
        </span>
      </div>

      <div className="p-5">

        {/* ── MATRIX ── */}
        <div className="font-mono-tech mb-1" style={{ fontSize: "10px", letterSpacing: "0.2em", color: "rgba(0,245,255,0.4)", marginBottom: "14px" }}>
          — ISSUE DENSITY MATRIX —
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "3px" }}>
            <thead>
              <tr>
                {/* Empty top-left corner */}
                <th style={{ width: "88px", paddingBottom: "6px" }} />
                {issueTypes.map((type) => {
                  const isColHov = hovCol === type;
                  return (
                    <th
                      key={type}
                      className="font-mono-tech"
                      style={{
                        fontSize: "8px",
                        letterSpacing: "0.14em",
                        color: isColHov ? "#00F5FF" : "#6677aa",
                        fontWeight: 700,
                        textAlign: "center",
                        paddingBottom: "10px",
                        whiteSpace: "nowrap",
                        textShadow: isColHov
                          ? "0 0 12px rgba(0,245,255,0.9), 0 0 30px rgba(0,245,255,0.5)"
                          : "none",
                        transition: "color 0.15s, text-shadow 0.15s",
                        position: "relative",
                      }}
                    >
                      {/* Active column underline indicator */}
                      <span style={{
                        display: "block",
                        height: "2px",
                        borderRadius: "1px",
                        marginBottom: "6px",
                        background: isColHov
                          ? "linear-gradient(90deg, transparent, #00F5FF, transparent)"
                          : "rgba(255,255,255,0.04)",
                        boxShadow: isColHov ? "0 0 8px rgba(0,245,255,0.6)" : "none",
                        transition: "all 0.15s",
                      }} />
                      {type.toUpperCase().replace(" ", "\u00A0")}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {pages.map((page, rowIdx) => (
                <tr key={page}>
                  {/* Row label */}
                  <td
                    className="font-mono-tech"
                    style={{
                      fontSize: "10px",
                      letterSpacing: "0.08em",
                      color: hovRow === page ? "#00F5FF" : "#6677aa",
                      paddingRight: "12px",
                      paddingTop: "3px",
                      paddingBottom: "3px",
                      whiteSpace: "nowrap",
                      verticalAlign: "middle",
                      textShadow: hovRow === page
                        ? "0 0 12px rgba(0,245,255,0.9), 0 0 30px rgba(0,245,255,0.5)"
                        : "none",
                      transition: "color 0.15s, text-shadow 0.15s",
                    }}
                  >
                    {/* Row indicator bar */}
                    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{
                        display: "inline-block",
                        width: "2px",
                        height: "14px",
                        borderRadius: "1px",
                        background: hovRow === page
                          ? "linear-gradient(180deg, transparent, #00F5FF, transparent)"
                          : "rgba(255,255,255,0.06)",
                        boxShadow: hovRow === page ? "0 0 6px rgba(0,245,255,0.6)" : "none",
                        transition: "all 0.15s",
                        flexShrink: 0,
                      }} />
                      {page}
                    </span>
                  </td>

                  {/* Cells */}
                  {issueTypes.map((type) => {
                    const sev = matrix[page][type];
                    const cellKey = `${page}-${type}`;
                    const s = sev ? SEV_CELL[sev] : SEV_CELL.none;
                    const isHov = hovCell === cellKey;
                    const isRowActive = hovRow === page;
                    const isColActive = hovCol === type;
                    const isCrosslit = (isRowActive || isColActive) && !isHov;

                    // Severity-specific config
                    const sevRgb =
                      sev === "High"   ? "255,0,64" :
                      sev === "Medium" ? "255,180,0" :
                      sev === "Low"    ? "0,245,255" : null;

                    return (
                      <td key={type} style={{ textAlign: "center", verticalAlign: "middle" }}>
                        <div
                          onMouseEnter={() => { setHovCell(cellKey); setHovRow(page); setHovCol(type); }}
                          onMouseLeave={() => { setHovCell(null); setHovRow(null); setHovCol(null); }}
                          title={sev ? `${page} · ${type} · ${sev}` : `${page} · ${type} · Clean`}
                          style={{
                            height: "44px",
                            minWidth: "80px",
                            borderRadius: "4px",
                            position: "relative",
                            overflow: "hidden",
                            cursor: "crosshair",
                            transition: "all 0.15s ease",
                            transform: isHov && sev ? "scale(1.06)" : "scale(1)",
                            // Border: hovered = full, crosslit = dim tint, filled idle = muted, empty = ghost
                            border: isHov
                              ? `1px solid ${s.border}`
                              : isCrosslit
                              ? sev
                                ? `1px solid rgba(${sevRgb},0.35)`
                                : "1px solid rgba(0,245,255,0.12)"
                              : sev
                              ? `1px solid rgba(${sevRgb},0.22)`
                              : "1px solid rgba(255,255,255,0.06)",
                            // Background
                            background: isHov && sev
                              ? `rgba(${sevRgb},0.28)`
                              : isHov && !sev
                              ? "rgba(0,245,255,0.05)"
                              : isCrosslit && sev
                              ? `rgba(${sevRgb},0.12)`
                              : isCrosslit && !sev
                              ? "rgba(0,245,255,0.03)"
                              : sev
                              ? `rgba(${sevRgb},0.10)`
                              : "rgba(255,255,255,0.018)",
                            // Glow
                            boxShadow: isHov && sev
                              ? `0 0 16px rgba(${sevRgb},0.5), 0 0 40px rgba(${sevRgb},0.2), inset 0 0 20px rgba(${sevRgb},0.08)`
                              : isCrosslit && sev
                              ? `0 0 8px rgba(${sevRgb},0.2)`
                              : "none",
                          }}
                        >
                          {/* Scan line on hover */}
                          {isHov && <div className="scan-sweep" style={{ opacity: 0.5 }} />}

                          {/* Corner tick marks on hover */}
                          {isHov && (
                            <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} viewBox="0 0 80 44">
                              {/* TL */}
                              <path d="M2 8 L2 2 L8 2" stroke={sev ? s.text : "#00F5FF"} strokeWidth="1" fill="none" opacity="0.7"/>
                              {/* TR */}
                              <path d="M72 2 L78 2 L78 8" stroke={sev ? s.text : "#00F5FF"} strokeWidth="1" fill="none" opacity="0.7"/>
                              {/* BL */}
                              <path d="M2 36 L2 42 L8 42" stroke={sev ? s.text : "#00F5FF"} strokeWidth="1" fill="none" opacity="0.7"/>
                              {/* BR */}
                              <path d="M72 42 L78 42 L78 36" stroke={sev ? s.text : "#00F5FF"} strokeWidth="1" fill="none" opacity="0.7"/>
                            </svg>
                          )}

                          {/* Content */}
                          <div style={{
                            position: "absolute", inset: 0,
                            display: "flex", flexDirection: "column",
                            alignItems: "center", justifyContent: "center", gap: "2px",
                          }}>
                            {sev ? (
                              <>
                                {/* Severity dot */}
                                <span style={{
                                  display: "inline-block",
                                  width: isHov ? "6px" : "4px",
                                  height: isHov ? "6px" : "4px",
                                  borderRadius: "50%",
                                  background: s.text,
                                  boxShadow: isHov ? `0 0 8px ${s.text}, 0 0 16px ${s.text}88` : `0 0 4px ${s.text}88`,
                                  transition: "all 0.15s",
                                  marginBottom: "1px",
                                }} />
                                <span
                                  className="font-mono-tech"
                                  style={{
                                    fontSize: isHov ? "8px" : "7px",
                                    letterSpacing: "0.12em",
                                    fontWeight: 700,
                                    color: s.text,
                                    textShadow: isHov
                                      ? `0 0 10px ${s.text}, 0 0 20px ${s.text}88`
                                      : `0 0 4px ${s.text}66`,
                                    transition: "all 0.15s",
                                  }}
                                >
                                  {sev.toUpperCase()}
                                </span>
                              </>
                            ) : (
                              <span style={{
                                fontSize: "11px",
                                color: isCrosslit ? "rgba(0,245,255,0.2)" : "rgba(255,255,255,0.1)",
                                transition: "color 0.15s",
                                lineHeight: 1,
                              }}>—</span>
                            )}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center gap-5" style={{ paddingLeft: "100px" }}>
          {(["High", "Medium", "Low"] as Severity[]).map((s) => (
            <div key={s} className="flex items-center gap-[6px]">
              <span style={{
                display: "inline-block", width: 8, height: 8, borderRadius: "50%",
                background: SEV_CELL[s].text,
                boxShadow: `0 0 6px ${SEV_CELL[s].text}88`,
              }} />
              <span className="font-mono-tech" style={{ fontSize: "8px", color: SEV_CELL[s].text, letterSpacing: "0.12em", fontWeight: 700 }}>
                {s.toUpperCase()}
              </span>
            </div>
          ))}
          <div className="flex items-center gap-[6px]">
            <span style={{
              display: "inline-block", width: 8, height: 8, borderRadius: "50%",
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.15)",
            }} />
            <span className="font-mono-tech" style={{ fontSize: "8px", color: "#556677", letterSpacing: "0.12em" }}>CLEAN</span>
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            margin: "20px 0",
            height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(0,245,255,0.08) 30%, rgba(0,245,255,0.08) 70%, transparent)",
          }}
        />

        {/* ── PER-PAGE RISK BARS ── */}
        <div className="font-mono-tech mb-3" style={{ fontSize: "10px", letterSpacing: "0.2em", color: "rgba(0,245,255,0.4)" }}>
          — PAGE RISK SCORE —
        </div>

        <div className="flex flex-col gap-[10px]">
          {pages
            .slice()
            .sort((a, b) => pageScores[b] - pageScores[a])
            .map((page) => {
              const score = pageScores[page];
              const pct = (score / maxScore) * 100;
              const { label, color } = riskLabel(score, maxScore);
              const isHov = hovRow === page;

              return (
                <div
                  key={page}
                  onMouseEnter={() => setHovRow(page)}
                  onMouseLeave={() => { setHovRow(null); setHovCol(null); }}
                  style={{ cursor: "default" }}
                >
                  {/* Row header */}
                  <div className="mb-[5px] flex items-center justify-between">
                    <span
                      className="font-mono-tech"
                      style={{
                        fontSize: "10px",
                        letterSpacing: "0.1em",
                        color: isHov ? "rgba(0,245,255,0.9)" : "#7788aa",
                        transition: "color 0.15s",
                      }}
                    >
                      {page}
                    </span>
                    <div className="flex items-center gap-3">
                      <span
                        className="font-mono-tech"
                        style={{ fontSize: "9px", letterSpacing: "0.15em", color, transition: "color 0.15s" }}
                      >
                        {label}
                      </span>
                      <span
                        className="font-mono-tech"
                        style={{ fontSize: "10px", color: isHov ? color : "#667788", minWidth: "28px", textAlign: "right", transition: "color 0.15s" }}
                      >
                        {score}
                      </span>
                    </div>
                  </div>

                  {/* Bar track */}
                  <div
                    style={{
                      height: "4px",
                      borderRadius: "2px",
                      background: "rgba(255,255,255,0.03)",
                      overflow: "hidden",
                      border: "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${pct}%`,
                        background: riskColor(score, maxScore),
                        borderRadius: "2px",
                        boxShadow: isHov ? `0 0 8px ${color}88` : "none",
                        transition: "width 0.6s cubic-bezier(0.34,1.1,0.64,1), box-shadow 0.2s ease",
                      }}
                    />
                  </div>

                  {/* Issue breakdown pills */}
                  <div className="mt-[6px] flex gap-[4px]">
                    {issues
                      .filter((i) => i.page === page)
                      .map((issue, idx) => {
                        const pillColor =
                          issue.severity === "High" ? "#FF0040"
                          : issue.severity === "Medium" ? "#FFB400"
                          : "#00F5FF";
                        return (
                          <span
                            key={idx}
                            className="font-mono-tech"
                            style={{
                              fontSize: "8px",
                              letterSpacing: "0.08em",
                              padding: "2px 8px",
                              borderRadius: "2px",
                              background: `${pillColor}18`,
                              border: `1px solid ${pillColor}55`,
                              color: `${pillColor}dd`,
                            }}
                          >
                            {issue.issue_type}
                          </span>
                        );
                      })}
                  </div>
                </div>
              );
            })}
        </div>

        {/* Score legend */}
        <div
          className="mt-4 flex items-center justify-between"
          style={{
            padding: "8px 12px",
            borderRadius: "3px",
            border: "1px solid rgba(255,255,255,0.03)",
            background: "rgba(255,255,255,0.008)",
          }}
        >
          <span className="font-mono-tech" style={{ fontSize: "9px", letterSpacing: "0.15em", color: "rgba(255,255,255,0.3)" }}>
            SCORE: HIGH=10pts · MEDIUM=5pts · LOW=2pts
          </span>
          <span className="font-mono-tech" style={{ fontSize: "9px", color: "rgba(0,245,255,0.35)", letterSpacing: "0.1em" }}>
            MAX: {maxScore}pts
          </span>
        </div>

      </div>
    </div>
  );
};

export default HeatMap;
