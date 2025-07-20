import { useCookie } from "../hooks/useCookie";

export default function AccessibilitySettings() {
  const [fontSize, setFontSize] = useCookie<string>("accessibility_font_size", "medium", { days: 365 });
  const [highContrast, setHighContrast] = useCookie<boolean>("accessibility_high_contrast", false, { days: 365 });

  const fontSizes = [
    { label: "Small", value: "small" },
    { label: "Medium", value: "medium" },
    { label: "Large", value: "large" },
    { label: "Extra Large", value: "xlarge" },
  ];

  return (
    <section className="settings-section">
      <h2>Accessibility</h2>

      <label className="settings-label" htmlFor="font-size-select">
        Font size:
      </label>
      <select
        id="font-size-select"
        className="settings-select"
        value={fontSize}
        onChange={(e) => setFontSize(e.target.value)}
      >
        {fontSizes.map((fs) => (
          <option key={fs.value} value={fs.value}>
            {fs.label}
          </option>
        ))}
      </select>

      <div style={{ marginTop: "1.2rem" }}>
        <label className="settings-label" htmlFor="high-contrast-toggle">
          High contrast mode:
        </label>
        <label className="toggle-switch">
          <input
            type="checkbox"
            id="high-contrast-toggle"
            checked={highContrast}
            onChange={(e) => setHighContrast(e.target.checked)}
          />
          <span className="slider"></span>
        </label>
      </div>
    </section>
  );
}
