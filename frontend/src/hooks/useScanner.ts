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

  const [dataReady, setDataReady] = useState(false);

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
      setDataReady(false);

      const apiPromise = scanWebsite(url);

      for (let i = 0; i < AGENT_STEPS.length; i++) {
        setActiveStep(i);
        for (const line of AGENT_STEPS[i].logLines) {
          await delay(380);
          addLog(line);
        }
        await delay(500);
        setDoneSteps((prev) => [...prev, i]);
      }

      addLog("AWAITING INTELLIGENCE COMPILATION...");
      setPhase("compiling");

      try {
        const scanResults = await apiPromise;
        setResults(scanResults);
      } catch (err) {
        setResults({
          url,
          pages_scanned: 0,
          issues_found: 0,
          health_score: 0,
          health_status: "Error",
          issues: [],
        });
      } finally {
        setDataReady(true);
      }
    },
    [addLog],
  );

  const confirmResults = useCallback((): void => {
    setPhase("results");
  }, []);

  const reset = useCallback((): void => {
    setPhase("home");
    setResults(null);
    setLogLines([]);
    setActiveStep(-1);
    setDoneSteps([]);
    setDataReady(false);
  }, []);

  return {
    phase,
    activeStep,
    doneSteps,
    logLines,
    results,
    scannedUrl,
    dataReady,
    startScan,
    confirmResults,
    reset,
  };
}
