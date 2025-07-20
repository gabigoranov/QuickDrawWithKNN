import { useCookie } from "../hooks/useCookie";

export default function CountdownSettings() {
  const [duration, setDuration] = useCookie<number>("countdown_duration", 30, { days: 365 });
  const [alertEnabled, setAlertEnabled] = useCookie<boolean>("countdown_alert_enabled", true, { days: 365 });

  return (
    <section className="settings-section">
      <h2>Countdown Timer</h2>

      <label className="settings-label" htmlFor="duration-input">
        Countdown duration (seconds):
      </label>
      <input
        id="duration-input"
        type="number"
        min={5}
        max={120}
        step={1}
        value={duration}
        onChange={(e) => {
          const val = Number(e.target.value);
          if (val >= 5 && val <= 120) setDuration(val);
        }}
        className="settings-input"
      />
      <small className="settings-help">Set how long the drawing countdown lasts.</small>

      <div style={{ marginTop: "1rem" }}>
        <label className="settings-label" htmlFor="alert-toggle">
          Enable alert on countdown end:
        </label>
        <label className="toggle-switch">
          <input
            type="checkbox"
            id="alert-toggle"
            checked={alertEnabled}
            onChange={(e) => setAlertEnabled(e.target.checked)}
          />
          <span className="slider"></span>
        </label>
      </div>
    </section>
  );
}
