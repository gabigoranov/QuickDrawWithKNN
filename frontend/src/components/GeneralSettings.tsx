import { useCookie } from "../hooks/useCookie";
import { useRef } from "react";

const languages = [
  { label: "English", value: "en" },
  { label: "Español", value: "es" },
  { label: "Français", value: "fr" },
  { label: "Deutsch", value: "de" },
  // ...add as needed
];

export default function GeneralSettings() {
  const [k, setK] = useCookie<number>("setting_k", 15, { days: 365 });
  const [lang, setLang] = useCookie<string>("setting_language", "en", { days: 365 });
  const [theme, setTheme] = useCookie<string>("setting_theme", "auto", { days: 365 });
  const [confirmClear, setConfirmClear] = useCookie<boolean>("setting_confirm_clear", true, { days: 365 });
  const [showTips, setShowTips] = useCookie<boolean>("setting_show_tips", true, { days: 365 });
  const [appSound, setAppSound] = useCookie<boolean>("setting_app_sound", true, { days: 365 });

  // Fade-in animation when rendered
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <section
      className="settings-section modern-setting-card"
      ref={cardRef}
    >
      <h2>General Settings</h2>

      {/* Number of recent categories */}
      <div className="settings-form-row">
        <label className="settings-label" htmlFor="setting-remembered-categories">
          Number of recent categories remembered
        </label>
        <input
          id="setting-remembered-categories"
          type="number"
          min={1}
          value={k}
          onChange={e => {
            const val = Number(e.target.value);
            if (!isNaN(val) && val > 0) setK(val);
          }}
          className="settings-input"
        />
        <small className="settings-help">
          How many recent categories are excluded when picking a new one.
        </small>
      </div>

      {/* Language */}
      <div className="settings-form-row">
        <label className="settings-label" htmlFor="setting-language">Language</label>
        <select
          id="setting-language"
          value={lang}
          onChange={e => setLang(e.target.value)}
          className="settings-select"
        >
          {languages.map(l => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
        <small className="settings-help">
          Change the language for menus and notifications.
        </small>
      </div>

      {/* Theme (dark, light, auto) */}
      <div className="settings-form-row">
        <label className="settings-label" htmlFor="setting-theme">App Theme</label>
        <select
          id="setting-theme"
          value={theme}
          onChange={e => setTheme(e.target.value)}
          className="settings-select"
        >
          <option value="auto">Auto</option>
          <option value="dark">Dark</option>
          <option value="light">Light</option>
        </select>
        <small className="settings-help">
          Automatically match OS, or force dark/light mode.
        </small>
      </div>
    </section>
  );
}
