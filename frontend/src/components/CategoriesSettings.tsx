import { useCookie } from "../hooks/useCookie";
import { useEffect, useRef } from "react";

interface CategoriesSettingsProps {
  categories: string[];
  status: "idle" | "loading" | "success" | "error";
  error?: string;
  retryCountdown?: number;
  retry?: () => void;
}

export default function CategoriesSettings({
  categories,
  status,
  error,
  retryCountdown,
  retry,
}: CategoriesSettingsProps) {
  // Use cookie for selection; default to all if first load
  const [selectedCategories, setSelectedCategories] = useCookie<string[]>(
    "selected_categories",
    categories,
    { days: 365 }
  );
  const cardRef = useRef<HTMLDivElement>(null);
  const safeCategories = Array.isArray(categories) ? categories : [];

  const isInitialMount = useRef(true);

  useEffect(() => {
    if (!isInitialMount.current) return;  
    if (safeCategories.length > 0 
        && (selectedCategories.length === 0 || selectedCategories.some(cat => !safeCategories.includes(cat)))
    ) {
        setSelectedCategories(safeCategories);
    }  
    isInitialMount.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  const allSelected = selectedCategories.length === categories.length;
  const noneSelected = selectedCategories.length === 0;

  function toggleCategory(cat: string) {
    setSelectedCategories(
      selectedCategories.includes(cat)
        ? selectedCategories.filter((c) => c !== cat)
        : [...selectedCategories, cat]
    );
  }

  function handleSelectAll() {
    setSelectedCategories(categories);
  }
  function handleDeselectAll() {
    setSelectedCategories([]);
  }

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

      {/* Handle loading and error UI here */}
      {status === "loading" && (
        <div className="settings-loading">Loading categories...</div>
      )}
      {status === "error" && (
        <div className="settings-error">
          {error || "Could not load categories, please try again later."}
          {retryCountdown !== undefined && retryCountdown > 0 && (
            <span style={{ marginLeft: 8 }}>
              Retrying in {retryCountdown}s...
            </span>
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

      {/* Show category checkboxes only if success and categories */}
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
          <ul
            className="categories-modern-grid"
            role="listbox"
            aria-label="Category selection"
          >
            {categories.map((cat: string) => (
              <li className="category-modern-row" key={cat}>
                <label
                  className={`modern-checkbox-label${
                    selectedCategories.includes(cat) ? " checked" : ""
                  }`}
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
                    {selectedCategories.includes(cat) && (
                      <span className="modern-checkbox-tick" />
                    )}
                  </span>
                  <span className="category-label-text">{cat}</span>
                </label>
              </li>
            ))}
          </ul>
          <div
            className="settings-help"
            style={{ marginTop: "1rem", textAlign: "right" }}
          >
            {selectedCategories.length} of {categories.length} selected
          </div>
        </>
      )}
    </section>
  );
}
