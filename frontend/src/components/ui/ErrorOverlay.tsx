import type { ApiError } from "../../types";

interface ErrorOverlayProps {
  error: ApiError;
  onClose: () => void;
}

export default function ErrorOverlay({ error, onClose }: ErrorOverlayProps) {
  return (
    <div className="error-banner" role="alert">
      <div>
        <strong>{error.status ? `Request failed (${error.status})` : "Connection failed"}</strong>
        <p>{error.message}</p>
      </div>
      <button type="button" onClick={onClose} aria-label="Dismiss error">×</button>
    </div>
  );
}
