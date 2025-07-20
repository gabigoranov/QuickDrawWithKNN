import GeneralSettings from "../components/GeneralSettings";
import CategoriesSettings from "../components/CategoriesSettings";
import NotificationSettings from "../components/NotificationSettings";
import CountdownSettings from "../components/CountdownSettings";
import AccessibilitySettings from "../components/AccessabilitySettings";
import '../styles/Settings.css';
import '../styles/SettingsTabs.css';
import { useState } from "react";
import { useCategories } from "../services/categoryService";

const tabs = [
  { id: "general", label: "General" },
  { id: "categories", label: "Categories" },
  { id: "notifications", label: "Notifications" },
  { id: "countdown", label: "Countdown" },
  { id: "accessibility", label: "Accessibility" },
];

export default function Settings() {
  const {
    categories,
    status: categoriesStatus,
    error: categoriesError,
    retryCountdown: categoriesRetryCountdown,
    retry: retryCategories
  } = useCategories();

  const [activeTab, setActiveTab] = useState("general");

  function renderTabContent() {
    switch (activeTab) {
      case "general":
        return <GeneralSettings />;
      case "categories":
        console.log(categories)
        
        return <CategoriesSettings
            categories={categories}
            status={categoriesStatus}
            error={categoriesError}
            retryCountdown={categoriesRetryCountdown}
            retry={retryCategories}
            />
      case "notifications":
        return <NotificationSettings />;
      case "countdown":
        return <CountdownSettings />;
      case "accessibility":
        return <AccessibilitySettings />;
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