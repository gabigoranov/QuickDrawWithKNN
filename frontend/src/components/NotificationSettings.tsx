import { useCookie } from "../hooks/useCookie";

export default function NotificationSettings() {
  const [soundEnabled, setSoundEnabled] = useCookie<boolean>("notifications_sound", true, { days: 365 });
  const [volume, setVolume] = useCookie<number>("notifications_volume", 70, { days: 365 });

  return (
    <section className="settings-section">
      <h2>Notification Settings</h2>

      <label className="settings-label" htmlFor="sound-toggle">
        Enable sound:
      </label>
      <label className="toggle-switch">
        <input
          type="checkbox"
          id="sound-toggle"
          checked={soundEnabled}
          onChange={(e) => setSoundEnabled(e.target.checked)}
        />
        <span className="slider"></span>
      </label>

      <label className="settings-label" htmlFor="volume-range" style={{ marginTop: "1rem" }}>
        Volume: {volume}%
      </label>
      <input
        id="volume-range"
        type="range"
        min={0}
        max={100}
        step={1}
        value={volume}
        onChange={(e) => setVolume(Number(e.target.value))}
      />
    </section>
  );
}
