import type { Issue, ScanResults, Severity } from "../types";

const SEV_COLOR: Record<Severity, string> = {
  High: "#FF0040",
  Medium: "#FFB400",
  Low: "#00AACC",
};

const SEV_BG: Record<Severity, string> = {
  High: "#fff0f3",
  Medium: "#fffbf0",
  Low: "#f0faff",
};

// ─── PDF REPORT STYLES (clean white, fully print-safe) ───────────────────────
const PDF_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Share+Tech+Mono&family=Inter:wght@400;500;600;700&display=swap');

@page { size: A4; margin: 14mm 16mm; }

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: #ffffff;
  color: #1a1a2e;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  line-height: 1.6;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.page { max-width: 780px; margin: 0 auto; }

/* Header */
.report-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding-bottom: 18px;
  margin-bottom: 24px;
  border-bottom: 2px solid #1a1a2e;
}
.logo {
  font-family: 'Orbitron', monospace;
  font-weight: 900;
  font-size: 22px;
  color: #1a1a2e;
  letter-spacing: 0.04em;
}
.logo-tag {
  font-family: 'Share Tech Mono', monospace;
  font-size: 8px;
  color: #999;
  letter-spacing: 0.18em;
  margin-top: 4px;
}
.report-meta {
  text-align: right;
  font-family: 'Share Tech Mono', monospace;
  font-size: 8.5px;
  color: #aaa;
  line-height: 2;
}
.report-meta strong { color: #333; }

/* Hero bar */
.hero {
  background: #1a1a2e;
  border-radius: 6px;
  padding: 18px 22px;
  margin-bottom: 18px;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.hero-eyebrow {
  font-family: 'Share Tech Mono', monospace;
  font-size: 8px;
  letter-spacing: 0.22em;
  color: #00cc88;
  margin-bottom: 7px;
  display: flex;
  align-items: center;
  gap: 7px;
}
.hero-eyebrow::before {
  content: '';
  display: inline-block;
  width: 5px; height: 5px;
  border-radius: 50%;
  background: #00cc88;
}
.hero-url {
  font-family: 'Orbitron', monospace;
  font-weight: 900;
  font-size: 14px;
  color: #ffffff;
  word-break: break-all;
  margin-bottom: 5px;
}
.hero-sub {
  font-family: 'Share Tech Mono', monospace;
  font-size: 8px;
  color: #6677aa;
  letter-spacing: 0.1em;
}

/* Metrics */
.metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 12px;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.metric {
  background: #f8f9ff;
  border: 1px solid #e0e4f0;
  border-radius: 5px;
  padding: 13px 10px;
  text-align: center;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.metric-val {
  font-family: 'Orbitron', monospace;
  font-weight: 900;
  font-size: 26px;
  line-height: 1;
}
.metric-label {
  font-family: 'Share Tech Mono', monospace;
  font-size: 6.5px;
  letter-spacing: 0.14em;
  color: #aaa;
  margin-top: 5px;
}

/* Severity bar */
.sev-bar-wrap {
  background: #f8f9ff;
  border: 1px solid #e0e4f0;
  border-radius: 5px;
  padding: 11px 16px;
  margin-bottom: 26px;
}
.sev-bar-labels {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}
.sev-bar-labels span {
  font-family: 'Share Tech Mono', monospace;
  font-size: 8.5px;
  letter-spacing: 0.08em;
  font-weight: 600;
}
.sev-bar {
  height: 6px;
  border-radius: 999px;
  background: #e8eaf0;
  overflow: hidden;
  display: flex;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.sev-seg { height: 100%; }

/* Section title */
.section-title {
  font-family: 'Share Tech Mono', monospace;
  font-size: 8px;
  letter-spacing: 0.22em;
  color: #888;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e0e4f0;
  display: flex;
  align-items: center;
  gap: 8px;
}
.section-title::before {
  content: '';
  display: inline-block;
  width: 3px; height: 3px;
  border-radius: 50%;
  background: #1a1a2e;
}

/* Issue cards */
.issue {
  background: #fafafa;
  border: 1px solid #e8eaf0;
  border-left: 3px solid #ccc;
  border-radius: 5px;
  padding: 14px 16px 12px;
  margin-bottom: 9px;
  break-inside: avoid;
  page-break-inside: avoid;
}
.issue.sev-High   { border-left-color: #FF0040; }
.issue.sev-Medium { border-left-color: #FFB400; }
.issue.sev-Low    { border-left-color: #00AACC; }

.issue-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 7px;
}
.issue-num {
  font-family: 'Share Tech Mono', monospace;
  font-size: 10px;
  color: #bbb;
  flex-shrink: 0;
}
.issue-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  flex: 1;
}
.issue-type {
  font-family: 'Orbitron', monospace;
  font-weight: 700;
  font-size: 11px;
  color: #1a1a2e;
  letter-spacing: 0.04em;
}
.sev-tag {
  font-family: 'Share Tech Mono', monospace;
  font-size: 7.5px;
  font-weight: 700;
  letter-spacing: 0.12em;
  padding: 2px 7px;
  border-radius: 2px;
  border: 1px solid;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.issue-page {
  font-family: 'Share Tech Mono', monospace;
  font-size: 8.5px;
  color: #999;
}
.issue-desc {
  font-size: 11.5px;
  color: #4a5568;
  line-height: 1.65;
  margin-bottom: 11px;
}
.ai-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.fix-block { grid-column: 1 / -1; }
.ai-block {
  border-radius: 4px;
  padding: 8px 10px;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.analysis-block { background: #f0f8ff; border: 1px solid #d0eaf8; }
.impact-block   { background: #fffbf0; border: 1px solid #faebc0; }
.fix-block      { background: #f0fff8; border: 1px solid #b8f0d8; }
.ai-label {
  font-family: 'Share Tech Mono', monospace;
  font-size: 7px;
  letter-spacing: 0.16em;
  color: #999;
  margin-bottom: 4px;
}
.ai-val {
  font-size: 11px;
  color: #4a5568;
  line-height: 1.6;
}
.fix-val { color: #1a7a50 !important; font-weight: 500; }

/* Screenshot */
.screenshot-block {
  margin-bottom: 12px;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #e0e4f0;
  break-inside: avoid;
  page-break-inside: avoid;
}
.screenshot-label {
  font-family: 'Share Tech Mono', monospace;
  font-size: 7px;
  letter-spacing: 0.18em;
  color: #aaa;
  padding: 5px 10px;
  background: #f8f9ff;
  border-bottom: 1px solid #e0e4f0;
}
.screenshot-block img {
  width: 100%;
  max-height: 220px;
  object-fit: cover;
  object-position: top;
  display: block;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

/* Footer */
.report-footer {
  margin-top: 36px;
  padding-top: 14px;
  border-top: 1px solid #e0e4f0;
  display: flex;
  justify-content: space-between;
  font-family: 'Share Tech Mono', monospace;
  font-size: 8px;
  color: #bbb;
}

/* ── Heatmap section ── */
.heatmap-wrap {
  margin-bottom: 28px;
  border: 1px solid #e0e4f0;
  border-radius: 6px;
  overflow: hidden;
  break-inside: avoid;
  page-break-inside: avoid;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.heatmap-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: #1a1a2e;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.heatmap-header-title {
  font-family: 'Share Tech Mono', monospace;
  font-size: 8px;
  letter-spacing: 0.2em;
  color: #00ccaa;
  display: flex;
  align-items: center;
  gap: 7px;
}
.heatmap-header-title::before {
  content: '';
  display: inline-block;
  width: 4px; height: 4px;
  border-radius: 50%;
  background: #00ccaa;
}
.heatmap-header-meta {
  font-family: 'Share Tech Mono', monospace;
  font-size: 8px;
  letter-spacing: 0.12em;
  color: #6677aa;
}
.heatmap-body { padding: 14px; background: #ffffff; }
.heatmap-sub {
  font-family: 'Share Tech Mono', monospace;
  font-size: 8px;
  letter-spacing: 0.18em;
  color: #aaa;
  margin-bottom: 12px;
  text-align: center;
}

/* Matrix table */
.matrix-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 3px;
  margin-bottom: 14px;
}
.matrix-table th {
  font-family: 'Share Tech Mono', monospace;
  font-size: 7.5px;
  letter-spacing: 0.12em;
  color: #7788aa;
  font-weight: 700;
  text-align: center;
  padding-bottom: 8px;
  white-space: nowrap;
}
.matrix-col-line {
  display: block;
  height: 2px;
  border-radius: 1px;
  background: #e8eaf0;
  margin-bottom: 5px;
}
.matrix-row-label {
  font-family: 'Share Tech Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.08em;
  color: #556;
  padding-right: 10px;
  white-space: nowrap;
  vertical-align: middle;
  min-width: 80px;
}
.matrix-cell {
  border-radius: 4px;
  height: 46px;
  min-width: 70px;
  text-align: center;
  vertical-align: middle;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.cell-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 3px;
}
.cell-dot {
  width: 5px; height: 5px;
  border-radius: 50%;
  display: block;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.cell-label {
  font-family: 'Share Tech Mono', monospace;
  font-size: 7px;
  letter-spacing: 0.1em;
  font-weight: 700;
}
.cell-empty {
  font-size: 11px;
  color: #ccc;
}

/* Matrix legend */
.matrix-legend {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-left: 90px;
  margin-bottom: 18px;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-family: 'Share Tech Mono', monospace;
  font-size: 7.5px;
  letter-spacing: 0.1em;
  font-weight: 700;
}
.legend-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

/* Divider */
.heatmap-divider {
  height: 1px;
  background: #e8eaf0;
  margin: 14px 0;
}

/* Risk bars */
.risk-section-title {
  font-family: 'Share Tech Mono', monospace;
  font-size: 8px;
  letter-spacing: 0.18em;
  color: #aaa;
  margin-bottom: 10px;
  text-align: center;
}
.risk-row { margin-bottom: 10px; }
.risk-row-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}
.risk-page {
  font-family: 'Share Tech Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.1em;
  color: #556;
}
.risk-right {
  display: flex;
  align-items: center;
  gap: 10px;
}
.risk-label {
  font-family: 'Share Tech Mono', monospace;
  font-size: 8px;
  letter-spacing: 0.14em;
  font-weight: 700;
}
.risk-score {
  font-family: 'Share Tech Mono', monospace;
  font-size: 9px;
  color: #99a;
  min-width: 24px;
  text-align: right;
}
.risk-track {
  height: 5px;
  border-radius: 3px;
  background: #f0f0f5;
  overflow: hidden;
  border: 1px solid #e8eaf0;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.risk-fill {
  height: 100%;
  border-radius: 3px;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.risk-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  margin-top: 5px;
}
.risk-pill {
  font-family: 'Share Tech Mono', monospace;
  font-size: 7px;
  letter-spacing: 0.07em;
  padding: 1px 6px;
  border-radius: 2px;
  border: 1px solid;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.risk-score-legend {
  display: flex;
  justify-content: space-between;
  padding: 7px 10px;
  border-radius: 3px;
  background: #f8f9ff;
  border: 1px solid #e8eaf0;
  margin-top: 10px;
  font-family: 'Share Tech Mono', monospace;
  font-size: 7.5px;
  letter-spacing: 0.1em;
  color: #99a;
}

@media print {
  body { background: #ffffff !important; }
  .page { max-width: 100%; }
}
`;

// ─── Heatmap HTML builder (mirrors HeatMap.tsx logic) ────────────────────────

const SEV_WEIGHT: Record<Severity, number> = { High: 10, Medium: 5, Low: 2 };

function pdfRiskColor(score: number, max: number): string {
  const t = max === 0 ? 0 : Math.min(score / max, 1);
  if (t === 0) return "#f0f0f5";
  if (t < 0.3) return `rgba(0,170,204,${0.3 + t * 0.5})`;
  if (t < 0.6) return `rgba(255,180,0,${0.35 + t * 0.4})`;
  return `rgba(255,0,64,${0.4 + t * 0.45})`;
}

function pdfRiskLabel(
  score: number,
  max: number,
): { label: string; color: string } {
  const t = max === 0 ? 0 : score / max;
  if (t === 0) return { label: "CLEAN", color: "#aaa" };
  if (t < 0.3) return { label: "LOW RISK", color: "#0088cc" };
  if (t < 0.6) return { label: "MODERATE", color: "#cc8800" };
  return { label: "CRITICAL", color: "#FF0040" };
}

const CELL_STYLE: Record<
  string,
  { bg: string; border: string; dot: string; text: string }
> = {
  High: { bg: "#fff0f3", border: "#FF004055", dot: "#FF0040", text: "#FF0040" },
  Medium: {
    bg: "#fffbf0",
    border: "#FFB40055",
    dot: "#FFB400",
    text: "#cc8800",
  },
  Low: { bg: "#f0faff", border: "#00AACC55", dot: "#00AACC", text: "#0088cc" },
  none: { bg: "#f8f9ff", border: "#e0e4f0", dot: "", text: "#ccc" },
};

function buildHeatmapHTML(issues: Issue[]): string {
  const pages = Array.from(new Set(issues.map((i) => i.page)));
  const issueTypes = Array.from(new Set(issues.map((i) => i.issue_type)));

  // Matrix: page → issueType → worst severity
  const matrix: Record<string, Record<string, Severity | null>> = {};
  for (const page of pages) {
    matrix[page] = {};
    for (const type of issueTypes) {
      const matches = issues.filter(
        (i) => i.page === page && i.issue_type === type,
      );
      if (matches.length === 0) {
        matrix[page][type] = null;
        continue;
      }
      const hasHigh = matches.some((m) => m.severity === "High");
      const hasMed = matches.some((m) => m.severity === "Medium");
      matrix[page][type] = hasHigh ? "High" : hasMed ? "Medium" : "Low";
    }
  }

  // Per-page risk score
  const pageScores: Record<string, number> = {};
  for (const page of pages)
    pageScores[page] = issues
      .filter((i) => i.page === page)
      .reduce((a, i) => a + SEV_WEIGHT[i.severity], 0);
  const maxScore = Math.max(...Object.values(pageScores), 1);

  // Column headers
  const colHeaders = issueTypes
    .map(
      (type) => `
    <th>
      <span class="matrix-col-line"></span>
      ${type.toUpperCase()}
    </th>`,
    )
    .join("");

  // Matrix rows
  const matrixRows = pages
    .map((page) => {
      const cells = issueTypes
        .map((type) => {
          const sev = matrix[page][type];
          const s = CELL_STYLE[sev ?? "none"];
          const inner = sev
            ? `<div class="cell-inner">
            <span class="cell-dot" style="background:${s.dot};"></span>
            <span class="cell-label" style="color:${s.text};">${sev.toUpperCase()}</span>
           </div>`
            : `<div class="cell-inner"><span class="cell-empty">—</span></div>`;
          return `<td class="matrix-cell" style="background:${s.bg};border:1px solid ${s.border};">${inner}</td>`;
        })
        .join("");
      return `<tr>
      <td class="matrix-row-label">${page}</td>
      ${cells}
    </tr>`;
    })
    .join("");

  // Risk bars (sorted high → low)
  const riskBars = pages
    .slice()
    .sort((a, b) => pageScores[b] - pageScores[a])
    .map((page) => {
      const score = pageScores[page];
      const pct = (score / maxScore) * 100;
      const { label, color } = pdfRiskLabel(score, maxScore);
      const fillColor = pdfRiskColor(score, maxScore);

      const pills = issues
        .filter((i) => i.page === page)
        .map((iss) => {
          const pc =
            iss.severity === "High"
              ? "#FF0040"
              : iss.severity === "Medium"
                ? "#FFB400"
                : "#00AACC";
          return `<span class="risk-pill" style="background:${pc}18;border-color:${pc}55;color:${pc}cc;">${iss.issue_type}</span>`;
        })
        .join("");

      return `
        <div class="risk-row">
          <div class="risk-row-header">
            <span class="risk-page">${page}</span>
            <div class="risk-right">
              <span class="risk-label" style="color:${color};">${label}</span>
              <span class="risk-score">${score}</span>
            </div>
          </div>
          <div class="risk-track">
            <div class="risk-fill" style="width:${pct}%;background:${fillColor};"></div>
          </div>
          <div class="risk-pills">${pills}</div>
        </div>`;
    })
    .join("");

  return `
  <div class="heatmap-wrap">
    <div class="heatmap-header">
      <span class="heatmap-header-title">ANOMALY HEATMAP</span>
      <span class="heatmap-header-meta">${pages.length} NODES · ${issueTypes.length} VECTORS</span>
    </div>
    <div class="heatmap-body">

      <div class="heatmap-sub">— ISSUE DENSITY MATRIX —</div>
      <table class="matrix-table">
        <thead><tr><th></th>${colHeaders}</tr></thead>
        <tbody>${matrixRows}</tbody>
      </table>

      <div class="matrix-legend">
        <div class="legend-item">
          <span class="legend-dot" style="background:#FF0040;"></span>
          <span style="color:#FF0040;">HIGH</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background:#FFB400;"></span>
          <span style="color:#cc8800;">MEDIUM</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background:#00AACC;"></span>
          <span style="color:#0088cc;">LOW</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background:#e8eaf0;border:1px solid #ccc;"></span>
          <span style="color:#aaa;">CLEAN</span>
        </div>
      </div>

      <div class="heatmap-divider"></div>

      <div class="risk-section-title">— PAGE RISK SCORE —</div>
      ${riskBars}

      <div class="risk-score-legend">
        <span>SCORE: HIGH=10pts · MEDIUM=5pts · LOW=2pts</span>
        <span>MAX: ${maxScore}pts</span>
      </div>

    </div>
  </div>`;
}

function buildPDFHTML(
  results: ScanResults,
  b64map: Map<string, string> = new Map(),
): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const timeStr = now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const high = results.issues.filter((i) => i.severity === "High").length;
  const med = results.issues.filter((i) => i.severity === "Medium").length;
  const low = results.issues.filter((i) => i.severity === "Low").length;
  const total = results.issues_found;
  const pct = (n: number) => (total === 0 ? 0 : Math.round((n / total) * 100));

  const issueRows = results.issues
    .map(
      (iss, idx) => `
    <div class="issue sev-${iss.severity}">
      <div class="issue-header">
        <span class="issue-num">${String(idx + 1).padStart(2, "0")}</span>
        <div class="issue-meta">
          <span class="issue-type">${iss.issue_type}</span>
          <span class="sev-tag" style="color:${SEV_COLOR[iss.severity]};border-color:${SEV_COLOR[iss.severity]};background:${SEV_BG[iss.severity]}">${iss.severity.toUpperCase()}</span>
          <span class="issue-page">${iss.page}</span>
        </div>
      </div>
      <p class="issue-desc">${iss.description}</p>
      ${screenshotSnippet(iss.screenshot, b64map)}
      <div class="ai-grid">
        <div class="ai-block analysis-block">
          <div class="ai-label">◈ NEURAL ANALYSIS</div>
          <div class="ai-val">${iss.explanation}</div>
        </div>
        <div class="ai-block impact-block">
          <div class="ai-label">◎ IMPACT VECTOR</div>
          <div class="ai-val">${iss.impact}</div>
        </div>
        <div class="ai-block fix-block">
          <div class="ai-label">⬡ REMEDIATION PROTOCOL</div>
          <div class="ai-val fix-val">${iss.fix_suggestion}</div>
        </div>
      </div>
    </div>`,
    )
    .join("");

  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"/>
<title>BugBot Report — ${results.url}</title>
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Share+Tech+Mono&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
<style>${PDF_STYLES}</style>
<script>window.addEventListener('load', () => { setTimeout(() => { window.print(); }, 700); });<\/script>
</head><body><div class="page">

  <div class="report-header">
    <div>
      <div class="logo">BugBot</div>
      <div class="logo-tag">AUTONOMOUS QA NEXUS</div>
    </div>
    <div class="report-meta">
      <div>GENERATED &nbsp;<strong>${dateStr} · ${timeStr}</strong></div>
      <div>SCAN_ID &nbsp;<strong>${Date.now()}</strong></div>
      <div>FORMAT &nbsp;<strong>PDF</strong></div>
    </div>
  </div>

  <div class="hero">
    <div class="hero-eyebrow">SCAN COMPLETE — INTELLIGENCE EXTRACTED</div>
    <div class="hero-url">${results.url}</div>
    <div class="hero-sub">${results.pages_scanned} NODES SCANNED · ${results.issues_found} ANOMALIES DETECTED · AI-POWERED ANALYSIS</div>
  </div>

  <div class="metrics">
    <div class="metric">
      <div class="metric-val" style="color:#0088cc">${results.pages_scanned}</div>
      <div class="metric-label">NODES SCANNED</div>
    </div>
    <div class="metric">
      <div class="metric-val" style="color:#1a1a2e">${results.issues_found}</div>
      <div class="metric-label">ANOMALIES FOUND</div>
    </div>
    <div class="metric">
      <div class="metric-val" style="color:#FF0040">${high}</div>
      <div class="metric-label">CRITICAL</div>
    </div>
    <div class="metric">
      <div class="metric-val" style="color:#cc8800">${high + med}</div>
      <div class="metric-label">NEEDS FIX</div>
    </div>
  </div>

  <div class="sev-bar-wrap">
    <div class="sev-bar-labels">
      <span style="color:#FF0040">● HIGH: ${high} (${pct(high)}%)</span>
      <span style="color:#cc8800">● MEDIUM: ${med} (${pct(med)}%)</span>
      <span style="color:#0088cc">● LOW: ${low} (${pct(low)}%)</span>
    </div>
    <div class="sev-bar">
      <div class="sev-seg" style="width:${pct(high)}%;background:#FF0040;"></div>
      <div class="sev-seg" style="width:${pct(med)}%;background:#FFB400;"></div>
      <div class="sev-seg" style="width:${pct(low)}%;background:#00AACC;"></div>
    </div>
  </div>

  <div class="section-title">ANOMALY HEATMAP — DENSITY MATRIX &amp; RISK SCORES</div>
  ${buildHeatmapHTML(results.issues)}

  <div class="section-title">DETECTED ANOMALIES — FULL INTELLIGENCE REPORT</div>
  ${issueRows}

  <div class="report-footer">
    <span>BugBot · Autonomous QA Nexus · v2.4.1</span>
    <span>${dateStr}</span>
  </div>

</div></body></html>`;
}

// ─── HTML REPORT (dark themed, for browser) ───────────────────────────────────
const HTML_STYLES = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{background:#050505;color:#eef2ff;font-family:'Exo 2',sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
body::before{content:'';position:fixed;inset:0;background-image:radial-gradient(circle,#444 1px,transparent 1px);background-size:20px 20px;opacity:0.2;pointer-events:none;}
.page{max-width:820px;margin:0 auto;padding:56px 48px 80px;position:relative;}
.report-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:52px;padding-bottom:32px;border-bottom:1px solid #111;}
.logo{font-family:'Orbitron',monospace;font-weight:900;font-size:22px;color:#00F5FF;text-shadow:0 0 20px rgba(0,245,255,0.6),0 0 60px rgba(0,245,255,0.3);}
.logo-sub{font-family:'Share Tech Mono',monospace;font-size:9px;color:rgba(0,245,255,0.35);letter-spacing:0.2em;margin-top:4px;}
.report-meta{text-align:right;font-family:'Share Tech Mono',monospace;font-size:9px;color:#333;line-height:1.8;}
.report-meta .val{color:#555;}
.hero{margin-bottom:44px;}
.hero-eyebrow{font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:0.2em;color:rgba(0,245,255,0.6);margin-bottom:10px;display:flex;align-items:center;gap:8px;}
.hero-eyebrow::before{content:'';display:inline-block;width:6px;height:6px;border-radius:50%;background:#00FF88;box-shadow:0 0 8px #00FF88;}
.hero-url{font-family:'Orbitron',monospace;font-weight:900;font-size:24px;color:#fff;word-break:break-all;margin-bottom:6px;}
.hero-sub{font-size:11px;color:#444;font-family:'Share Tech Mono',monospace;letter-spacing:0.1em;}
.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px;}
.metric{background:rgba(255,255,255,0.015);border:1px solid rgba(255,255,255,0.05);border-radius:4px;padding:16px 12px;text-align:center;}
.metric-val{font-family:'Orbitron',monospace;font-weight:900;font-size:30px;letter-spacing:-0.02em;line-height:1;}
.metric-label{font-family:'Share Tech Mono',monospace;font-size:7px;letter-spacing:0.15em;color:#333;margin-top:8px;}
.sev-bar-wrap{background:rgba(255,255,255,0.01);border:1px solid rgba(255,255,255,0.05);border-radius:4px;padding:14px 18px;margin-bottom:40px;}
.sev-bar-labels{display:flex;justify-content:space-between;margin-bottom:10px;}
.sev-bar-labels span{font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:0.1em;}
.sev-bar{height:4px;border-radius:999px;background:#0a0a0a;overflow:hidden;display:flex;}
.sev-seg{height:100%;}
.section-title{font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:0.2em;color:rgba(0,245,255,0.4);margin-bottom:16px;padding-bottom:10px;border-bottom:1px solid rgba(0,245,255,0.08);display:flex;align-items:center;gap:8px;}
.section-title::before{content:'';display:inline-block;width:4px;height:4px;border-radius:50%;background:#00F5FF;box-shadow:0 0 6px #00F5FF;}
.issue{background:rgba(255,255,255,0.012);border:1px solid rgba(255,255,255,0.05);border-radius:4px;padding:20px 20px 16px;margin-bottom:10px;break-inside:avoid;}
.issue-header{display:flex;align-items:flex-start;gap:12px;margin-bottom:10px;}
.issue-num{font-family:'Share Tech Mono',monospace;font-size:10px;color:#333;margin-top:3px;flex-shrink:0;}
.issue-meta{display:flex;align-items:center;gap:8px;flex-wrap:wrap;flex:1;}
.issue-type{font-family:'Orbitron',monospace;font-weight:700;font-size:12px;color:#fff;letter-spacing:0.06em;}
.sev-tag{font-family:'Share Tech Mono',monospace;font-size:8px;font-weight:700;letter-spacing:0.12em;padding:2px 8px;border-radius:2px;border:1px solid;}
.issue-page{font-family:'Share Tech Mono',monospace;font-size:9px;color:#444;}
.issue-desc{font-size:13px;color:#7788aa;line-height:1.7;margin-bottom:14px;padding-left:26px;}
.ai-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding-left:26px;}
.fix-block{grid-column:1/-1;}
.ai-block{background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.05);border-radius:4px;padding:10px 12px;}
.ai-label{font-family:'Share Tech Mono',monospace;font-size:7px;letter-spacing:0.16em;color:#334;}
.ai-val{font-size:12px;color:#556;line-height:1.65;margin-top:5px;}
.fix-val{color:rgba(0,245,255,0.75)!important;}
.screenshot-block{margin-bottom:14px;border-radius:4px;overflow:hidden;border:1px solid rgba(0,245,255,0.1);}
.screenshot-label{font-family:'Share Tech Mono',monospace;font-size:7px;letter-spacing:0.18em;color:rgba(0,245,255,0.4);padding:5px 10px;background:rgba(0,245,255,0.03);border-bottom:1px solid rgba(0,245,255,0.08);}
.screenshot-block img{width:100%;max-height:220px;object-fit:cover;object-position:top;display:block;}
.report-footer{margin-top:60px;padding-top:20px;border-top:1px solid #111;display:flex;justify-content:space-between;font-family:'Share Tech Mono',monospace;font-size:9px;color:#222;}
`;

function buildHTMLReport(
  results: ScanResults,
  b64map: Map<string, string> = new Map(),
): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const timeStr = now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const high = results.issues.filter((i) => i.severity === "High").length;
  const med = results.issues.filter((i) => i.severity === "Medium").length;
  const low = results.issues.filter((i) => i.severity === "Low").length;
  const total = results.issues_found;
  const pct = (n: number) => (total === 0 ? 0 : Math.round((n / total) * 100));

  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"/>
<title>BugBot Report — ${results.url}</title>
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Share+Tech+Mono&family=Exo+2:wght@400;600&display=swap" rel="stylesheet"/>
<style>${HTML_STYLES}</style>
</head><body><div class="page">
  <div class="report-header">
    <div>
      <div class="logo">BugBot</div>
      <div class="logo-sub">AUTONOMOUS QA NEXUS</div>
    </div>
    <div class="report-meta">
      <div>GENERATED</div>
      <div class="val">${dateStr} · ${timeStr}</div>
      <div style="margin-top:4px;color:#1a1a1a">SCAN_ID: ${Date.now()}</div>
      <div style="margin-top:4px;color:#1a1a1a">FORMAT: HTML</div>
    </div>
  </div>
  <div class="hero">
    <div class="hero-eyebrow">SCAN COMPLETE — INTELLIGENCE EXTRACTED</div>
    <div class="hero-url">${results.url}</div>
    <div class="hero-sub">${results.pages_scanned} NODES SCANNED · ${results.issues_found} ANOMALIES DETECTED · AI-POWERED ANALYSIS</div>
  </div>
  <div class="metrics">
    <div class="metric"><div class="metric-val" style="color:#00F5FF">${results.pages_scanned}</div><div class="metric-label">NODES SCANNED</div></div>
    <div class="metric"><div class="metric-val" style="color:#eef2ff">${results.issues_found}</div><div class="metric-label">ANOMALIES</div></div>
    <div class="metric"><div class="metric-val" style="color:#FF0040">${high}</div><div class="metric-label">CRITICAL</div></div>
    <div class="metric"><div class="metric-val" style="color:#FFB400">${high + med}</div><div class="metric-label">NEEDS FIX</div></div>
  </div>
  <div class="sev-bar-wrap">
    <div class="sev-bar-labels">
      <span style="color:#FF0040">● HIGH: ${high} (${pct(high)}%)</span>
      <span style="color:#FFB400">● MEDIUM: ${med} (${pct(med)}%)</span>
      <span style="color:#00F5FF">● LOW: ${low} (${pct(low)}%)</span>
    </div>
    <div class="sev-bar">
      <div class="sev-seg" style="width:${pct(high)}%;background:#FF0040;box-shadow:0 0 6px #FF0040;"></div>
      <div class="sev-seg" style="width:${pct(med)}%;background:#FFB400;box-shadow:0 0 6px #FFB400;"></div>
      <div class="sev-seg" style="width:${pct(low)}%;background:#00F5FF;box-shadow:0 0 6px #00F5FF;"></div>
    </div>
  </div>
  <div class="section-title">DETECTED ANOMALIES — FULL INTELLIGENCE REPORT</div>
  ${buildIssueRows(results.issues, b64map)}
  <div class="report-footer">
    <span>BugBot · Autonomous QA Nexus · v2.4.1</span>
    <span>${dateStr}</span>
  </div>
</div></body></html>`;
}

// ── Shared issue row builder for dark HTML report ─────────────────────────────
function buildIssueRows(
  issues: Issue[],
  b64map: Map<string, string> = new Map(),
): string {
  return issues
    .map(
      (iss, idx) => `
    <div class="issue">
      <div class="issue-header">
        <span class="issue-num">${String(idx + 1).padStart(2, "0")}</span>
        <div class="issue-meta">
          <span class="issue-type">${iss.issue_type}</span>
          <span class="sev-tag" style="color:${SEV_COLOR[iss.severity]};border-color:${SEV_COLOR[iss.severity]}44;background:${SEV_COLOR[iss.severity]}11">${iss.severity.toUpperCase()}</span>
          <span class="issue-page">${iss.page}</span>
        </div>
      </div>
      <p class="issue-desc">${iss.description}</p>
      ${screenshotSnippet(iss.screenshot, b64map)}
      <div class="ai-grid">
        <div class="ai-block"><div class="ai-label">◈ NEURAL ANALYSIS</div><div class="ai-val">${iss.explanation}</div></div>
        <div class="ai-block"><div class="ai-label">◎ IMPACT VECTOR</div><div class="ai-val">${iss.impact}</div></div>
        <div class="ai-block fix-block"><div class="ai-label">⬡ REMEDIATION PROTOCOL</div><div class="ai-val fix-val">${iss.fix_suggestion}</div></div>
      </div>
    </div>`,
    )
    .join("");
}

// ── Screenshot → base64 helper ───────────────────────────────────────────────

async function fetchBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++)
      binary += String.fromCharCode(bytes[i]);
    return `data:image/png;base64,${btoa(binary)}`;
  } catch {
    return null;
  }
}

async function resolveScreenshots(
  issues: Issue[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const urls = Array.from(
    new Set(issues.map((i) => i.screenshot).filter(Boolean)),
  ) as string[];
  await Promise.all(
    urls.map(async (url) => {
      const b64 = await fetchBase64(url);
      if (b64) map.set(url, b64);
    }),
  );
  return map;
}

// ── Screenshot HTML snippet helper ───────────────────────────────────────────

function screenshotSnippet(
  url: string | null | undefined,
  b64map: Map<string, string>,
): string {
  if (!url) return "";
  const src = b64map.get(url);
  if (!src) return "";
  return `
    <div class="screenshot-block">
      <div class="screenshot-label">◉ PAGE SCREENSHOT</div>
      <img src="${src}" alt="page screenshot" />
    </div>`;
}

// ── Public exports ────────────────────────────────────────────────────────────

export async function downloadHTMLReport(results: ScanResults): Promise<void> {
  const b64map = await resolveScreenshots(results.issues);
  const html = buildHTMLReport(results, b64map);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const host = results.url
    .replace(/https?:\/\//, "")
    .replace(/\//g, "_")
    .replace(/\./g, "-");
  a.href = blobUrl;
  a.download = `bugbot-report-${host}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
}

export async function downloadPDFReport(results: ScanResults): Promise<void> {
  const b64map = await resolveScreenshots(results.issues);
  const html = buildPDFHTML(results, b64map);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const iframe = document.createElement("iframe");
  iframe.style.cssText =
    "position:fixed;width:0;height:0;opacity:0;border:none;";
  iframe.src = url;
  document.body.appendChild(iframe);
  setTimeout(() => {
    document.body.removeChild(iframe);
    URL.revokeObjectURL(url);
  }, 8000);
}

// Legacy alias
export async function downloadReport(results: ScanResults): Promise<void> {
  return downloadHTMLReport(results);
}
