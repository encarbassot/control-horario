import { useCallback, useRef, useState } from "react";

export function useMinimumLoading(minDurationMs = 500) {
  const [isLoading, setIsLoadingState] = useState(false);

  const startTimeRef = useRef(null);
  const timeoutRef = useRef(null);

  const setIsLoading = useCallback((value) => {
    if (value === true) {
      // START loading
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      startTimeRef.current = Date.now();
      setIsLoadingState(true);
      return;
    }

    // STOP loading
    if (!startTimeRef.current) {
      setIsLoadingState(false);
      return;
    }

    const elapsed = Date.now() - startTimeRef.current;
    const remaining = Math.max(0, minDurationMs - elapsed);

    if (remaining === 0) {
      setIsLoadingState(false);
    } else {
      timeoutRef.current = setTimeout(() => {
        setIsLoadingState(false);
        timeoutRef.current = null;
      }, remaining);
    }

    startTimeRef.current = null;
  }, [minDurationMs]);

  return { isLoading, setIsLoading };
}
