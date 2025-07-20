import { useRef } from "react";
import { useCookie } from "../hooks/useCookie";
import useThemeService from "../hooks/useThemeService";

const languages = [
  { label: "English", value: "en" },
  { label: "Español", value: "es" },
  { label: "Français", value: "fr" },
  { label: "Deutsch", value: "de" },
  // ...add as needed
];

export default function GeneralSettings() {
  const [theme, setTheme] = useThemeService();

  // Your other cookies/settings here
  // For example: language
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <section className="settings-section modern-setting-card" ref={cardRef}>
      <h2>General Settings</h2>

      {/* Theme */}
      <div className="settings-form-row">
        <label className="settings-label" htmlFor="setting-theme">App Theme</label>
        <select
          id="setting-theme"
          value={theme}
          onChange={e => setTheme(e.target.value as "auto" | "light" | "dark")}
          className="settings-select"
        >
          <option value="auto">Auto</option>
          <option value="dark">Dark</option>
          <option value="light">Light</option>
        </select>
        <small className="settings-help">Automatically match OS, or force dark/light mode.</small>
      </div>
    </section>
  );
}
