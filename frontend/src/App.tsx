import useThemeService from "./hooks/useThemeService";
import AppContent from "./pages/AppContent";
import Settings from "./pages/Settings";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import "./styles/AppLayout.css";
import "./styles/CanvasPanel.css";
import "./styles/InfoPanel.css";
import "./styles/ToastNotification.css";

export default function App() {
  useThemeService();

  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppContent />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Router>
  );
}
