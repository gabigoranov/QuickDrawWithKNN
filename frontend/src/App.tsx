import { useRef, useState, useEffect } from "react";
import DrawingCanvas, { type DrawingCanvasRef } from "./components/DrawingCanvas";
import Countdown from "./components/Countdown";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faArrowRotateLeft, faPlus } from '@fortawesome/free-solid-svg-icons';

import { NotificationProvider, useNotifications } from './components/NotificationContext';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Settings from "./pages/Settings";
import SettingsButton from "./components/SettingsButton";

import "./styles/AppLayout.css";
import "./styles/CanvasPanel.css";
import "./styles/InfoPanel.css";
import "./styles/ToastNotification.css";
import { useCategoryService } from "./services/categoryService";

function AppContent() {
  const canvasRef = useRef<DrawingCanvasRef>(null);

  // Use category service to get categories and user selections
  const {
    realCategories,
    selectedCategories,
    status,
    error,
    retryCountdown,
  } = useCategoryService("http://localhost:8000/categories", 5);

  const [currentCategory, setCurrentCategory] = useState("");
  const [prediction, setPrediction] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [userHasDrawn, setUserHasDrawn] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [countdownRunning, setCountdownRunning] = useState(false);
  const [recentCategories, setRecentCategories] = useState<string[]>([]);
  const [timeRanOut, setTimeRanOut] = useState(false);
  const retryNotificationId = useRef<string | null>(null);
  const { addNotification, removeNotification } = useNotifications();

  const effectiveCountdownRunning = countdownRunning && !isCorrect;

  useEffect(() => {
  console.log("userHasDrawn:", userHasDrawn);
}, [userHasDrawn]);

useEffect(() => {
  if (status === "loading") {
    // Optionally remove old retry notification when loading again
    if (retryNotificationId.current) {
      removeNotification(retryNotificationId.current);
      retryNotificationId.current = null;
    }
  }

  if (status === "error") {
    if (retryNotificationId.current) {
      removeNotification(retryNotificationId.current);  // remove previous
      retryNotificationId.current = null;
    }
    // Add new updated retry notification and save id
    retryNotificationId.current = addNotification({
      message: error
        ? `Failed to load categories: ${error}. Retrying in ${retryCountdown}s`
        : `Failed to load categories. Retrying in ${retryCountdown}s`,
      duration: undefined,  // persistent
      data: { retryCountdown },
    });
  }

  if (status === "success") {
    if (retryNotificationId.current) {
      removeNotification(retryNotificationId.current);
      retryNotificationId.current = null;
    }
  }

  // Cleanup on unmount
  return () => {
    if (retryNotificationId.current) {
      removeNotification(retryNotificationId.current);
      retryNotificationId.current = null;
    }
  };
}, [status, error, retryCountdown, addNotification, removeNotification]);

  // Pick random category when loading or selection changes
  useEffect(() => {
    if ((selectedCategories.length > 0 || realCategories.length > 0)) {
      selectRandomCategory();
    }
  }, [selectedCategories, realCategories]);

  // Countdown control
  useEffect(() => {
    if (userHasDrawn && !isCorrect) {
      setCountdownRunning(true);
    } else {
      setCountdownRunning(false);
    }
  }, [userHasDrawn, isCorrect]);

  // Poll prediction every 3s when active countdown and user has drawn
  useEffect(() => {
    if (!effectiveCountdownRunning || !userHasDrawn) return;

    const interval = setInterval(() => {
      pollPrediction();
    }, 3000);

    return () => clearInterval(interval);
  }, [effectiveCountdownRunning, userHasDrawn, currentCategory]);

  async function pollPrediction() {
    if (!userHasDrawn || !canvasRef.current) return;
    try {
      const strokes = canvasRef.current.getStrokes();
      const res = await fetch("http://localhost:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strokes }),
      });
      const data = await res.json();
      setPrediction(data.prediction);
      if (data.prediction === currentCategory) {
        setIsCorrect(true);
        setShowPopup(true);
        setCountdownRunning(false);
      }
    } catch (e) {
      console.error("Prediction error:", e);
      addNotification({
        message: "Prediction service error. Please try again later.",
        duration: 5000,
      });
    }
  }

  function selectRandomCategory() {
    setTimeRanOut(false);
    const source = selectedCategories.length ? selectedCategories : realCategories;
    if (!source.length) {
      addNotification({
        message: "No categories available to draw from. Please check server.",
        duration: 5000,
      });
      return;
    }

    const available = source.filter(cat => !recentCategories.includes(cat));
    const pool = available.length > 0 ? available : source;
    const randomIndex = Math.floor(Math.random() * pool.length);
    const newCategory = pool[randomIndex];

    setCurrentCategory(newCategory);
    setIsCorrect(false);
    setPrediction(null);
    setUserHasDrawn(false);
    setShowPopup(false);
    setResetKey(k => k + 1);
    setCountdownRunning(false);
    canvasRef.current?.clearCanvas();

    setRecentCategories(prev => {
      const updated = [...prev, newCategory];
      return updated.length > 15 ? updated.slice(updated.length - 15) : updated;
    });
  }

  function handleClear() {
    canvasRef.current?.clearCanvas();
    setUserHasDrawn(false);
  }

  return (
    <div className="app-layout">
      <main className="canvas-panel" aria-label="Drawing Canvas Area">
        <DrawingCanvas
          ref={canvasRef}
          isCorrect={isCorrect}
          userHasDrawn={userHasDrawn}
          onUserDrawnChange={setUserHasDrawn}
          className="drawing-canvas"
          isDrawingDisabled={false}
        />

        <div className="category-prompt-container">
          <div
            className="centered-items"
            style={{ position: "relative", flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <h1 className="category-prompt info-container" style={{ margin: 0 }}>
              {!isCorrect && (
                <>
                  <span className="hide-mobile">Draw this: </span><b>{currentCategory}</b>
                </>
              )}
            </h1>

            <Countdown
              duration={30}
              onComplete={() => {
                if (!isCorrect) setTimeRanOut(true);
              }}
              running={effectiveCountdownRunning}
              resetTrigger={resetKey}
            />
          </div>

          <SettingsButton />
        </div>

        <div className="actions">
          <button
            className="clear-btn info-container"
            onClick={handleClear}
            disabled={!userHasDrawn}
            aria-disabled={!userHasDrawn}
          >
            <span className="hide-mobile">Clear</span>
            <span className="show-mobile"><FontAwesomeIcon icon={faTrash} size="2x" color="#FFFFFF" /></span>
          </button>
          <button className="tryagain-btn info-container" onClick={selectRandomCategory}>
            <span className="hide-mobile">Try Again</span>
            <span className="show-mobile"><FontAwesomeIcon icon={faPlus} size="2x" color="#FFFFFF" /></span>
          </button>
          {prediction && !isCorrect && (
            <div className="prediction info-container">
              <span className="hide-mobile">Prediction: </span><b>{prediction}</b>
            </div>
          )}
          <button
            className="undo-btn info-container"
            onClick={() => {
              canvasRef.current?.undoLastStroke();
              setUserHasDrawn(() => {
                const strokes = canvasRef.current?.getStrokes() || [];
                return strokes.length > 0;
              });
            }}
            disabled={!userHasDrawn}
            aria-disabled={!userHasDrawn}
          >
            <span className="hide-mobile">Undo</span>
            <span className="show-mobile"><FontAwesomeIcon icon={faArrowRotateLeft} size="2x" color="#FFFFFF" /></span>
          </button>
        </div>
      </main>

      {showPopup && (
        <div className="popup" role="dialog" aria-live="assertive" aria-modal="true">
          <div className="popup-content">
            🎉 Congratulations! 🎉
            <br />
            You correctly drew a <b>{currentCategory}</b>!
            <br />
            <button onClick={selectRandomCategory} autoFocus>
              Try another
            </button>
          </div>
        </div>
      )}

      {timeRanOut && (
        <div className="popup" role="dialog" aria-live="assertive" aria-modal="true">
          <div className="popup-content">
            🥲 Oh noooo le policia! 🥲
            <br />
            You didn't draw a <b>{currentCategory}</b> in time!
            <br />
            <button onClick={() => {
              selectRandomCategory();
            }} autoFocus>
              Try again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <NotificationProvider>
      <Router>
        <Routes>
          <Route path="/" element={<AppContent />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Router>
    </NotificationProvider>
  );
}
