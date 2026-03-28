import type { AgentStep, Issue, Severity, SevStyle } from "../types";

export const AGENT_STEPS: AgentStep[] = [
  {
    id: "crawler",
    icon: "◈",
    label: "CRAWLER AGENT",
    sub: "Mapping target topology",
    logLines: [
      "INIT headless chromium instance...",
      "ESTABLISHING quantum tunnel to target...",
      "MAPPING internal link graph...",
      "DISCOVERED 4 nodes in domain mesh.",
      "DEDUPLICATION complete. Graph sealed.",
    ],
  },
  {
    id: "tester",
    icon: "◎",
    label: "TESTING AGENT",
    sub: "Executing vulnerability probes",
    logLines: [
      "PROBING HTTP status codes across endpoints...",
      "INJECTING malformed form payloads...",
      "STRESS TESTING input validation layer...",
      "TRIGGERING all interactive event handlers...",
      "CAPTURING anomaly snapshots.",
    ],
  },
  {
    id: "explainer",
    icon: "⬡",
    label: "EXPLAINER AGENT",
    sub: "Synthesizing intelligence report",
    logLines: [
      "LOADING neural inference pipeline...",
      "CONTEXTUALIZING anomaly signatures...",
      "GENERATING natural language diagnostics...",
      "APPENDING remediation vectors...",
      "INTELLIGENCE REPORT compiled. Transmission ready.",
    ],
  },
];

export const MOCK_ISSUES: Issue[] = [
  {
    page: "/contact",
    issue_type: "Broken Link",
    severity: "High",
    description: "CTA button redirects to a 404 dead zone — navigation terminated for all users.",
    explanation: "A broken link prevents users from completing their intended action, creating a hard dead-end in the user journey.",
    impact: "Users cannot access critical content. Bounce rate spike imminent. Trust erosion confirmed.",
    fix_suggestion: "Update the href attribute to point to a valid, existing route in your routing layer.",
  },
  {
    page: "/signup",
    issue_type: "Form Validation",
    severity: "Medium",
    description: "Email field accepts 'abc@@@@' — validation layer is completely absent.",
    explanation: "Client-side validation is not implemented. Malformed data propagates directly to backend systems.",
    impact: "Invalid payloads corrupt backend data pipelines and degrade user trust metrics.",
    fix_suggestion: "Implement RFC 5322 regex validator or enforce HTML5 type='email' with pattern attribute.",
  },
  {
    page: "/home",
    issue_type: "Dead Button",
    severity: "Low",
    description: "Subscribe button fires onClick with zero logic attached — silent null operation.",
    explanation: "Event handler is registered but no action is bound. The UI appears functional while being inert.",
    impact: "Silent failures erode user trust. Users assume the product is broken.",
    fix_suggestion: "Wire onClick to the subscription handler or render the button as disabled until handler is ready.",
  },
  {
    page: "/pricing",
    issue_type: "HTTP 503",
    severity: "High",
    description: "Server returns 503 — pricing node is completely offline. Revenue impact: critical.",
    explanation: "A 503 means the server could not process the request. The pricing route is down at infrastructure level.",
    impact: "Pricing downtime is a direct conversion killer. Every minute costs revenue.",
    fix_suggestion: "Audit server logs immediately. Add a fallback static cache and implement a retry-after header.",
  },
];

export const SEV: Record<Severity, SevStyle> = {
  High: {
    bg: "rgba(255,0,64,0.08)",
    border: "rgba(255,0,64,0.3)",
    text: "#FF0040",
    dot: "#FF0040",
    bloom: "0 0 10px rgba(255,0,64,0.6), 0 0 30px rgba(255,0,64,0.2)",
  },
  Medium: {
    bg: "rgba(255,180,0,0.08)",
    border: "rgba(255,180,0,0.3)",
    text: "#FFB400",
    dot: "#FFB400",
    bloom: "0 0 10px rgba(255,180,0,0.6), 0 0 30px rgba(255,180,0,0.2)",
  },
  Low: {
    bg: "rgba(0,245,255,0.06)",
    border: "rgba(0,245,255,0.2)",
    text: "#00F5FF",
    dot: "#00F5FF",
    bloom: "0 0 10px rgba(0,245,255,0.5), 0 0 20px rgba(0,245,255,0.15)",
  },
};

export const HUD_LOGS = [
  "AUTHENTICATING quantum signature...",
  "BYPASSING FIREWALL layer 3...",
  "ESTABLISHING encrypted channel...",
  "INJECTING recon payload...",
  "MAPPING DOM topology...",
  "SCANNING XSS vectors...",
  "PROBING form endpoints...",
  "TRACING HTTP redirects...",
  "ANALYZING response headers...",
  "COMPILING anomaly report...",
  "NEURAL net inference active...",
  "ENTROPY threshold nominal...",
  "DEPLOYING crawler swarm...",
  "HANDSHAKE confirmed: TLS 1.3",
  "RATE LIMITER bypassed...",
  "SYNTHETIC user agent injected...",
  "LINK graph constructed...",
  "VALIDATING SSL certificate chain...",
  "TIMING ATTACK probe complete...",
  "EXFILTRATING bug signatures...",
];
