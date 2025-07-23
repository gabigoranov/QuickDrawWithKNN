import { useState } from "react";
import { useNavigate } from "react-router-dom";
import GeneralSettings from "../components/GeneralSettings";
import CategoriesSettings from "../components/CategoriesSettings";
import NotificationSettings from "../components/NotificationSettings";
import CountdownSettings from "../components/CountdownSettings";

import '../styles/Settings.css';
import '../styles/SettingsTabs.css';
import '../styles/HamburgerMenu.css';
import { useCategoryService } from "../services/categoryService";
import AdvancedSettings from "../components/AdvancedSettings";

const tabs = [
  { id: "general", label: "General" },
  { id: "categories", label: "Categories" },
  { id: "notifications", label: "Notifications" },
  { id: "countdown", label: "Countdown" },
  { id: "advanced", label: "Advanced" },
];

export default function Settings() {
  const navigate = useNavigate();
  const {
    realCategories,
    selectedCategories,
    status: categoriesStatus,
    error: categoriesError,
    retryCountdown: categoriesRetryCountdown,
    retry: retryCategories,
    setSelectedCategories,
  } = useCategoryService();

  const [activeTab, setActiveTab] = useState("general");

  function renderTabContent() {
    switch (activeTab) {
      case "general":
        return <GeneralSettings />;
      case "categories":
        return (
          <CategoriesSettings
            categories={realCategories}
            status={categoriesStatus}
            error={categoriesError}
            retryCountdown={categoriesRetryCountdown}
            retry={retryCategories}
            selectedCategories={selectedCategories}
            setSelectedCategories={setSelectedCategories}
          />
        );
      case "notifications":
        return <NotificationSettings />;
      case "countdown":
        return <CountdownSettings />;
      case "advanced":
        return <AdvancedSettings />
      default:
        return null;
    }
  }

  return (
    <main className="settings-fullscreen" aria-label="Settings Page">
      <nav className="settings-sidebar" aria-label="Settings navigation">
        <h1 className="sidebar-title">⚙️ Settings</h1>

        <ul className="sidebar-tabs" role="tablist">
          {tabs.map(({ id, label }) => (
            <li key={id} role="presentation">
              <button
                role="tab"
                aria-selected={activeTab === id}
                aria-controls={`${id}-tab`}
                id={`${id}-tab-button`}
                className={`sidebar-tab${activeTab === id ? " active" : ""}`}
                onClick={() => setActiveTab(id)}
                tabIndex={activeTab === id ? 0 : -1}
                type="button"
              >
                {label}
              </button>
            </li>
          ))}
        </ul>

        {/* Footer container for navigation action */}
        <div className="sidebar-footer" style={{ marginTop: "auto", padding: "1rem 1rem 2rem" }}>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="sidebar-back-button"
            aria-label="Back to main screen"
          >
            Back to Home
          </button>
        </div>
      </nav>

      <section
        className="settings-content"
        role="tabpanel"
        aria-labelledby={`${activeTab}-tab-button`}
        id={`${activeTab}-tab`}
        tabIndex={0}
      >
        {renderTabContent()}
      </section>
    </main>
  );
}
