import { useCallback, useState } from "react";
import { AGENT_STEPS, MOCK_ISSUES } from "../lib/constants";
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

      for (let i = 0; i < AGENT_STEPS.length; i++) {
        setActiveStep(i);
        for (const line of AGENT_STEPS[i].logLines) {
          await delay(380);
          addLog(line);
        }
        await delay(500);
        setDoneSteps((prev) => [...prev, i]);
      }

      await delay(400);
      setResults({
        url,
        pages_scanned: 4,
        issues_found: MOCK_ISSUES.length,
        issues: MOCK_ISSUES,
      });
      setPhase("results");
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

  return { phase, activeStep, doneSteps, logLines, results, scannedUrl, startScan, reset };
}
