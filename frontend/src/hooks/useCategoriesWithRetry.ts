import { useState, useEffect, useCallback, useRef } from "react";

export function useCategoriesWithRetry(url: string, retryDelaySeconds = 10) {
  const [categories, setCategories] = useState<string[]>([]);
  const [status, setStatus] = useState("idle");
  const [retryCountdown, setRetryCountdown] = useState(0);
  
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null); // Use setInterval

  const fetchCategories = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Network response was not ok");
      const data = await res.json();
      setCategories(data.categories);
      setStatus("success");
      setRetryCountdown(0);
      // Clear interval if any on success
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    } catch (e) {
      setStatus("error");
      setRetryCountdown(retryDelaySeconds);

      if (countdownIntervalRef.current === null) {
        countdownIntervalRef.current = setInterval(() => {
          setRetryCountdown((count) => {
            if (count <= 1) {
              clearInterval(countdownIntervalRef.current!);
              countdownIntervalRef.current = null;
              fetchCategories(); // retry on countdown end
              return 0;
            }
            return count - 1;
          });
        }, 1000);
      }
    }
  }, [url, retryDelaySeconds]);

  useEffect(() => {
    fetchCategories();
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    }
  }, [fetchCategories]);

  return { categories, status, retryCountdown };
}
