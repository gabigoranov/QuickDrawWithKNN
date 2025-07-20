import { useState, useEffect, useRef, type JSX } from "react";
import { useCookie } from "../hooks/useCookie";

interface CategoriesSettingsProps {
  categories: string[];
  status: "idle" | "loading" | "success" | "error";
  error?: string;
  retryCountdown?: number;
  retry?: () => void;
  selectedCategories: string[];
  setSelectedCategories: (cats: string[]) => void;
}

export default function CategoriesSettings({
  categories,
  status,
  error,
  retryCountdown,
  retry,
}: CategoriesSettingsProps): JSX.Element {
  const safeCategories: string[] = Array.isArray(categories) ? categories : [];

  const [selectedCategories, setSelectedCategories] = useCookie<string[]>(
    "selected_categories",
    safeCategories,
    { days: 365 }
  );
  const cardRef = useRef<HTMLDivElement>(null);

  const [showEmptyWarning, setShowEmptyWarning] = useState<boolean>(false);
  const prevSelectedRef = useRef<string[]>(selectedCategories);

  // On first mount, initialize selection if empty
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      if (safeCategories.length > 0 && selectedCategories.length === 0) {
        setSelectedCategories(safeCategories);
      }
      isInitialMount.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeCategories]);

  // Keep track of previous selection
  useEffect(() => {
    prevSelectedRef.current = selectedCategories;
  }, [selectedCategories]);

  function updateSelection(newSelection: string[]): void {
    if (newSelection.length === 0) {
      setShowEmptyWarning(true);
      setSelectedCategories(newSelection);
    } else {
      setShowEmptyWarning(false);
      setSelectedCategories(newSelection);
    }
  }

  function toggleCategory(cat: string): void {
    if (selectedCategories.includes(cat)) {
      const newSelection = selectedCategories.filter((c: string) => c !== cat);
      updateSelection(newSelection);
    } else {
      setShowEmptyWarning(false);
      setSelectedCategories([...selectedCategories, cat]);
    }
  }

  function handleSelectAll(): void {
    setShowEmptyWarning(false);
    setSelectedCategories(categories);
  }

  function handleDeselectAll(): void {
    updateSelection([]);
  }

  const allSelected: boolean = selectedCategories.length === categories.length;
  const noneSelected: boolean = selectedCategories.length === 0;

  return (
    <section className="settings-section modern-setting-card" ref={cardRef}>
      <h2>
        <span role="img" aria-label="Categories">
          📚
        </span>{" "}
        Category Filters
      </h2>
      <p className="settings-help" style={{ marginBottom: "1.3rem" }}>
        Select which categories are included for drawing prompts.
      </p>

      {showEmptyWarning && (
        <div className="settings-error" role="alert" style={{ marginBottom: "1rem" }}>
          ⚠️ Please select at least one category to save your changes.
        </div>
      )}

      {status === "loading" && <div className="settings-loading">Loading categories...</div>}
      {status === "error" && (
        <div className="settings-error">
          {error || "Could not load categories, please try again later."}
          {retryCountdown !== undefined && retryCountdown > 0 && (
            <span style={{ marginLeft: 8 }}>Retrying in {retryCountdown}s...</span>
          )}
          {retry && (
            <button onClick={retry} style={{ marginLeft: 12 }}>
              Retry Now
            </button>
          )}
        </div>
      )}
      {status === "success" && categories.length === 0 && (
        <div className="settings-error">No categories available.</div>
      )}

      {status === "success" && categories.length > 0 && (
        <>
          <div className="categories-actions">
            <button
              className={`categories-btn ${allSelected ? "active" : ""}`}
              onClick={handleSelectAll}
              type="button"
              disabled={allSelected}
            >
              Select All
            </button>
            <button
              className={`categories-btn ${noneSelected ? "active" : ""}`}
              onClick={handleDeselectAll}
              type="button"
              disabled={noneSelected}
            >
              Deselect All
            </button>
          </div>
          <ul className="categories-modern-grid" role="listbox" aria-label="Category selection">
            {categories.map((cat: string) => (
              <li className="category-modern-row" key={cat}>
                <label
                  className={`modern-checkbox-label${selectedCategories.includes(cat) ? " checked" : ""}`}
                  tabIndex={0}
                  aria-checked={selectedCategories.includes(cat)}
                >
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat)}
                    tabIndex={-1}
                    onChange={() => toggleCategory(cat)}
                    className="modern-checkbox"
                  />
                  <span className="modern-checkbox-custom">
                    {selectedCategories.includes(cat) && <span className="modern-checkbox-tick" />}
                  </span>
                  <span className="category-label-text">{cat}</span>
                </label>
              </li>
            ))}
          </ul>
          <div className="settings-help" style={{ marginTop: "1rem", textAlign: "right" }}>
            {selectedCategories.length} of {categories.length} selected
          </div>
        </>
      )}
    </section>
  );
}
