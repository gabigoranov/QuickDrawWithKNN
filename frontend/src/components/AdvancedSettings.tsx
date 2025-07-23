import { useRef } from "react";
import { useCookie } from "../hooks/useCookie"; // Adjust import path as needed

export interface AdvancedSettingsState {
  k: number;
  distanceMetric: "euclidean" | "manhattan";
  indexAlgorithm: "brute_force" | "kd_tree" | "ball_tree";
  pcaComponents: number;
  showPredictionConfidence: boolean;
}

export const ADVANCED_DEFAULTS: AdvancedSettingsState = {
  k: 5,
  distanceMetric: "euclidean",
  indexAlgorithm: "kd_tree",
  pcaComponents: 64,
  showPredictionConfidence: false,
};

export default function AdvancedSettings() {
  const cardRef = useRef<HTMLDivElement>(null);

  // Use cookie hook instead of useState, with 30 days expiry
  const [settings, setSettings] = useCookie<AdvancedSettingsState>(
    "advancedSettings",
    ADVANCED_DEFAULTS,
    { days: 30 }
  );

  const handleNumberChange =
    (field: keyof AdvancedSettingsState, min = 1, max = 20) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = Math.max(min, Math.min(max, Number(e.target.value)));
      setSettings({ ...settings, [field]: val });
    };

  const handleSelectChange =
    (field: keyof AdvancedSettingsState) =>
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      // Type assertion needed for union types on string values
      setSettings({ ...settings, [field]: e.target.value as any });
    };

  const handleCheckboxChange =
    (field: keyof AdvancedSettingsState) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSettings({ ...settings, [field]: e.target.checked });
    };

  const handleReset = () => {
    setSettings(ADVANCED_DEFAULTS);
  };

  return (
    <section className="settings-section modern-setting-card" ref={cardRef}>
      <h2>Advanced Settings</h2>

      {/* k value */}
      <div className="settings-form-row">
        <label className="settings-label" htmlFor="setting-k">
          Number of Neighbors (k)
        </label>
        <input
          id="setting-k"
          type="number"
          min={1}
          max={20}
          step={1}
          value={settings.k}
          onChange={handleNumberChange("k", 1, 20)}
          className="settings-input"
        />
        <small className="settings-help">
          Adjust to experiment with underfitting/overfitting (1–20).
        </small>
      </div>

      {/* Distance metric */}
      <div className="settings-form-row">
        <label className="settings-label" htmlFor="setting-distance">
          Distance Metric
        </label>
        <select
          id="setting-distance"
          value={settings.distanceMetric}
          onChange={handleSelectChange("distanceMetric")}
          className="settings-select"
        >
          <option value="euclidean">Euclidean</option>
          <option value="manhattan">Manhattan</option>
        </select>
        <small className="settings-help">
          Select distance function used by KNN.
        </small>
      </div>

      {/* Indexing Algorithm */}
      <div className="settings-form-row">
        <label className="settings-label" htmlFor="setting-index">
          Indexing Structure
        </label>
        <select
          id="setting-index"
          value={settings.indexAlgorithm}
          onChange={handleSelectChange("indexAlgorithm")}
          className="settings-select"
        >
          <option value="brute_force">Brute Force</option>
          <option value="kd_tree">KD Tree</option>
          <option value="ball_tree">Ball Tree</option>
        </select>
        <small className="settings-help">
          Choose how nearest neighbors are searched for performance tradeoffs.
        </small>
      </div>

      {/* PCA Components */}
      <div className="settings-form-row">
        <label className="settings-label" htmlFor="setting-pca">
          Dimensionality Reduction (PCA Components)
        </label>
        <input
          id="setting-pca"
          type="range"
          min={8}
          max={128}
          value={settings.pcaComponents}
          onChange={handleNumberChange("pcaComponents", 8, 128)}
          className="settings-slider"
        />
        <input
          type="number"
          min={8}
          max={128}
          value={settings.pcaComponents}
          onChange={handleNumberChange("pcaComponents", 8, 128)}
          style={{ width: 60, marginLeft: 8 }}
          className="settings-input"
        />
        <small className="settings-help">
          Controls level of data compression before classification (8–128).
        </small>
      </div>

      {/* Show Live Prediction Confidence */}
      <div className="settings-form-row">
        <label className="settings-label" htmlFor="setting-confidence">
          Show Live Prediction Confidence
        </label>
        <input
          id="setting-confidence"
          type="checkbox"
          checked={settings.showPredictionConfidence}
          onChange={handleCheckboxChange("showPredictionConfidence")}
          className="settings-checkbox"
        />
      </div>

      <div className="settings-form-row" style={{ gap: 8 }}>
        <button
          type="button"
          onClick={handleReset}
          className="settings-button secondary"
        >
          Reset to Default Settings
        </button>
      </div>
    </section>
  );
}
