import { type FC, useState } from "react";
import type { Issue, Severity } from "../../types";

interface HeatMapProps {
  issues: Issue[];
}

const SEV_WEIGHT: Record<Severity, number> = { High: 10, Medium: 5, Low: 2 };

const SEV_CELL: Record<
  string,
  { bg: string; border: string; text: string; rgb: string }
> = {
  High: {
    bg: "rgba(255,0,64,0.15)",
    border: "rgba(255,0,64,0.45)",
    text: "#FF0040",
    rgb: "255,0,64",
  },
  Medium: {
    bg: "rgba(255,180,0,0.12)",
    border: "rgba(255,180,0,0.4)",
    text: "#FFB400",
    rgb: "255,180,0",
  },
  Low: {
    bg: "rgba(0,245,255,0.07)",
    border: "rgba(0,245,255,0.22)",
    text: "#00F5FF",
    rgb: "0,245,255",
  },
  none: {
    bg: "rgba(255,255,255,0.01)",
    border: "rgba(255,255,255,0.04)",
    text: "#222",
    rgb: "255,255,255",
  },
};

function riskColor(score: number, max: number): string {
  const t = max === 0 ? 0 : Math.min(score / max, 1);
  if (t === 0) return "rgba(255,255,255,0.03)";
  if (t < 0.3) return `rgba(0,245,255,${0.15 + t * 0.4})`;
  if (t < 0.6) return `rgba(255,180,0,${0.2 + t * 0.35})`;
  return `rgba(255,0,64,${0.25 + t * 0.5})`;
}

function riskLabel(
  score: number,
  max: number,
): { label: string; color: string } {
  const t = max === 0 ? 0 : score / max;
  if (t === 0) return { label: "CLEAN", color: "#333" };
  if (t < 0.3) return { label: "LOW RISK", color: "#00F5FF" };
  if (t < 0.6) return { label: "MODERATE", color: "#FFB400" };
  return { label: "CRITICAL", color: "#FF0040" };
}

function formatPageLabel(page: string): string {
  try {
    const u = new URL(page);
    return u.pathname === "/" ? u.hostname : u.pathname;
  } catch {
    return page || "/";
  }
}

