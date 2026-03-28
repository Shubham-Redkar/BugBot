import { useCallback, useState } from "react";
import { AGENT_STEPS } from "../lib/constants";
import { scanWebsite } from "../lib/api";
import type { LogLine, Phase, ScanResults, UseScannerReturn } from "../types";

export function useScanner(): UseScannerReturn {
  const [phase, setPhase] = useState<Phase>("home");
  const [activeStep, setActiveStep] = useState<number>(-1);
  const [doneSteps, setDoneSteps] = useState<number[]>([]);
  const [logLines, setLogLines] = useState<LogLine[]>([]);
  const [results, setResults] = useState<ScanResults | null>(null);
  const [scannedUrl, setScannedUrl] = useState<string>("");

  const addLog = useCallback((text: string): void => {
    setLogLines((prev) => [...prev, { id: Date.now() + Math.random(), text }]);
  }, []);

  const delay = (ms: number): Promise<void> =>
    new Promise((r) => setTimeout(r, ms));

  const startScan = useCallback(
    async (url: string): Promise<void> => {
      setScannedUrl(url);
      setPhase("scanning");
      setActiveStep(-1);
      setDoneSteps([]);
      setLogLines([]);

      // Kick off real API call immediately in background
      const apiPromise = scanWebsite(url);

      // Run animated steps as UI overlay while we wait
      for (let i = 0; i < AGENT_STEPS.length; i++) {
        setActiveStep(i);
        for (const line of AGENT_STEPS[i].logLines) {
          await delay(380);
          addLog(line);
        }
        await delay(500);
        setDoneSteps((prev) => [...prev, i]);
      }

      // Wait for the real scan result
      try {
        addLog("AWAITING INTELLIGENCE COMPILATION...");
        const scanResults = await apiPromise;

        addLog(
          `SCAN COMPLETE — ${scanResults.issues_found} ANOMALIES DETECTED`,
        );
        await delay(400);

        setResults(scanResults);
        setPhase("results");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        addLog(`ERROR: ${message}`);

        // Show error state so the UI does not hang on the scanning screen
        setResults({
          url,
          pages_scanned: 0,
          issues_found: 0,
          health_score: 0,
          health_status: "Error",
          summary: { high: 0, medium: 0, low: 0 },
          issues: [],
        });
        setPhase("results");
      }
    },
    [addLog],
  );

  const reset = useCallback((): void => {
    setPhase("home");
    setResults(null);
    setLogLines([]);
    setActiveStep(-1);
    setDoneSteps([]);
  }, []);

  return {
    phase,
    activeStep,
    doneSteps,
    logLines,
    results,
    scannedUrl,
    startScan,
    reset,
  };
}
