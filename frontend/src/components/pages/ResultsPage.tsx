import { useMemo, useState } from "react";
import type { ScanResult, Severity } from "../../types";
import IssueCard from "../ui/IssueCard";

type Filter = "All" | Severity;
const FILTERS: Filter[] = ["All", "Critical", "High", "Medium", "Low", "Unknown"];

interface ResultsPageProps {
  results: ScanResult;
  onReset: () => void;
}

function exportJson(results: ScanResult) {
  const blob = new Blob([JSON.stringify(results, null, 2)], {
    type: "application/json",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `bugbot-report-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export default function ResultsPage({ results, onReset }: ResultsPageProps) {
  const [filter, setFilter] = useState<Filter>("All");
  const counts = useMemo(
    () =>
      results.findings.reduce<Record<string, number>>((summary, finding) => {
        summary[finding.severity] = (summary[finding.severity] ?? 0) + 1;
        return summary;
      }, {}),
    [results.findings],
  );
  const findings = useMemo(
    () =>
      filter === "All"
        ? results.findings
        : results.findings.filter((finding) => finding.severity === filter),
    [filter, results.findings],
  );

  return (
    <section className="results-page">
      <div className="results-header">
        <div>
          <span className="eyebrow">Scan complete</span>
          <h1>Website quality report</h1>
          <a href={results.url} target="_blank" rel="noreferrer" className="target-link">
            {results.url}
          </a>
        </div>
        <div className="results-actions">
          <button className="button button-secondary" type="button" onClick={() => exportJson(results)}>
            Export JSON
          </button>
          <button className="button button-primary" type="button" onClick={onReset}>
            New scan
          </button>
        </div>
      </div>

      <div className="metrics-grid">
        <article className="score-card">
          <span>Health score</span>
          <strong>{results.health_score}<small>/100</small></strong>
          <p>{results.health_status}</p>
        </article>
        <article>
          <span>Pages scanned</span>
          <strong>{results.pages_scanned}</strong>
          <p>{results.pages_failed ? `${results.pages_failed} failed` : "No page failures reported"}</p>
        </article>
        <article>
          <span>Findings</span>
          <strong>{results.issues_found}</strong>
          <p>{counts.Critical ?? 0} critical · {counts.High ?? 0} high</p>
        </article>
        <article>
          <span>Scan status</span>
          <strong className="metric-status">{results.status.replaceAll("_", " ")}</strong>
          <p>{results.scan_duration_seconds ? `${results.scan_duration_seconds}s duration` : "Completed"}</p>
        </article>
      </div>

      {results.errors.length > 0 && (
        <aside className="partial-errors">
          <strong>Some scan steps could not be completed.</strong>
          <ul>
            {results.errors.map((error, index) => (
              <li key={`${error.stage}-${index}`}>{error.stage}: {error.message}</li>
            ))}
          </ul>
        </aside>
      )}

      <div className="findings-header">
        <div>
          <h2>Findings</h2>
          <p>{findings.length} shown</p>
        </div>
        <div className="filter-row" aria-label="Filter findings by severity">
          {FILTERS.filter((item) => item === "All" || (counts[item] ?? 0) > 0).map((item) => (
            <button
              className={filter === item ? "filter-active" : ""}
              type="button"
              key={item}
              aria-pressed={filter === item}
              onClick={() => setFilter(item)}
            >
              {item}{item !== "All" ? ` ${counts[item] ?? 0}` : ""}
            </button>
          ))}
        </div>
      </div>

      <div className="finding-list">
        {findings.length ? (
          findings.map((finding, index) => (
            <IssueCard
              key={`${finding.rule_id ?? finding.issue_type}-${finding.page}-${index}`}
              finding={finding}
            />
          ))
        ) : (
          <div className="empty-state">
            <h2>No findings in this category</h2>
            <p>Choose another severity filter to view more results.</p>
          </div>
        )}
      </div>
    </section>
  );
}
