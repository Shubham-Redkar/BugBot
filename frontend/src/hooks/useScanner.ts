import { useCallback, useEffect, useRef, useState } from "react";
import { getHealth, scanWebsite } from "../lib/api";
import type {
  ApiError,
  Phase,
  ScanResult,
  ScannerState,
  SystemStatus,
} from "../types";

export function useScanner(): ScannerState {
  const [phase, setPhase] = useState<Phase>("home");
  const [results, setResults] = useState<ScanResult | null>(null);
  const [scannedUrl, setScannedUrl] = useState("");
  const [error, setError] = useState<ApiError | null>(null);
  const [systemStatus, setSystemStatus] =
    useState<SystemStatus>("checking");
  const requestRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getHealth(controller.signal)
      .then(() => setSystemStatus("online"))
      .catch((requestError: unknown) => {
        if ((requestError as Error).name !== "AbortError") {
          setSystemStatus("offline");
        }
      });
    return () => controller.abort();
  }, []);

  const reset = useCallback(() => {
    requestRef.current?.abort();
    requestRef.current = null;
    setPhase("home");
    setResults(null);
    setScannedUrl("");
    setError(null);
  }, []);

  const startScan = useCallback(async (url: string) => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;

    setScannedUrl(url);
    setResults(null);
    setError(null);
    setPhase("scanning");

    try {
      const result = await scanWebsite(url, controller.signal);
      if (!controller.signal.aborted) {
        setResults(result);
        setPhase("results");
        setSystemStatus("online");
      }
    } catch (requestError: unknown) {
      if ((requestError as Error).name === "AbortError") return;

      const status =
        typeof (requestError as { status?: unknown }).status === "number"
          ? ((requestError as { status: number }).status ?? 0)
          : 0;
      setError({
        status,
        message: (requestError as Error).message || "Unable to complete scan.",
      });
      setPhase("home");
      if (status === 0) setSystemStatus("offline");
    } finally {
      if (requestRef.current === controller) requestRef.current = null;
    }
  }, []);

  useEffect(() => () => requestRef.current?.abort(), []);

  return {
    phase,
    results,
    scannedUrl,
    error,
    systemStatus,
    startScan,
    reset,
    clearError: () => setError(null),
  };
}
