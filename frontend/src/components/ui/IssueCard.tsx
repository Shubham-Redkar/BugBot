import { useState } from "react";
import type { Finding } from "../../types";

export default function IssueCard({ finding }: { finding: Finding }) {
  const [open, setOpen] = useState(false);

  return (
    <article className="finding-card">
      <button
        className="finding-summary"
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className={`severity severity-${finding.severity.toLowerCase()}`}>
          {finding.severity}
        </span>
        <span className="finding-heading">
          <strong>{finding.issue_type}</strong>
          <small>{finding.page}</small>
        </span>
        <span className="chevron" aria-hidden="true">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="finding-details">
          <section>
            <h3>Finding</h3>
            <p>{finding.description}</p>
          </section>
          {finding.explanation && (
            <section>
              <h3>Why it matters</h3>
              <p>{finding.explanation}</p>
            </section>
          )}
          {finding.impact && (
            <section>
              <h3>Impact</h3>
              <p>{finding.impact}</p>
            </section>
          )}
          {finding.fix_suggestion && (
            <section className="suggestion">
              <h3>Suggested fix</h3>
              <p>{finding.fix_suggestion}</p>
            </section>
          )}
          {finding.screenshot && (
            <a className="text-link" href={finding.screenshot} target="_blank" rel="noreferrer">
              View screenshot
            </a>
          )}
        </div>
      )}
    </article>
  );
}
