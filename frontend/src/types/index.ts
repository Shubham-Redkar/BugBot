export type Phase = "home" | "scanning" | "results";
export type Severity = "High" | "Medium" | "Low";
export type DlState = "idle" | "generating" | "done";
export type Filter = "All" | Severity;

export interface Issue {
  page: string;
  issue_type: string;
  severity: Severity;
  description: string;
  explanation: string;
  impact: string;
  fix_suggestion: string;
  screenshot?: string | null;
}

export interface ScanResults {
  url: string;
  pages_scanned: number;
  issues_found: number;
  issues: Issue[];
  health_score: number; // 0–100
  health_status: string; // "GOOD" | "WARNING" | "CRITICAL"
}

export interface LogLine {
  id: number;
  text: string;
}

export interface AgentStep {
  id: string;
  icon: string;
  label: string;
  sub: string;
  logLines: string[];
}

export interface SevStyle {
  bg: string;
  border: string;
  text: string;
  dot: string;
  bloom: string;
}

export interface UseScannerReturn {
  phase: Phase;
  activeStep: number;
  doneSteps: number[];
  logLines: LogLine[];
  results: ScanResults | null;
  scannedUrl: string;
  startScan: (url: string) => Promise<void>;
  reset: () => void;
}
