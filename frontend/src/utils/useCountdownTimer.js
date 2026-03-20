import { useEffect, useMemo, useRef, useState } from "react";

export function useCountdownTimer(initialMs) {
  const [remainingMs, setRemainingMs] = useState(initialMs);
  const intervalRef = useRef(null);

  useEffect(() => {
    setRemainingMs(initialMs);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setRemainingMs(prev => {
        const next = prev - 1000;
        if (next <= 0) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => {
      clearInterval(intervalRef.current);
    };
  }, [initialMs]);

  const formatted = useMemo(() => {
    const totalSeconds = Math.floor(remainingMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }, [remainingMs]);

  return {
    remainingMs,
    formatted,
    isFinished: remainingMs === 0,
  };
}
