import { useEffect } from "react";

interface HamburgerMenuProps {
  categories: string[];
  selectedCategories: string[];
  setSelectedCategories: (cats: string[]) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function HamburgerMenu({
  categories,
  selectedCategories,
  setSelectedCategories,
  isOpen,
  setIsOpen,
}: HamburgerMenuProps) {
  // Initialize ALL checked when categories load and selectedCategories is empty
  useEffect(() => {
    if (categories.length && selectedCategories.length === 0) {
      setSelectedCategories(categories);
    }
    // eslint-disable-next-line
  }, [categories]);

  function toggleMenu() {
    setIsOpen(!isOpen);
  }

  function toggleCategory(category: string) {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  }

  return (
    <div className="hamburger-container">
      <button
        className={`hamburger-btn${isOpen ? " open" : ""}`}
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
        onClick={toggleMenu}
      >
        <span className="bar" />
        <span className="bar" />
        <span className="bar" />
      </button>

      {/* Animated, scrollable, max-width menu */}
      <div className={`hamburger-menu${isOpen ? " show" : ""}`} role="menu">
        <div className="menu-panel">
          <h3>Categories</h3>
          <ul className="categories-grid">
            {categories.map((cat) => (
              <li key={cat}>
                <label>
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat)}
                    onChange={() => toggleCategory(cat)}
                  />
                  <span>{cat}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
