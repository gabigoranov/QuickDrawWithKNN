import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGear } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from "react-router-dom";

export default function SettingsButton() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/settings")}
      aria-label="Open Settings"
      className="settings-btn"
      type="button"
      title="Settings"
    >
      <FontAwesomeIcon icon={faGear} size="xl" color="#FFFFFF" />
    </button>
  );
}
