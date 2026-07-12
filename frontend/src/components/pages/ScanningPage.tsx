interface ScanningPageProps {
  url: string;
  onCancel: () => void;
}

export default function ScanningPage({ url, onCancel }: ScanningPageProps) {
  return (
    <section className="scan-progress" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <span className="eyebrow">Scan in progress</span>
      <h1>Reviewing your website</h1>
      <p className="scan-target">{url}</p>
      <p>
        BugBot is discovering pages, running browser checks, and preparing the
        report. Larger websites may take a little longer.
      </p>
      <button className="button button-secondary" type="button" onClick={onCancel}>
        Cancel scan
      </button>
    </section>
  );
}
