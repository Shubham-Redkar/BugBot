import { type FC, useState } from "react";
import { SEV } from "../../lib/constants";
import { type Issue } from "../../types";

interface IssueCardProps {
  issue: Issue;
  index: number;
}

const IssueCard: FC<IssueCardProps> = ({ issue, index }) => {
  const [open, setOpen] = useState(false);
  const [hov, setHov] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const s = SEV[issue.severity];
  const hasScreenshot = !!issue.screenshot && !imgError;

  const aiRows = [
    {
      label: "◈ NEURAL ANALYSIS",
      val: issue.explanation,
      labelColor: "rgba(0,245,255,0.4)",
      valColor: "#8090a8",
    },
    {
      label: "◎ IMPACT VECTOR",
      val: issue.impact,
      labelColor: "rgba(255,180,0,0.5)",
      valColor: "#90806a",
    },
    {
      label: "⬡ REMEDIATION PROTOCOL",
      val: issue.fix_suggestion,
      labelColor: "rgba(0,245,255,0.6)",
      valColor: "rgba(0,245,255,0.85)",
    },
  ];

  return (
    <>
      <div
        style={{
          borderRadius: "8px",
          overflow: "hidden",
          border: `1px solid ${hov ? "rgba(0,245,255,0.18)" : open ? "rgba(0,245,255,0.12)" : "rgba(255,255,255,0.055)"}`,
          background: hov ? "rgba(0,245,255,0.028)" : "rgba(255,255,255,0.013)",
          animation: `fadeUp 0.55s ${index * 0.07}s ease both`,
          opacity: 0,
          transform: hov ? "translateY(-2px)" : "translateY(0)",
          transition:
            "border-color 0.2s,background 0.2s,transform 0.2s,box-shadow 0.2s",
          boxShadow: hov
            ? "0 8px 32px rgba(0,0,0,0.5),0 0 16px rgba(0,245,255,0.04)"
            : open
              ? "0 4px 20px rgba(0,0,0,0.4)"
              : "none",
          cursor: "pointer",
        }}
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
      >
        {/* ── Header row ── */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "14px",
            padding: "16px 20px",
          }}
        >
          {/* Severity dot + left accent line */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              paddingTop: "6px",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: s.dot,
                boxShadow: s.bloom,
                flexShrink: 0,
              }}
            />
            {open && (
              <div
                style={{
                  width: 1,
                  flex: 1,
                  minHeight: "8px",
                  background: `linear-gradient(to bottom,${s.dot}60,transparent)`,
                  marginTop: "4px",
                }}
              />
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: "8px",
                marginBottom: "6px",
              }}
            >
              <span
                style={{
                  fontFamily: "'Orbitron',monospace",
                  fontSize: "11px",
                  color: "#fff",
                  letterSpacing: "0.08em",
                }}
              >
                {issue.issue_type}
              </span>
              <span
                style={{
                  fontFamily: "'Share Tech Mono',monospace",
                  fontSize: "8px",
                  letterSpacing: "0.15em",
                  padding: "2px 8px",
                  borderRadius: "3px",
                  background: s.bg,
                  color: s.text,
                  border: `1px solid ${s.border}`,
                  boxShadow: s.bloom,
                }}
              >
                {issue.severity.toUpperCase()}
              </span>
              <span
                style={{
                  fontFamily: "'Share Tech Mono',monospace",
                  fontSize: "9px",
                  color: "rgba(0,245,255,0.3)",
                  letterSpacing: "0.1em",
                }}
              >
                {issue.page}
              </span>
              {hasScreenshot && (
                <span
                  style={{
                    fontFamily: "'Share Tech Mono',monospace",
                    fontSize: "7px",
                    letterSpacing: "0.12em",
                    padding: "1px 7px",
                    borderRadius: "3px",
                    background: "rgba(0,245,255,0.06)",
                    border: "1px solid rgba(0,245,255,0.18)",
                    color: "rgba(0,245,255,0.55)",
                  }}
                >
                  ◉ SCREENSHOT
                </span>
              )}
            </div>
            <div
              style={{
                fontFamily: "'Exo 2',sans-serif",
                fontSize: "13px",
                lineHeight: 1.7,
                color: "#a0b0c0",
                letterSpacing: "0.01em",
              }}
            >
              {issue.description}
            </div>
          </div>

          {/* Expand chevron */}
          <div
            style={{
              flexShrink: 0,
              fontFamily: "'Share Tech Mono',monospace",
              fontSize: "12px",
              color: hov ? "rgba(0,245,255,0.55)" : "rgba(255,255,255,0.18)",
              transform: open ? "rotate(180deg)" : "rotate(0)",
              transition: "transform 0.25s ease,color 0.2s",
              marginTop: "2px",
            }}
          >
            ▾
          </div>
        </div>

        {/* ── Expanded panel ── */}
        {open && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              borderTop: "1px solid rgba(0,245,255,0.07)",
              background: "rgba(0,0,0,0.28)",
              padding: "20px 20px 22px 40px",
              animation: "expandDown 0.25s ease both",
            }}
          >
            {/* Screenshot */}
            {hasScreenshot && (
              <div style={{ marginBottom: "20px" }}>
                <div
                  style={{
                    fontFamily: "'Share Tech Mono',monospace",
                    fontSize: "8px",
                    letterSpacing: "0.2em",
                    color: "rgba(0,245,255,0.35)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "8px",
                  }}
                >
                  ◉ PAGE SCREENSHOT
                  <div
                    style={{
                      flex: 1,
                      height: "1px",
                      background:
                        "linear-gradient(90deg,rgba(0,245,255,0.18),transparent)",
                      opacity: 0.6,
                    }}
                  />
                </div>
                <div
                  onClick={() => setLightbox(true)}
                  style={{
                    position: "relative",
                    borderRadius: "6px",
                    overflow: "hidden",
                    border: "1px solid rgba(0,245,255,0.12)",
                    background: "rgba(0,0,0,0.4)",
                    cursor: "zoom-in",
                    maxHeight: "200px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {!imgLoaded && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'Share Tech Mono',monospace",
                          fontSize: "8px",
                          color: "rgba(0,245,255,0.3)",
                          letterSpacing: "0.15em",
                        }}
                      >
                        LOADING...
                      </span>
                    </div>
                  )}
                  <img
                    src={issue.screenshot!}
                    alt={`Screenshot of ${issue.page}`}
                    onLoad={() => setImgLoaded(true)}
                    onError={() => setImgError(true)}
                    style={{
                      width: "100%",
                      maxHeight: "200px",
                      objectFit: "cover",
                      objectPosition: "top",
                      display: imgLoaded ? "block" : "none",
                    }}
                  />
                  {imgLoaded && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: 0,
                        right: 0,
                        padding: "6px 10px",
                        background: "rgba(0,0,0,0.7)",
                        borderRadius: "6px 0 6px 0",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'Share Tech Mono',monospace",
                          fontSize: "7px",
                          letterSpacing: "0.15em",
                          color: "rgba(0,245,255,0.7)",
                        }}
                      >
                        ⊕ EXPAND
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* AI rows */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "18px" }}
            >
              {aiRows.map((row) => (
                <div key={row.label}>
                  <div
                    style={{
                      fontFamily: "'Share Tech Mono',monospace",
                      fontSize: "8px",
                      letterSpacing: "0.2em",
                      color: row.labelColor,
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "7px",
                    }}
                  >
                    {row.label}
                    <div
                      style={{
                        flex: 1,
                        height: "1px",
                        background: `linear-gradient(90deg,${row.labelColor},transparent)`,
                        opacity: 0.4,
                      }}
                    />
                  </div>
                  <div
                    style={{
                      fontFamily: "'Exo 2',sans-serif",
                      fontSize: "13px",
                      lineHeight: 1.75,
                      color: row.valColor,
                      letterSpacing: "0.01em",
                    }}
                  >
                    {row.val}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && issue.screenshot && (
        <div
          onClick={() => setLightbox(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            background: "rgba(0,0,0,0.92)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "zoom-out",
            padding: "40px",
          }}
        >
          <div
            style={{
              position: "relative",
              maxWidth: "90vw",
              maxHeight: "85vh",
            }}
          >
            <img
              src={issue.screenshot}
              alt={`Screenshot of ${issue.page}`}
              style={{
                maxWidth: "100%",
                maxHeight: "85vh",
                objectFit: "contain",
                borderRadius: "6px",
                border: "1px solid rgba(0,245,255,0.15)",
                boxShadow: "0 0 60px rgba(0,0,0,0.9)",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                padding: "10px 14px",
                background: "rgba(0,0,0,0.7)",
                borderRadius: "0 0 6px 6px",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontFamily: "'Share Tech Mono',monospace",
                  fontSize: "8px",
                  color: "rgba(0,245,255,0.6)",
                  letterSpacing: "0.12em",
                }}
              >
                {issue.page}
              </span>
              <span
                style={{
                  fontFamily: "'Share Tech Mono',monospace",
                  fontSize: "7px",
                  color: "rgba(255,255,255,0.28)",
                  letterSpacing: "0.15em",
                }}
              >
                CLICK TO CLOSE
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default IssueCard;
