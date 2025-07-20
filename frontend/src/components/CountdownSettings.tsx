import { useCookie } from "../hooks/useCookie";

export default function CountdownSettings() {
  const [duration, setDuration] = useCookie<number>("countdown_duration", 30, { days: 365 });
  const [alertEnabled, setAlertEnabled] = useCookie<boolean>("countdown_alert_enabled", true, { days: 365 });

  // Handler to validate and update duration within limits
  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (val >= 5 && val <= 120) {
      setDuration(val);
    }
  };

  return (
    <section className="settings-section modern-setting-card">
      <h2>Countdown Timer</h2>

      <div className="settings-form-row">
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
          onChange={handleDurationChange}
          className="settings-input"
          aria-describedby="duration-help"
        />
        <small id="duration-help" className="settings-help">
          Set how long the drawing countdown lasts.
        </small>
      </div>

      <div className="settings-form-row">
        <label className="settings-label" htmlFor="alert-toggle">
          Enable alert on countdown end:
        </label>
        <label className="toggle-switch" htmlFor="alert-toggle">
          <input
            type="checkbox"
            id="alert-toggle"
            checked={alertEnabled}
            onChange={(e) => setAlertEnabled(e.target.checked)}
          />
          <span className="slider" />
        </label>
      </div>
    </section>
  );
}
