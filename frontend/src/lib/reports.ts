import type { Issue, ScanResults, Severity } from "../types";

const SEV_COLOR: Record<Severity, string> = {
  High: "#FF0040",
  Medium: "#FFB400",
  Low: "#00AACC",
};

const C: Record<Severity, { fg: string; bg: string; border: string }> = {
  High: { fg: "#c53030", bg: "#fff5f5", border: "#fc8181" },
  Medium: { fg: "#b7791f", bg: "#fffff0", border: "#f6e05e" },
  Low: { fg: "#2b6cb0", bg: "#ebf8ff", border: "#90cdf4" },
};

const PDF_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');

@page { size: A4; margin: 18mm 20mm; }

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: #fff;
  color: #111;
  font-family: 'DM Sans', sans-serif;
  font-size: 11px;
  line-height: 1.6;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.page { max-width: 740px; margin: 0 auto; }

/* Header */
.report-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding-bottom: 14px;
  margin-bottom: 28px;
  border-bottom: 2px solid #111;
}
.logo {
  font-family: 'DM Sans', sans-serif;
  font-weight: 600;
  font-size: 20px;
  color: #111;
  letter-spacing: -0.01em;
}
.logo-tag {
  font-family: 'DM Mono', monospace;
  font-size: 8px;
  color: #999;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-top: 2px;
}
.report-meta {
  text-align: right;
  font-family: 'DM Mono', monospace;
  font-size: 8px;
  color: #aaa;
  line-height: 1.9;
}
.report-meta strong { color: #555; font-weight: 500; }

/* Target URL */
.target-block {
  background: #f7f7f7;
  border-radius: 6px;
  padding: 12px 16px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.target-label {
  font-family: 'DM Mono', monospace;
  font-size: 8px;
  color: #aaa;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  white-space: nowrap;
}
.target-url {
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  color: #333;
  word-break: break-all;
}

/* Summary cards */
.summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 20px;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.summary-card {
  padding: 14px 12px;
  border-radius: 6px;
  background: #f7f7f7;
  text-align: center;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.summary-val {
  font-family: 'DM Sans', sans-serif;
  font-weight: 600;
  font-size: 28px;
  line-height: 1;
  letter-spacing: -0.02em;
}
.summary-label {
  font-family: 'DM Mono', monospace;
  font-size: 7px;
  color: #999;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-top: 6px;
}

/* Severity strip */
.sev-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 28px;
}
.sev-pills {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}
.sev-pill {
  display: flex;
  align-items: center;
  gap: 5px;
  font-family: 'DM Mono', monospace;
  font-size: 8px;
  letter-spacing: 0.06em;
  padding: 4px 10px;
  border-radius: 99px;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.sev-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.sev-bar-track {
  flex: 1;
  height: 4px;
  border-radius: 99px;
  background: #eee;
  overflow: hidden;
  display: flex;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.sev-seg {
  height: 100%;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

/* Section heading */
.section-heading {
  font-family: 'DM Mono', monospace;
  font-size: 8px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #bbb;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

/* Page risk table */
.risk-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 28px;
}
.risk-table th {
  font-family: 'DM Mono', monospace;
  font-size: 7px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #bbb;
  font-weight: 500;
  padding: 0 10px 8px 0;
  text-align: left;
  border-bottom: 1px solid #eee;
}
.risk-table td {
  padding: 9px 10px 9px 0;
  border-bottom: 1px solid #f2f2f2;
  vertical-align: middle;
  font-family: 'DM Mono', monospace;
  font-size: 9px;
  color: #555;
}
.risk-pills { display: flex; gap: 4px; flex-wrap: wrap; }
.risk-pill {
  font-family: 'DM Mono', monospace;
  font-size: 7px;
  padding: 2px 6px;
  border-radius: 3px;
  border: 1px solid;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.risk-badge {
  font-family: 'DM Sans', sans-serif;
  font-size: 9px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 3px;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

/* Issue cards */
.issue {
  border: 1px solid #e8e8e8;
  border-left: 3px solid #ddd;
  border-radius: 6px;
  padding: 14px 16px 12px;
  margin-bottom: 8px;
  break-inside: avoid;
  page-break-inside: avoid;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.issue.sev-High   { border-left-color: #e53e3e; }
.issue.sev-Medium { border-left-color: #d69e2e; }
.issue.sev-Low    { border-left-color: #3182ce; }

.issue-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}
.issue-num {
  font-family: 'DM Mono', monospace;
  font-size: 9px;
  color: #ccc;
}
.issue-type {
  font-family: 'DM Sans', sans-serif;
  font-weight: 600;
  font-size: 12px;
  color: #111;
  flex: 1;
}
.sev-badge {
  font-family: 'DM Mono', monospace;
  font-size: 7.5px;
  font-weight: 500;
  letter-spacing: 0.08em;
  padding: 2px 8px;
  border-radius: 3px;
  border: 1px solid;
  text-transform: uppercase;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.issue-page-url {
  font-family: 'DM Mono', monospace;
  font-size: 8px;
  color: #aaa;
}
.issue-desc {
  font-size: 11px;
  color: #555;
  line-height: 1.65;
  margin-bottom: 10px;
}

/* Screenshot */
.screenshot-block {
  margin-bottom: 10px;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #eee;
  break-inside: avoid;
}
.screenshot-block img {
  width: 100%;
  max-height: 200px;
  object-fit: cover;
  object-position: top;
  display: block;
}

/* Insight grid */
.insight-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.insight-full { grid-column: 1 / -1; }
.insight-box {
  background: #f7f7f7;
  border-radius: 4px;
  padding: 8px 10px;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.insight-label {
  font-family: 'DM Mono', monospace;
  font-size: 7px;
  letter-spacing: 0.1em;
  color: #bbb;
  text-transform: uppercase;
  margin-bottom: 4px;
}
.insight-val {
  font-size: 10.5px;
  color: #444;
  line-height: 1.6;
}
.insight-fix { color: #2d6a4f !important; font-weight: 500; }

/* Footer */
.report-footer {
  margin-top: 36px;
  padding-top: 12px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  font-family: 'DM Mono', monospace;
  font-size: 8px;
  color: #ccc;
}

@media print {
  body { background: #fff !important; }
  .page { max-width: 100%; }
}
`;

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

  const pages = Array.from(new Set(results.issues.map((i) => i.page)));
  const pageScores = pages.map((page) => ({
    page,
    score: results.issues
      .filter((i) => i.page === page)
      .reduce(
        (a, i) =>
          a + (i.severity === "High" ? 10 : i.severity === "Medium" ? 5 : 2),
        0,
      ),
    issues: results.issues.filter((i) => i.page === page),
  }));
  const maxScore = Math.max(...pageScores.map((p) => p.score), 1);

  const pageRows = pageScores
    .map(({ page, score, issues: pageIssues }) => {
      const ratio = score / maxScore;
      const riskLabel =
        score === 0
          ? "Clean"
          : ratio < 0.4
            ? "Low Risk"
            : ratio < 0.7
              ? "Moderate"
              : "Critical";
      const riskColor =
        score === 0
          ? "#aaa"
          : ratio < 0.4
            ? "#2b6cb0"
            : ratio < 0.7
              ? "#b7791f"
              : "#c53030";
      const pills = Array.from(new Set(pageIssues.map((i) => i.issue_type)))
        .map((t) => {
          const sev = pageIssues.find((i) => i.issue_type === t)!.severity;
          const col = C[sev];
          return `<span class="risk-pill" style="color:${col.fg};background:${col.bg};border-color:${col.border};">${t}</span>`;
        })
        .join("");
      return `<tr>
        <td>${page}</td>
        <td><div class="risk-pills">${pills}</div></td>
        <td style="text-align:right;"><span class="risk-badge" style="color:${riskColor};background:${riskColor}18;">${riskLabel}</span></td>
      </tr>`;
    })
    .join("");

  const issueCards = results.issues
    .map((iss, idx) => {
      const col = C[iss.severity];
      const shot = screenshotSnippet(iss.screenshot, b64map);
      return `<div class="issue sev-${iss.severity}">
        <div class="issue-header">
          <span class="issue-num">${String(idx + 1).padStart(2, "0")}</span>
          <span class="issue-type">${iss.issue_type}</span>
          <span class="sev-badge" style="color:${col.fg};background:${col.bg};border-color:${col.border};">${iss.severity}</span>
          <span class="issue-page-url">${iss.page}</span>
        </div>
        <p class="issue-desc">${iss.description}</p>
        ${shot}
        <div class="insight-grid">
          <div class="insight-box">
            <div class="insight-label">Analysis</div>
            <div class="insight-val">${iss.explanation}</div>
          </div>
          <div class="insight-box">
            <div class="insight-label">Impact</div>
            <div class="insight-val">${iss.impact}</div>
          </div>
          <div class="insight-box insight-full">
            <div class="insight-label">Fix</div>
            <div class="insight-val insight-fix">${iss.fix_suggestion}</div>
          </div>
        </div>
      </div>`;
    })
    .join("");

  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"/>
<title>BugBot Report — ${results.url}</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>
<style>${PDF_STYLES}</style>
<script>window.addEventListener('load', () => { setTimeout(() => { window.print(); }, 700); });<\/script>
</head><body><div class="page">

  <div class="report-header">
    <div>
      <div class="logo">BugBot</div>
      <div class="logo-tag">QA Report</div>
    </div>
    <div class="report-meta">
      <div>Generated &nbsp;<strong>${dateStr} · ${timeStr}</strong></div>
      <div>Scan ID &nbsp;<strong>${Date.now()}</strong></div>
    </div>
  </div>

  <div class="target-block">
    <span class="target-label">Target</span>
    <span class="target-url">${results.url}</span>
  </div>

  <div class="summary">
    <div class="summary-card">
      <div class="summary-val" style="color:#2b6cb0;">${results.pages_scanned}</div>
      <div class="summary-label">Pages Scanned</div>
    </div>
    <div class="summary-card">
      <div class="summary-val" style="color:#111;">${results.issues_found}</div>
      <div class="summary-label">Issues Found</div>
    </div>
    <div class="summary-card">
      <div class="summary-val" style="color:#c53030;">${high}</div>
      <div class="summary-label">High Severity</div>
    </div>
    <div class="summary-card">
      <div class="summary-val" style="color:#b7791f;">${high + med}</div>
      <div class="summary-label">Needs Attention</div>
    </div>
  </div>

  <div class="sev-row">
    <div class="sev-pills">
      <span class="sev-pill" style="background:#fff5f5;color:#c53030;">
        <span class="sev-dot" style="background:#c53030;"></span>High: ${high}
      </span>
      <span class="sev-pill" style="background:#fffff0;color:#b7791f;">
        <span class="sev-dot" style="background:#d69e2e;"></span>Medium: ${med}
      </span>
      <span class="sev-pill" style="background:#ebf8ff;color:#2b6cb0;">
        <span class="sev-dot" style="background:#3182ce;"></span>Low: ${low}
      </span>
    </div>
    <div class="sev-bar-track">
      <div class="sev-seg" style="width:${pct(high)}%;background:#e53e3e;"></div>
      <div class="sev-seg" style="width:${pct(med)}%;background:#d69e2e;"></div>
      <div class="sev-seg" style="width:${pct(low)}%;background:#3182ce;"></div>
    </div>
  </div>

  <div class="section-heading">Page Risk Summary</div>
  <table class="risk-table">
    <thead><tr>
      <th style="width:38%">Page</th>
      <th>Issues</th>
      <th style="text-align:right;">Risk</th>
    </tr></thead>
    <tbody>${pageRows}</tbody>
  </table>

  <div class="section-heading">Issues — Full Report</div>
  ${issueCards}

  <div class="report-footer">
    <span>BugBot · QA Nexus · v1.0.0</span>
    <span>${dateStr}</span>
  </div>

</div></body></html>`;
}

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
.ai-label{font-family:'Share Tech Mono',monospace;font-size:7px;letter-spacing:0.16em;color:#334;margin-bottom:5px;}
.ai-val{font-size:12px;color:#556;line-height:1.65;}
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

  const issueRows = results.issues
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
        <div class="ai-block"><div class="ai-label">ANALYSIS</div><div class="ai-val">${iss.explanation}</div></div>
        <div class="ai-block"><div class="ai-label">IMPACT</div><div class="ai-val">${iss.impact}</div></div>
        <div class="ai-block fix-block"><div class="ai-label">FIX</div><div class="ai-val fix-val">${iss.fix_suggestion}</div></div>
      </div>
    </div>`,
    )
    .join("");

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
  ${issueRows}
  <div class="report-footer">
    <span>BugBot · Autonomous QA Nexus · v1.0.0</span>
    <span>${dateStr}</span>
  </div>
</div></body></html>`;
}

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

function screenshotSnippet(
  url: string | null | undefined,
  b64map: Map<string, string>,
): string {
  if (!url) return "";
  const src = b64map.get(url);
  if (!src) return "";
  return `<div class="screenshot-block">
      <div class="screenshot-label">PAGE SCREENSHOT</div>
      <img src="${src}" alt="page screenshot" />
    </div>`;
}

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

export async function downloadReport(results: ScanResults): Promise<void> {
  return downloadHTMLReport(results);
}
