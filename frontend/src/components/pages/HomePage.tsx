import { useState, type FormEvent } from "react";

interface HomePageProps {
  onScan: (url: string) => Promise<void>;
}

function normaliseUrl(value: string): string | null {
  const candidate = /^https?:\/\//i.test(value.trim())
    ? value.trim()
    : `https://${value.trim()}`;

  try {
    const parsed = new URL(candidate);
    return parsed.hostname.includes(".") || parsed.hostname === "localhost"
      ? parsed.toString()
      : null;
  } catch {
    return null;
  }
}

export default function HomePage({ onScan }: HomePageProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalised = normaliseUrl(url);
    if (!normalised) {
      setError("Enter a valid public website, for example example.com.");
      return;
    }
    setError("");
    void onScan(normalised);
  };

  return (
    <section className="home-page">
      <div className="hero-copy">
        <span className="eyebrow">Automated website QA</span>
        <h1>Find website issues before your users do.</h1>
        <p>
          Scan public pages for accessibility, broken assets, metadata, forms,
          and browser errors. Get a focused report with practical fixes.
        </p>
      </div>

      <form className="scan-form" onSubmit={submit} noValidate>
        <label htmlFor="scan-url">Website URL</label>
        <div className="input-row">
          <input
            id="scan-url"
            type="text"
            inputMode="url"
            autoComplete="url"
            placeholder="https://example.com"
            value={url}
            aria-describedby={error ? "url-error" : "url-help"}
            aria-invalid={Boolean(error)}
            onChange={(event) => {
              setUrl(event.target.value);
              if (error) setError("");
            }}
          />
          <button className="button button-primary" type="submit">
            Start scan
          </button>
        </div>
        {error ? (
          <p className="field-error" id="url-error">{error}</p>
        ) : (
          <p className="field-help" id="url-help">
            Only scan websites you own or have permission to test.
          </p>
        )}
      </form>

      <div className="feature-grid" aria-label="Scan capabilities">
        <article>
          <span>01</span>
          <h2>Discover</h2>
          <p>Map internal pages within a safe, configurable limit.</p>
        </article>
        <article>
          <span>02</span>
          <h2>Test</h2>
          <p>Run deterministic browser checks and collect useful evidence.</p>
        </article>
        <article>
          <span>03</span>
          <h2>Prioritize</h2>
          <p>Group findings by severity and explain the next action.</p>
        </article>
      </div>
    </section>
  );
}
