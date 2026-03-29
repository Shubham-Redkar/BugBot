import { useCallback, useEffect, useRef, useState } from "react";
import { getHealth } from "../lib/api";

export type SystemStatus = "CHECKING" | "NOMINAL" | "OFFLINE";

const POLL_INTERVAL_MS = 30_000; // 30 s

export function useSystemStatus(): SystemStatus {
  const [status, setStatus] = useState<SystemStatus>("CHECKING");
  const timerRef            = useRef<ReturnType<typeof setTimeout> | null>(null);

  const check = useCallback(async () => {
    try {
      await getHealth();
      setStatus("NOMINAL");
    } catch {
      setStatus("OFFLINE");
    }
  }, []);

  useEffect(() => {
    // Immediate check on mount
    void check();

    // Poll every 30 s
    timerRef.current = setInterval(() => void check(), POLL_INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [check]);

  return status;
}
