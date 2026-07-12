import type { Phase, SystemStatus } from "../../types";

interface NavBarProps {
  phase: Phase;
  systemStatus: SystemStatus;
  onReset: () => void;
}

export default function NavBar({ phase, systemStatus, onReset }: NavBarProps) {
  return (
    <header className="topbar">
      <button className="brand" type="button" onClick={onReset}>
        <span className="brand-mark" aria-hidden="true">B</span>
        <span>
          <strong>BugBot</strong>
          <small>Website quality scanner</small>
        </span>
      </button>

      <div className="topbar-actions">
        <span className={`status status-${systemStatus}`}>
          <span className="status-dot" aria-hidden="true" />
          {systemStatus === "checking"
            ? "Checking API"
            : systemStatus === "online"
              ? "API online"
              : "API offline"}
        </span>
        {phase !== "home" && (
          <button className="button button-quiet" type="button" onClick={onReset}>
            New scan
          </button>
        )}
      </div>
    </header>
  );
}
