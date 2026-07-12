export type Phase = "home" | "scanning" | "results";
export type Severity = "Critical" | "High" | "Medium" | "Low" | "Unknown";
export type SystemStatus = "checking" | "online" | "offline";
export type ScanStatus =
  | "pending"
  | "running"
  | "completed"
  | "completed_with_errors"
  | "failed";

export interface FindingEvidence {
  selector?: string | null;
  resource_url?: string | null;
  console_message?: string | null;
  http_status?: number | null;
  details?: Record<string, unknown>;
}

export interface Finding {
  rule_id?: string;
  page: string;
  issue_type: string;
  severity: Severity;
  description: string;
  explanation?: string;
  impact?: string;
  fix_suggestion?: string;
  screenshot?: string | null;
  evidence?: FindingEvidence;
  confidence?: number | null;
}

export interface ScanError {
  stage: string;
  message: string;
  page?: string | null;
}

export interface ScanResult {
  scan_id?: string;
  url: string;
  status: ScanStatus;
  pages_scanned: number;
  pages_failed: number;
  issues_found: number;
  health_score: number;
  health_status: string;
  findings: Finding[];
  errors: ScanError[];
  started_at?: string;
  completed_at?: string | null;
  scan_duration_seconds?: number;
}

export interface ApiError {
  status: number;
  message: string;
}

export interface ScannerState {
  phase: Phase;
  results: ScanResult | null;
  scannedUrl: string;
  error: ApiError | null;
  systemStatus: SystemStatus;
  startScan: (url: string) => Promise<void>;
  reset: () => void;
  clearError: () => void;
}
