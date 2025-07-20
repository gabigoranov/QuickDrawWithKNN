import { useCookie } from "../hooks/useCookie"; // Assuming useCookie is available

export default function NotificationSettings() {
  // Renaming to be more generic for "notifications enabled"
  // If you only have sound, then "notifications_sound" is fine as is.
  // If you have other types of notifications, maybe rename this cookie to "notifications_enabled"
  const [notificationsEnabled, setNotificationsEnabled] = useCookie<boolean>(
    "notifications_sound", // or "notifications_enabled" if more general
    true,
    { days: 365 }
  );

  return (
    <section className="settings-section modern-setting-card"> {/* Added modern-setting-card class for consistent styling */}
      <h2>Notification Settings</h2>

      <div className="settings-form-row">
        <div className="row">
          <label className="settings-label" htmlFor="notifications-toggle">
            Enable Notifications
          </label>
          <label className="toggle-switch">
            <input
              type="checkbox"
              id="notifications-toggle"
              checked={notificationsEnabled}
              onChange={(e) => setNotificationsEnabled(e.target.checked)}
            />
            <span className="slider"></span>
          </label>
        </div>
        <small className="settings-help">
          Toggle notifications on or off across the application.
        </small>
      </div>

      {/* Volume control is removed as per your request */}
    </section>
  );
}
