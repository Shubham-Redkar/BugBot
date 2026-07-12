export type Phase = "home" | "scanning" | "compiling" | "results";

export interface LogLine {
  id: number;
  text: string;
}

export interface Issue {
  issue_type: string;
  severity: "High" | "Medium" | "Low";
  page: string;
  description: string;
  explanation: string;
  impact: string;
  fix_suggestion: string;
  screenshot?: string;
}

export interface ScanResults {
  url: string;
  pages_scanned: number;
  issues_found: number;
  health_score: number;
  health_status: string;
  issues: Issue[];
}

export type Filter = "All" | "High" | "Medium" | "Low";

export interface ApiError {
  status: number;
  message: string;
}

export interface UseScannerReturn {
  phase: Phase;
  activeStep: number;
  doneSteps: number[];
  logLines: LogLine[];
  results: ScanResults | null;
  scannedUrl: string;
  dataReady: boolean;
  startScan: (url: string) => Promise<void>;
  confirmResults: () => void;
  reset: () => void;
}