const HeatMap: FC<HeatMapProps> = ({ issues }) => {
  const [hovRow, setHovRow] = useState<string | null>(null);
  const [hovCol, setHovCol] = useState<string | null>(null);

  const pages = Array.from(new Set(issues.map((i) => i.page)));
  const issueTypes = Array.from(new Set(issues.map((i) => i.issue_type)));

  const matrix: Record<string, Record<string, Severity | null>> = {};
  for (const page of pages) {
    matrix[page] = {};
    for (const type of issueTypes) {
      const matches = issues.filter(
        (i) => i.page === page && i.issue_type === type,
      );
      if (!matches.length) {
        matrix[page][type] = null;
        continue;
      }
      const hasHigh = matches.some((m) => m.severity === "High");
      const hasMed = matches.some((m) => m.severity === "Medium");
      matrix[page][type] = hasHigh ? "High" : hasMed ? "Medium" : "Low";
    }
  }

  const pageScores: Record<string, number> = {};
  for (const page of pages)
    pageScores[page] = issues
      .filter((i) => i.page === page)
      .reduce((acc, i) => acc + SEV_WEIGHT[i.severity], 0);
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
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ borderBottom: "1px solid rgba(0,245,255,0.06)" }}
      >
        <div className="flex items-center gap-2">
          <span
            style={{
              display: "inline-block",
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "#00F5FF",
              boxShadow: "0 0 6px #00F5FF",
            }}
          />
          <span
            className="font-mono-tech"
            style={{
              fontSize: "9px",
              letterSpacing: "0.2em",
              color: "rgba(0,245,255,0.7)",
            }}
          >
            ANOMALY HEATMAP
          </span>
        </div>
        <span
          className="font-mono-tech"
          style={{
            fontSize: "9px",
            letterSpacing: "0.15em",
            color: "rgba(0,245,255,0.45)",
          }}
        >
          {pages.length} NODES · {issueTypes.length} VECTORS
        </span>
      </div>

      <div className="p-5">
        <div
          className="font-mono-tech mb-4"
          style={{
            fontSize: "9px",
            letterSpacing: "0.2em",
            color: "rgba(0,245,255,0.35)",
          }}
        >
          — ISSUE DENSITY MATRIX —
        </div>

        {/* Scrollable matrix */}
        <div
          style={{
            overflowX: "auto",
            WebkitOverflowScrolling:
              "touch" as React.CSSProperties["WebkitOverflowScrolling"],
          }}
        >
          <table
            style={{
              borderCollapse: "separate",
              borderSpacing: "4px",
              minWidth: "100%",
            }}
          >
            <thead>
              <tr>
                <th style={{ minWidth: "130px", paddingBottom: "8px" }} />
                {issueTypes.map((type) => {
                  const active = hovCol === type;
                  return (
                    <th
                      key={type}
                      style={{
                        width: "90px",
                        minWidth: "90px",
                        paddingBottom: "10px",
                        verticalAlign: "bottom",
                        textAlign: "center",
                      }}
                    >
                      <span
                        style={{
                          display: "block",
                          height: "2px",
                          borderRadius: "1px",
                          marginBottom: "7px",
                          background: active
                            ? "linear-gradient(90deg,transparent,#00F5FF,transparent)"
                            : "rgba(255,255,255,0.04)",
                          transition: "all 0.15s",
                        }}
                      />
                      {/* Rotated text — never overflows */}
                      <span
                        style={{
                          display: "inline-block",
                          writingMode:
                            "vertical-lr" as React.CSSProperties["writingMode"],
                          transform: "rotate(180deg)",
                          fontSize: "8px",
                          letterSpacing: "0.1em",
                          fontWeight: 700,
                          color: active ? "#00F5FF" : "#5a6a88",
                          textShadow: active
                            ? "0 0 10px rgba(0,245,255,0.8)"
                            : "none",
                          transition: "color 0.15s",
                          whiteSpace: "nowrap",
                          maxHeight: "110px",
                          overflow: "hidden",
                          fontFamily: "'Share Tech Mono', monospace",
                        }}
                      >
                        {type.toUpperCase()}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => (
                <tr
                  key={page}
                  onMouseEnter={() => setHovRow(page)}
                  onMouseLeave={() => {
                    setHovRow(null);
                    setHovCol(null);
                  }}
                >
                  {/* Row label */}
                  <td
                    title={page}
                    style={{
                      fontFamily: "'Share Tech Mono', monospace",
                      fontSize: "9px",
                      letterSpacing: "0.06em",
                      color: hovRow === page ? "#00F5FF" : "#6677aa",
                      paddingRight: "12px",
                      verticalAlign: "middle",
                      maxWidth: "130px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      textShadow:
                        hovRow === page
                          ? "0 0 10px rgba(0,245,255,0.8)"
                          : "none",
                      transition: "color 0.15s",
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <span
                        style={{
                          display: "inline-block",
                          width: "2px",
                          height: "14px",
                          borderRadius: "1px",
                          flexShrink: 0,
                          background:
                            hovRow === page
                              ? "linear-gradient(180deg,transparent,#00F5FF,transparent)"
                              : "rgba(255,255,255,0.06)",
                          transition: "all 0.15s",
                        }}
                      />
                      {formatPageLabel(page)}
                    </span>
                  </td>

                  {/* Cells */}
                  {issueTypes.map((type) => {
                    const sev = matrix[page][type];
                    const s = sev ? SEV_CELL[sev] : SEV_CELL.none;
                    const isRowHov = hovRow === page;
                    const isColHov = hovCol === type;
                    const focused = isRowHov && isColHov;
                    const crosslit = (isRowHov || isColHov) && !focused;

                    return (
                      <td
                        key={type}
                        style={{
                          textAlign: "center",
                          verticalAlign: "middle",
                          padding: "0",
                        }}
                      >
                        <div
                          onMouseEnter={() => setHovCol(type)}
                          onMouseLeave={() => setHovCol(null)}
                          title={
                            sev
                              ? `${formatPageLabel(page)} · ${type} · ${sev}`
                              : `${formatPageLabel(page)} · ${type} · Clean`
                          }
                          style={{
                            height: "46px",
                            minWidth: "90px",
                            borderRadius: "4px",
                            position: "relative",
                            overflow: "hidden",
                            cursor: "default",
                            transition: "all 0.15s ease",
                            transform:
                              focused && sev ? "scale(1.05)" : "scale(1)",
                            border: focused
                              ? `1px solid ${s.border}`
                              : crosslit && sev
                                ? `1px solid rgba(${s.rgb},0.28)`
                                : crosslit
                                  ? "1px solid rgba(0,245,255,0.09)"
                                  : sev
                                    ? `1px solid rgba(${s.rgb},0.18)`
                                    : "1px solid rgba(255,255,255,0.05)",
                            background:
                              focused && sev
                                ? `rgba(${s.rgb},0.22)`
                                : focused
                                  ? "rgba(0,245,255,0.04)"
                                  : crosslit && sev
                                    ? `rgba(${s.rgb},0.1)`
                                    : sev
                                      ? `rgba(${s.rgb},0.07)`
                                      : "rgba(255,255,255,0.012)",
                            boxShadow:
                              focused && sev
                                ? `0 0 14px rgba(${s.rgb},0.4), 0 0 32px rgba(${s.rgb},0.15)`
                                : "none",
                          }}
                        >
                          {focused && (
                            <div
                              className="scan-sweep"
                              style={{ opacity: 0.35 }}
                            />
                          )}
                          <div
                            style={{
                              position: "absolute",
                              inset: 0,
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "3px",
                            }}
                          >
                            {sev ? (
                              <>
                                <span
                                  style={{
                                    display: "inline-block",
                                    width: focused ? "6px" : "4px",
                                    height: focused ? "6px" : "4px",
                                    borderRadius: "50%",
                                    background: s.text,
                                    boxShadow: `0 0 ${focused ? "8px" : "4px"} ${s.text}88`,
                                    transition: "all 0.15s",
                                  }}
                                />
                                <span
                                  style={{
                                    fontFamily: "'Share Tech Mono', monospace",
                                    fontSize: "7px",
                                    letterSpacing: "0.1em",
                                    fontWeight: 700,
                                    color: s.text,
                                    textShadow: focused
                                      ? `0 0 8px ${s.text}`
                                      : "none",
                                    transition: "all 0.15s",
                                  }}
                                >
                                  {sev.toUpperCase()}
                                </span>
                              </>
                            ) : (
                              <span
                                style={{
                                  fontSize: "11px",
                                  color: crosslit
                                    ? "rgba(0,245,255,0.15)"
                                    : "rgba(255,255,255,0.07)",
                                  transition: "color 0.15s",
                                }}
                              >
                                —
                              </span>
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
        <div
          className="mt-4 flex items-center gap-5"
          style={{ paddingLeft: "142px" }}
        >
          {(["High", "Medium", "Low"] as Severity[]).map((s) => (
            <div key={s} className="flex items-center gap-[5px]">
              <span
                style={{
                  display: "inline-block",
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: SEV_CELL[s].text,
                  boxShadow: `0 0 5px ${SEV_CELL[s].text}88`,
                }}
              />
              <span
                style={{
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: "8px",
                  color: SEV_CELL[s].text,
                  letterSpacing: "0.1em",
                  fontWeight: 700,
                }}
              >
                {s.toUpperCase()}
              </span>
            </div>
          ))}
          <div className="flex items-center gap-[5px]">
            <span
              style={{
                display: "inline-block",
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.14)",
              }}
            />
            <span
              style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: "8px",
                color: "#556677",
                letterSpacing: "0.1em",
              }}
            >
              CLEAN
            </span>
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            margin: "20px 0",
            height: "1px",
            background:
              "linear-gradient(90deg,transparent,rgba(0,245,255,0.07) 30%,rgba(0,245,255,0.07) 70%,transparent)",
          }}
        />

        {/* Risk bars */}
        <div
          style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: "9px",
            letterSpacing: "0.2em",
            color: "rgba(0,245,255,0.35)",
            marginBottom: "14px",
          }}
        >
          — PAGE RISK SCORE —
        </div>

        <div className="flex flex-col gap-3">
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
                  onMouseLeave={() => setHovRow(null)}
                >
                  <div className="flex items-center justify-between mb-[5px]">
                    <span
                      title={page}
                      style={{
                        fontFamily: "'Share Tech Mono', monospace",
                        fontSize: "9px",
                        letterSpacing: "0.06em",
                        color: isHov ? "rgba(0,245,255,0.9)" : "#7788aa",
                        transition: "color 0.15s",
                        maxWidth: "55%",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatPageLabel(page)}
                    </span>
                    <div className="flex items-center gap-3">
                      <span
                        style={{
                          fontFamily: "'Share Tech Mono', monospace",
                          fontSize: "8px",
                          letterSpacing: "0.1em",
                          color,
                          transition: "color 0.15s",
                        }}
                      >
                        {label}
                      </span>
                      <span
                        style={{
                          fontFamily: "'Share Tech Mono', monospace",
                          fontSize: "9px",
                          color: isHov ? color : "#445566",
                          minWidth: "22px",
                          textAlign: "right",
                          transition: "color 0.15s",
                        }}
                      >
                        {score}
                      </span>
                    </div>
                  </div>

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
                        transition:
                          "width 0.6s cubic-bezier(0.34,1.1,0.64,1), box-shadow 0.2s",
                      }}
                    />
                  </div>

                  <div className="mt-[6px] flex flex-wrap gap-1">
                    {issues
                      .filter((i) => i.page === page)
                      .map((issue, idx) => {
                        const pc =
                          issue.severity === "High"
                            ? "#FF0040"
                            : issue.severity === "Medium"
                              ? "#FFB400"
                              : "#00F5FF";
                        return (
                          <span
                            key={idx}
                            style={{
                              fontFamily: "'Share Tech Mono', monospace",
                              fontSize: "7px",
                              letterSpacing: "0.05em",
                              padding: "2px 7px",
                              borderRadius: "2px",
                              background: `${pc}12`,
                              border: `1px solid ${pc}40`,
                              color: `${pc}bb`,
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

        {/* Score key */}
        <div
          className="mt-4 flex items-center justify-between"
          style={{
            padding: "8px 12px",
            borderRadius: "3px",
            border: "1px solid rgba(255,255,255,0.03)",
            background: "rgba(255,255,255,0.006)",
          }}
        >
          <span
            style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: "8px",
              letterSpacing: "0.1em",
              color: "rgba(255,255,255,0.22)",
            }}
          >
            HIGH=10pts · MEDIUM=5pts · LOW=2pts
          </span>
          <span
            style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: "8px",
              color: "rgba(0,245,255,0.3)",
              letterSpacing: "0.1em",
            }}
          >
            MAX: {maxScore}pts
          </span>
        </div>
      </div>
    </div>
  );
};

export default HeatMap;
