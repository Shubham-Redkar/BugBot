export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

function screenshotUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (raw.startsWith("http")) return raw;
  const clean = raw.replace(/^\.?\//, "");
  return `${API_BASE_URL}/${clean}`;
}

function normaliseSeverity(raw: string): "High" | "Medium" | "Low" {
  const lower = (raw ?? "").toLowerCase();
  if (lower === "high") return "High";
  if (lower === "medium") return "Medium";
  return "Low";
}

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
  const result = data.result ?? data;

  return {
    url: result.url,
    pages_scanned: result.pages_scanned,
    issues_found: result.issues_found,
    health_score: result.health_score ?? 0,
    health_status: result.health_status ?? "Unknown",
    issues: (result.issues ?? []).map((issue: Record<string, unknown>) => ({
      page: issue.page,
      issue_type: issue.issue_type,
      severity: normaliseSeverity(issue.severity as string),
      description: issue.description,
      explanation: issue.explanation ?? "",
      impact: issue.impact ?? "",
      fix_suggestion: issue.fix_suggestion ?? "",
      screenshot: screenshotUrl(issue.screenshot as string | null),
    })),
  };
}
