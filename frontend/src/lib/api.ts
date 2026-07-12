import type {
  Finding,
  ScanError,
  ScanResult,
  ScanStatus,
  Severity,
} from "../types";

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000"
).replace(/\/$/, "");
const POLL_INTERVAL_MS = 1_500;
const SCAN_TIMEOUT_MS = 10 * 60 * 1_000;

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normaliseSeverity(value: unknown): Severity {
  const severity = asString(value).toLowerCase();
  if (severity === "critical") return "Critical";
  if (severity === "high") return "High";
  if (severity === "medium") return "Medium";
  if (severity === "low") return "Low";
  return "Unknown";
}

function normaliseStatus(value: unknown): ScanStatus {
  const status = asString(value).toLowerCase();
  if (
    status === "pending" ||
    status === "running" ||
    status === "completed_with_errors" ||
    status === "failed"
  ) {
    return status;
  }
  return "completed";
}

function resolveScreenshot(value: unknown): string | null {
  const raw = asString(value);
  if (!raw) return null;
  if (/^(https?:|data:)/i.test(raw)) return raw;

  const clean = raw.replace(/^\.?\//, "");
  return `${API_BASE_URL}/${clean}`;
}

function parseFinding(value: unknown): Finding {
  const finding = asRecord(value);
  const evidence = asRecord(finding.evidence);

  return {
    rule_id: asString(finding.rule_id) || undefined,
    page: asString(finding.page, "Unknown page"),
    issue_type: asString(finding.issue_type, "Unknown issue"),
    severity: normaliseSeverity(finding.severity),
    description: asString(finding.description, "No description provided."),
    explanation: asString(finding.explanation) || undefined,
    impact: asString(finding.impact) || undefined,
    fix_suggestion: asString(finding.fix_suggestion) || undefined,
    screenshot: resolveScreenshot(finding.screenshot),
    confidence:
      typeof finding.confidence === "number" ? finding.confidence : null,
    evidence: Object.keys(evidence).length ? evidence : undefined,
  };
}

function parseError(value: unknown): ScanError {
  const error = asRecord(value);
  return {
    stage: asString(error.stage, "scan"),
    message: asString(error.message, "Unknown scan error"),
    page: asString(error.page) || null,
  };
}

function parseScanResult(payload: unknown): ScanResult {
  const envelope = asRecord(payload);
  const result = asRecord(envelope.result ?? envelope);
  const rawFindings = Array.isArray(result.findings)
    ? result.findings
    : Array.isArray(result.issues)
      ? result.issues
      : [];
  const rawErrors = Array.isArray(result.errors) ? result.errors : [];

  return {
    scan_id: asString(envelope.scan_id ?? result.scan_id) || undefined,
    url: asString(result.target_url ?? result.url),
    status: normaliseStatus(result.status),
    pages_scanned: asNumber(result.pages_scanned),
    pages_failed: asNumber(result.pages_failed),
    issues_found: asNumber(result.issues_found, rawFindings.length),
    health_score: Math.max(0, Math.min(100, asNumber(result.health_score))),
    health_status: asString(result.health_status, "Unknown"),
    findings: rawFindings.map(parseFinding),
    errors: rawErrors.map(parseError),
    started_at: asString(result.started_at ?? result.scanned_at) || undefined,
    completed_at: asString(result.completed_at) || null,
    scan_duration_seconds:
      typeof result.scan_duration_seconds === "number"
        ? result.scan_duration_seconds
        : undefined,
  };
}

async function errorMessage(response: Response): Promise<string> {
  try {
    const body = asRecord(await response.json());
    return asString(body.detail ?? body.message, response.statusText);
  } catch {
    return response.statusText || "Request failed";
  }
}

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("The request was aborted", "AbortError"));
      return;
    }
    const timer = window.setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      window.clearTimeout(timer);
      reject(new DOMException("The request was aborted", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

async function pollScan(
  pollUrl: string,
  signal?: AbortSignal,
): Promise<ScanResult> {
  const endpoint = pollUrl.startsWith("http")
    ? pollUrl
    : `${API_BASE_URL}${pollUrl.startsWith("/") ? "" : "/"}${pollUrl}`;
  const deadline = Date.now() + SCAN_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const response = await fetch(endpoint, { signal });
    if (!response.ok) {
      throw Object.assign(new Error(await errorMessage(response)), {
        status: response.status,
      });
    }

    const result = parseScanResult(await response.json());
    if (result.status === "completed" || result.status === "completed_with_errors") {
      return result;
    }
    if (result.status === "failed") {
      throw new Error(result.errors[0]?.message ?? "The scan job failed.");
    }
    await wait(POLL_INTERVAL_MS, signal);
  }

  throw new Error("The scan did not finish within ten minutes.");
}

export async function getHealth(signal?: AbortSignal): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/`, { signal });
  if (!response.ok) throw new Error(await errorMessage(response));
}

export async function scanWebsite(
  url: string,
  signal?: AbortSignal,
): Promise<ScanResult> {
  const response = await fetch(`${API_BASE_URL}/scan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
    signal,
  });

  if (!response.ok) {
    const message = await errorMessage(response);
    throw Object.assign(new Error(message), { status: response.status });
  }

  const payload = await response.json();
  const envelope = asRecord(payload);
  if (envelope.result) return parseScanResult(payload);

  const scanId = asString(envelope.scan_id);
  const pollUrl = asString(envelope.poll_url, `/results/${scanId}`);
  if (!scanId) throw new Error("The API did not return a scan ID.");
  return pollScan(pollUrl, signal);
}
