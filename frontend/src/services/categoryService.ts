import { useState, useEffect, useRef, useCallback } from "react";
import { useCookie } from "../hooks/useCookie";

const API_URL = "http://localhost:8000/categories";
const DEFAULT_RETRY = 5;

type CategoriesStatus = "idle" | "loading" | "success" | "error";

export interface CategoryServiceResult {
  realCategories: string[];              // Categories fetched from backend
  selectedCategories: string[];          // User-selected categories, persisted in cookie
  status: CategoriesStatus;
  error?: string;
  retryCountdown: number;
  retry?: () => void;
  fetchCategories: () => void;
  setSelectedCategories: (cats: string[]) => void;
}

/**
 * Hook to fetch backend categories and manage selected categories with persistence and validation.
 */
export function useCategoryService(
  url = API_URL,
  retryDelaySec = DEFAULT_RETRY
): CategoryServiceResult {
  const [realCategories, setRealCategories] = useState<string[]>([]);
  const [status, setStatus] = useState<CategoriesStatus>("idle");
  const [error, setError] = useState<string | undefined>(undefined);
  const [retryCountdown, setRetryCountdown] = useState<number>(retryDelaySec);

  const [selectedCategories, setSelectedCategoriesCookie] = useCookie<string[]>(
    "selected_categories",
    [],
    { days: 365 }
  );

  const retryTimer = useRef<number | null>(null);

  const fetchCategories = useCallback(async () => {
    setStatus("loading");
    setError(undefined);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // Defensive: support data.categories or direct array
      const fetched = Array.isArray(data.categories)
        ? data.categories
        : Array.isArray(data)
        ? data
        : [];

      setRealCategories(fetched);
      setStatus("success");
      setError(undefined);
      setRetryCountdown(retryDelaySec);
    } catch (err: any) {
      setStatus("error");
      setError(err?.message || "Fetch error");
      setRetryCountdown(retryDelaySec);
    }
  }, [url, retryDelaySec]);

  // Initial fetch on mount
  useEffect(() => {
    fetchCategories();
    return () => {
      retryTimer.current && clearTimeout(retryTimer.current);
    };
  }, [fetchCategories]);

  // Retry countdown if failed
  useEffect(() => {
    if (status !== "error") return;

    if (retryCountdown > 0) {
      retryTimer.current = window.setTimeout(() => setRetryCountdown(retryCountdown - 1), 1000);
    } else {
      fetchCategories();
    }

    return () => {
      retryTimer.current && clearTimeout(retryTimer.current);
    };
  }, [status, retryCountdown, fetchCategories]);

  // Sync cookie with realCategories when fetched
  useEffect(() => {
    if (realCategories.length === 0) return;

    const allValid =
      selectedCategories.length > 0 &&
      selectedCategories.every(cat => realCategories.includes(cat));

    if (!allValid) {
      setSelectedCategoriesCookie(realCategories);
    }
  }, [realCategories, selectedCategories, setSelectedCategoriesCookie]);

  // Setter that filters categories to valid backend list before saving
  const setSelectedCategories = (cats: string[]) => {
    const filtered = cats.filter(cat => realCategories.includes(cat));
    setSelectedCategoriesCookie(filtered);
  };

  return {
    realCategories,
    selectedCategories,
    status,
    error,
    retryCountdown: status === "error" ? retryCountdown : 0,
    retry: fetchCategories,
    fetchCategories,
    setSelectedCategories,
  };
}
