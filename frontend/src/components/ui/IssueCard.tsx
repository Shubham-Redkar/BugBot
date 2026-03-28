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
  const s = SEV[issue.severity];

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
          {/* Header row */}
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span
              className="font-orbitron"
              style={{ fontSize: "11px", color: "#FFFFFF", letterSpacing: "0.08em" }}
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
          </div>

          {/* Description — main body, clearly readable */}
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

      {/* Expanded AI panel */}
      {open && (
        <div
          className="flex flex-col gap-5 px-5 pt-4 pb-5 pl-[42px]"
          style={{
            borderTop: "1px solid rgba(0,245,255,0.07)",
            background: "rgba(0,0,0,0.25)",
          }}
        >
          {aiRows.map((row) => (
            <div key={row.label}>
              {/* Section label */}
              <div
                className="font-mono-tech mb-[7px] flex items-center gap-2"
                style={{ fontSize: "8px", letterSpacing: "0.2em", color: row.labelColor }}
              >
                {row.label}
                <div
                  style={{
                    flex: 1,
                    height: "1px",
                    background: `linear-gradient(90deg, ${row.labelColor.replace(")", ", 0.4)").replace("rgba(", "rgba(")}, transparent)`,
                    opacity: 0.5,
                  }}
                />
              </div>

              {/* Section body */}
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
      )}
    </div>
  );
};

export default IssueCard;
