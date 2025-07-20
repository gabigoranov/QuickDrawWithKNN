// src/services/categoriesService.ts
import { useState, useEffect, useRef, useCallback } from "react";

const API_URL = "http://localhost:8000/categories";
// How long to wait before retry (seconds)
const DEFAULT_RETRY = 5;

type CategoriesStatus = "idle" | "loading" | "success" | "error";

export interface UseCategoriesResult {
  categories: string[];
  status: CategoriesStatus;
  error?: string;
  retryCountdown: number;
  retry: () => void;
}

/**
 * Fetches categories with automatic retry logic.
 */
export function useCategories(
  url = API_URL,
  retryDelaySec = DEFAULT_RETRY
): UseCategoriesResult {
  const [categories, setCategories] = useState<string[]>([]);
  const [status, setStatus] = useState<CategoriesStatus>("idle");
  const [error, setError] = useState<string | undefined>(undefined);

  const [retryCountdown, setRetryCountdown] = useState<number>(retryDelaySec);
  
  const retryTimeout = useRef<number | null>(null);
  const retryTimer = useRef<number | null>(null);

  const fetchCategories = useCallback(async () => {
    setStatus("loading");
    setError(undefined);
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setCategories(data.categories ?? []);  // <-- fix here
        setStatus("success");
        setError(undefined);
        setRetryCountdown(retryDelaySec);
    } catch (err: any) {
        setStatus("error");
        setError(err?.message || "Fetch error");
        setRetryCountdown(retryDelaySec);
    }
  }, [url, retryDelaySec]);


  const retry = () => {
    setRetryCountdown(retryDelaySec);
    fetchCategories();
  };

  // Initial fetch
  useEffect(() => {
    fetchCategories();
    // Cleanup on unmount
    return () => {
      retryTimeout.current && clearTimeout(retryTimeout.current);
      retryTimer.current && clearTimeout(retryTimer.current);
    };
  }, [fetchCategories]);

  // Handle automatic retry with countdown
  useEffect(() => {
    if (status === "error") {
      retryTimer.current && clearTimeout(retryTimer.current);
      if (retryCountdown > 0) {
        retryTimer.current = setTimeout(
          () => setRetryCountdown((c) => c - 1),
          1000
        );
      } else {
        fetchCategories();
      }
    }
    return () => {
      retryTimer.current && clearTimeout(retryTimer.current);
    };
  }, [status, retryCountdown, fetchCategories]);

  return {
    categories,
    status,
    error,
    retryCountdown: status === "error" ? retryCountdown : 0,
    retry,
  };
}
