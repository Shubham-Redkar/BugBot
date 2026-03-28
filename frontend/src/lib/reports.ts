import type { Issue, ScanResults, Severity } from "../types";

const SEV_COLOR: Record<Severity, string> = {
  High: "#FF0040",
  Medium: "#FFB400",
  Low: "#00F5FF",
};

function buildIssueRows(issues: Issue[]): string {
  return issues.map((iss, idx): string => `
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
      <div class="ai-grid">
        <div class="ai-block"><div class="ai-label">◈ NEURAL ANALYSIS</div><div class="ai-val">${iss.explanation}</div></div>
        <div class="ai-block"><div class="ai-label">◎ IMPACT VECTOR</div><div class="ai-val">${iss.impact}</div></div>
        <div class="ai-block fix-block"><div class="ai-label">⬡ REMEDIATION PROTOCOL</div><div class="ai-val fix-val">${iss.fix_suggestion}</div></div>
      </div>
    </div>`).join("");
}

function generateReport(results: ScanResults): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
  const timeStr = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const high = results.issues.filter((i) => i.severity === "High").length;
  const med = results.issues.filter((i) => i.severity === "Medium").length;
  const low = results.issues.filter((i) => i.severity === "Low").length;
  const total = results.issues_found;
  const pct = (n: number): number => Math.round((n / total) * 100);

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>BugBot Report — ${results.url}</title>
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Share+Tech+Mono&family=Exo+2:wght@400;600&display=swap" rel="stylesheet"/>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{background:#050505;color:#eef2ff;font-family:'Exo 2',sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
body::before{content:'';position:fixed;inset:0;background-image:radial-gradient(circle,#444 1px,transparent 1px);background-size:20px 20px;opacity:0.2;pointer-events:none;}
.page{max-width:820px;margin:0 auto;padding:56px 48px 80px;position:relative;}
.report-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:52px;padding-bottom:32px;border-bottom:1px solid #111;}
.logo{font-family:'Orbitron',monospace;font-weight:900;font-size:22px;color:#00F5FF;text-shadow:0 0 20px rgba(0,245,255,0.6),0 0 60px rgba(0,245,255,0.3);}
.report-meta{text-align:right;font-family:'Share Tech Mono',monospace;font-size:9px;color:#333;line-height:1.8;}
.report-meta .val{color:#444;}
.hero{margin-bottom:44px;}
.hero-eyebrow{font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:0.2em;color:rgba(0,245,255,0.6);margin-bottom:10px;}
.hero-url{font-family:'Orbitron',monospace;font-weight:900;font-size:26px;color:#fff;word-break:break-all;margin-bottom:6px;letter-spacing:0.02em;}
.hero-sub{font-size:11px;color:#333;font-family:'Share Tech Mono',monospace;letter-spacing:0.1em;}
.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px;}
.metric{background:rgba(255,255,255,0.015);border:1px solid rgba(255,255,255,0.05);border-radius:4px;padding:16px 12px;text-align:center;}
.metric-val{font-family:'Orbitron',monospace;font-weight:900;font-size:30px;letter-spacing:-0.02em;line-height:1;}
.metric-label{font-family:'Share Tech Mono',monospace;font-size:7px;letter-spacing:0.15em;color:#333;margin-top:8px;}
.sev-bar-wrap{background:rgba(255,255,255,0.01);border:1px solid rgba(255,255,255,0.05);border-radius:4px;padding:14px 18px;margin-bottom:40px;}
.sev-bar-labels{display:flex;justify-content:space-between;margin-bottom:10px;}
.sev-bar-labels span{font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:0.1em;}
.sev-bar{height:3px;border-radius:999px;background:#0a0a0a;overflow:hidden;display:flex;}
.sev-seg{height:100%;}
.section-title{font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:0.2em;color:#333;margin-bottom:16px;padding-bottom:10px;border-bottom:1px solid #111;}
.issue{background:rgba(255,255,255,0.012);border:1px solid rgba(255,255,255,0.05);border-radius:4px;padding:20px 20px 16px;margin-bottom:10px;break-inside:avoid;}
.issue-header{display:flex;align-items:flex-start;gap:12px;margin-bottom:10px;}
.issue-num{font-family:'Share Tech Mono',monospace;font-size:10px;color:#222;margin-top:3px;flex-shrink:0;}
.issue-meta{display:flex;align-items:center;gap:8px;flex-wrap:wrap;flex:1;}
.issue-type{font-family:'Orbitron',monospace;font-weight:700;font-size:12px;color:#fff;letter-spacing:0.06em;}
.sev-tag{font-family:'Share Tech Mono',monospace;font-size:8px;font-weight:700;letter-spacing:0.12em;padding:2px 8px;border-radius:2px;border:1px solid;}
.issue-page{font-family:'Share Tech Mono',monospace;font-size:9px;color:#2a2a2a;}
.issue-desc{font-size:12px;color:#444;line-height:1.65;margin-bottom:14px;padding-left:26px;}
.ai-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding-left:26px;}
.fix-block{grid-column:1/-1;}
.ai-block{background:#000;border:1px solid #0a0a0a;border-radius:4px;padding:10px 12px;}
.ai-label{font-family:'Share Tech Mono',monospace;font-size:7px;letter-spacing:0.16em;color:#222;margin-bottom:5px;}
.ai-val{font-size:11px;color:#444;line-height:1.65;}
.fix-val{color:rgba(0,245,255,0.7);}
.report-footer{margin-top:60px;padding-top:20px;border-top:1px solid #111;display:flex;justify-content:space-between;font-family:'Share Tech Mono',monospace;font-size:9px;color:#222;}
@media print{body{background:#050505!important;}@page{size:A4;margin:0;}}
</style></head><body><div class="page">
  <div class="report-header">
    <div class="logo">BugBot</div>
    <div class="report-meta">
      <div>GENERATED</div>
      <div class="val">${dateStr} · ${timeStr}</div>
      <div style="color:#1a1a1a;margin-top:2px;">SCAN_ID: ${Date.now()}</div>
    </div>
  </div>
  <div class="hero">
    <div class="hero-eyebrow">◈ SCAN COMPLETE — INTELLIGENCE EXTRACTED</div>
    <div class="hero-url">${results.url}</div>
    <div class="hero-sub">${results.pages_scanned} NODES SCANNED · ${results.issues_found} ANOMALIES DETECTED · AI-POWERED ANALYSIS</div>
  </div>
  <div class="metrics">
    <div class="metric"><div class="metric-val" style="color:#00F5FF">${results.pages_scanned}</div><div class="metric-label">NODES SCANNED</div></div>
    <div class="metric"><div class="metric-val" style="color:#fff">${results.issues_found}</div><div class="metric-label">ANOMALIES</div></div>
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
      <div class="sev-seg" style="width:${pct(high)}%;background:#FF0040;"></div>
      <div class="sev-seg" style="width:${pct(med)}%;background:#FFB400;"></div>
      <div class="sev-seg" style="width:${pct(low)}%;background:#00F5FF;"></div>
    </div>
  </div>
  <div class="section-title">DETECTED ANOMALIES — FULL INTELLIGENCE REPORT</div>
  ${buildIssueRows(results.issues)}
  <div class="report-footer">
    <span>BugBot · Autonomous QA Nexus</span>
    <span>${dateStr}</span>
  </div>
</div></body></html>`;
}

export function downloadReport(results: ScanResults): void {
  const html = generateReport(results);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const host = results.url.replace(/https?:\/\//, "").replace(/\//g, "_").replace(/\./g, "-");
  a.href = url;
  a.download = `bugbot-report-${host}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
