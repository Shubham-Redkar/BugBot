import { type FC, useState } from "react";
import { SEV } from "../../lib/constants";
import { type Issue } from "../../types";

interface IssueCardProps {
  issue: Issue;
  index: number;
}

const IssueCard: FC<IssueCardProps> = ({ issue, index }) => {
  const [open, setOpen] = useState<boolean>(false);
  const [hov, setHov] = useState<boolean>(false);
  const [imgError, setImgError] = useState<boolean>(false);
  const [imgLoaded, setImgLoaded] = useState<boolean>(false);
  const [lightbox, setLightbox] = useState<boolean>(false);
  const s = SEV[issue.severity];

  const hasScreenshot = !!issue.screenshot && !imgError;

  const aiRows = [
    {
      label: "◈ NEURAL ANALYSIS",
      val: issue.explanation,
      labelColor: "rgba(0,245,255,0.35)",
      valColor: "#8a9bb5",
    },
    {
      label: "◎ IMPACT VECTOR",
      val: issue.impact,
      labelColor: "rgba(255,180,0,0.45)",
      valColor: "#9a8e7a",
    },
    {
      label: "⬡ REMEDIATION PROTOCOL",
      val: issue.fix_suggestion,
      labelColor: "rgba(0,245,255,0.55)",
      valColor: "rgba(0,245,255,0.82)",
    },
  ];

  return (
    <>
      <div
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        className="cursor-pointer overflow-hidden rounded-[4px] transition-all duration-200"
        style={{
          background: hov ? "rgba(0,245,255,0.025)" : "rgba(255,255,255,0.012)",
          border: `1px solid ${hov ? "rgba(0,245,255,0.15)" : "rgba(255,255,255,0.05)"}`,
          boxShadow: hov ? "0 0 20px rgba(0,245,255,0.05)" : "none",
          animation: `fadeUp 0.5s ${index * 0.08}s ease both`,
          opacity: 0,
        }}
      >
        <div className="flex items-start gap-4 px-5 py-4">
          {/* Severity dot */}
          <div
            className="mt-[6px] h-[6px] w-[6px] shrink-0 rounded-full"
            style={{ background: s.dot, boxShadow: s.bloom }}
          />

          <div className="min-w-0 flex-1">
            {/* Header */}
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span
                className="font-orbitron"
                style={{
                  fontSize: "11px",
                  color: "#FFFFFF",
                  letterSpacing: "0.08em",
                }}
              >
                {issue.issue_type}
              </span>
              <span
                className="font-mono-tech rounded-[2px] px-2 py-[2px]"
                style={{
                  fontSize: "8px",
                  letterSpacing: "0.15em",
                  background: s.bg,
                  color: s.text,
                  border: `1px solid ${s.border}`,
                  boxShadow: s.bloom,
                }}
              >
                {issue.severity.toUpperCase()}
              </span>
              <span
                className="font-mono-tech"
                style={{
                  fontSize: "9px",
                  color: "rgba(0,245,255,0.3)",
                  letterSpacing: "0.1em",
                }}
              >
                {issue.page}
              </span>
              {/* Screenshot indicator badge */}
              {hasScreenshot && (
                <span
                  className="font-mono-tech"
                  style={{
                    fontSize: "7px",
                    letterSpacing: "0.12em",
                    padding: "1px 6px",
                    borderRadius: "2px",
                    background: "rgba(0,245,255,0.06)",
                    border: "1px solid rgba(0,245,255,0.15)",
                    color: "rgba(0,245,255,0.5)",
                  }}
                >
                  ◉ SCREENSHOT
                </span>
              )}
            </div>

            <div
              className="font-exo"
              style={{
                fontSize: "13px",
                lineHeight: 1.7,
                color: "#b0bec8",
                letterSpacing: "0.01em",
              }}
            >
              {issue.description}
            </div>
          </div>

          {/* Expand toggle */}
          <div
            className="shrink-0 font-mono-tech transition-transform duration-200"
            style={{
              fontSize: "10px",
              color: hov ? "rgba(0,245,255,0.5)" : "rgba(255,255,255,0.2)",
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              marginTop: "2px",
            }}
          >
            ▾
          </div>
        </div>

        {/* Expanded panel */}
        {open && (
          <div
            className="px-5 pt-4 pb-5 pl-[42px]"
            style={{
              borderTop: "1px solid rgba(0,245,255,0.07)",
              background: "rgba(0,0,0,0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Screenshot */}
            {hasScreenshot && (
              <div className="mb-5">
                <div
                  className="font-mono-tech mb-2 flex items-center gap-2"
                  style={{
                    fontSize: "8px",
                    letterSpacing: "0.2em",
                    color: "rgba(0,245,255,0.35)",
                  }}
                >
                  ◉ PAGE SCREENSHOT
                  <div
                    style={{
                      flex: 1,
                      height: "1px",
                      background:
                        "linear-gradient(90deg, rgba(0,245,255,0.2), transparent)",
                      opacity: 0.5,
                    }}
                  />
                </div>
                <div
                  onClick={() => setLightbox(true)}
                  style={{
                    position: "relative",
                    borderRadius: "4px",
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
                  {/* Loading skeleton */}
                  {!imgLoaded && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(0,245,255,0.03)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <span
                        className="font-mono-tech"
                        style={{
                          fontSize: "8px",
                          letterSpacing: "0.15em",
                          color: "rgba(0,245,255,0.3)",
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
                      transition: "opacity 0.2s",
                    }}
                  />
                  {/* Zoom hint overlay */}
                  {imgLoaded && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 40%)",
                        display: "flex",
                        alignItems: "flex-end",
                        justifyContent: "flex-end",
                        padding: "8px",
                        opacity: 0,
                        transition: "opacity 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLDivElement).style.opacity = "1";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.opacity = "0";
                      }}
                    >
                      <span
                        className="font-mono-tech"
                        style={{
                          fontSize: "7px",
                          letterSpacing: "0.15em",
                          color: "rgba(0,245,255,0.8)",
                          padding: "3px 8px",
                          background: "rgba(0,0,0,0.6)",
                          borderRadius: "2px",
                          border: "1px solid rgba(0,245,255,0.2)",
                        }}
                      >
                        ⊕ EXPAND
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* AI analysis rows */}
            <div className="flex flex-col gap-5">
              {aiRows.map((row) => (
                <div key={row.label}>
                  <div
                    className="font-mono-tech mb-[7px] flex items-center gap-2"
                    style={{
                      fontSize: "8px",
                      letterSpacing: "0.2em",
                      color: row.labelColor,
                    }}
                  >
                    {row.label}
                    <div
                      style={{
                        flex: 1,
                        height: "1px",
                        background: `linear-gradient(90deg, ${row.labelColor}, transparent)`,
                        opacity: 0.5,
                      }}
                    />
                  </div>
                  <div
                    className="font-exo"
                    style={{
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
            WebkitBackdropFilter: "blur(8px)",
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
                borderRadius: "4px",
                border: "1px solid rgba(0,245,255,0.15)",
                boxShadow: "0 0 60px rgba(0,0,0,0.8)",
              }}
            />
            {/* Meta bar */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                padding: "10px 14px",
                background: "rgba(0,0,0,0.75)",
                borderRadius: "0 0 4px 4px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                className="font-mono-tech"
                style={{
                  fontSize: "8px",
                  letterSpacing: "0.12em",
                  color: "rgba(0,245,255,0.6)",
                }}
              >
                {issue.page}
              </span>
              <span
                className="font-mono-tech"
                style={{
                  fontSize: "7px",
                  letterSpacing: "0.15em",
                  color: "rgba(255,255,255,0.3)",
                }}
              >
                CLICK ANYWHERE TO CLOSE
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default IssueCard;
