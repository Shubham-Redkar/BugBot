// ─── Backend API configuration ───────────────────────────────────────────────
// Change this to your deployed backend URL in production.
// Reads from VITE_API_URL env var if set, otherwise falls back to localhost.

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export async function scanWebsite(
  url: string,
): Promise<import("../types").ScanResults> {
  const response = await fetch(`${API_BASE_URL}/scan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`Scan failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  // Backend returns { scan_id: string, result: ScanResults }
  const result = data.result ?? data;

  // Normalise: backend uses lowercase severity summary keys
  return {
    url: result.url,
    pages_scanned: result.pages_scanned,
    issues_found: result.issues_found,
    health_score: result.health_score ?? 0,
    health_status: result.health_status ?? "Unknown",
    summary: result.summary ?? { high: 0, medium: 0, low: 0 },
    issues: (result.issues ?? []).map((issue: Record<string, unknown>) => ({
      page: issue.page,
      issue_type: issue.issue_type,
      // Backend returns lowercase severity — normalise to capitalised
      severity: normaliseSeverity(issue.severity as string),
      description: issue.description,
      explanation: issue.explanation ?? "",
      impact: issue.impact ?? "",
      fix_suggestion: issue.fix_suggestion ?? "",
      screenshot: issue.screenshot ?? null,
    })),
  };
}

function normaliseSeverity(raw: string): "High" | "Medium" | "Low" {
  const lower = (raw ?? "").toLowerCase();
  if (lower === "high") return "High";
  if (lower === "medium") return "Medium";
  return "Low";
}
