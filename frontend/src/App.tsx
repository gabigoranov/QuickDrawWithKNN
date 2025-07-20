import { useRef, useState, useEffect, useCallback } from "react";
import DrawingCanvas, { type DrawingCanvasRef } from "./components/DrawingCanvas";
import "./styles/AppLayout.css";
import "./styles/CanvasPanel.css";
import "./styles/InfoPanel.css";
import "./styles/HamburgerMenu.css";
import "./styles/ToastNotification.css"; // Ensure this includes styles for .toast-notification-container
import Countdown from "./components/Countdown";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { faArrowRotateLeft } from '@fortawesome/free-solid-svg-icons';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import HamburgerMenu from "./components/HamburgerMenu";

// Import the new NotificationProvider and useNotifications hook
import { NotificationProvider, useNotifications } from './components/NotificationContext';
// Import your custom hook for fetching categories
import { useCategoriesWithRetry } from './hooks/useCategoriesWithRetry'; // Adjust path if needed

// Helper component to manage category loading notifications
function CategoriesLoader({ setCategoriesFromHook }: { setCategoriesFromHook: (cats: string[]) => void }) {
  const { categories, status, retryCountdown } = useCategoriesWithRetry("http://localhost:8000/categories", 5);
  const { addNotification, removeNotification } = useNotifications();

  const loadingNotificationId = useRef<string | null>(null);
  const retryNotificationId = useRef<string | null>(null);

  useEffect(() => {
    // When loading starts, show loading notification
    if (status === 'loading') {
      // Only add once, or update if existing
      if (!loadingNotificationId.current) {
        loadingNotificationId.current = addNotification({
          message: 'Loading categories...',
          duration: undefined, // Persistent
        });
      }
      // If retry notification was visible, remove it as we are now loading again
      if (retryNotificationId.current) {
        removeNotification(retryNotificationId.current);
        retryNotificationId.current = null;
      }
    } else if (status === 'success') {
      // Remove loading and retry notifications
      if (loadingNotificationId.current) {
        removeNotification(loadingNotificationId.current);
        loadingNotificationId.current = null;
      }
      if (retryNotificationId.current) {
        removeNotification(retryNotificationId.current);
        retryNotificationId.current = null;
      }
      // Pass categories to parent App component
      setCategoriesFromHook(categories);
    } else if (status === 'error') {
      // Remove loading notification if it was there
      if (loadingNotificationId.current) {
        removeNotification(loadingNotificationId.current);
        loadingNotificationId.current = null;
      }
      // Show or update retry notification with countdown
      if (!retryNotificationId.current) {
        retryNotificationId.current = addNotification({
          message: 'Failed to load categories.',
          duration: undefined, // Persistent
          data: { retryCountdown },
        });
      } else {
        // If the retry notification already exists, we update it by re-adding.
        // This is a simple way to update the children (countdown).
        // A more advanced system might have an `updateNotification` method.
        removeNotification(retryNotificationId.current); // Remove old one
        retryNotificationId.current = addNotification({ // Add new one with updated data
          message: 'Failed to load categories.',
          duration: undefined,
          data: { retryCountdown },
        });
      }
    }

    // Cleanup on unmount or status change to avoid memory leaks
    return () => {
      if (loadingNotificationId.current) {
        removeNotification(loadingNotificationId.current);
        loadingNotificationId.current = null;
      }
      if (retryNotificationId.current) {
        removeNotification(retryNotificationId.current);
        retryNotificationId.current = null;
      }
    };
  }, [status, retryCountdown, categories, addNotification, removeNotification, setCategoriesFromHook]);

  return null; // This component renders no UI itself
}


function AppContent() { // Renamed App to AppContent and wrapped by NotificationProvider below
  const canvasRef = useRef<DrawingCanvasRef>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [currentCategory, setCurrentCategory] = useState<string>("");
  const [prediction, setPrediction] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [userHasDrawn, setUserHasDrawn] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [countdownRunning, setCountdownRunning] = useState(false);
  const [recentCategories, setRecentCategories] = useState<string[]>([]);
  const [timeRanOut, setTimeRanOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Use the new notification system
  const { addNotification } = useNotifications();

  // Function to set categories received from the CategoriesLoader
  const handleSetCategories = useCallback((loadedCategories: string[]) => {
    setCategories(loadedCategories);
  }, []);


  const effectiveCountdownRunning = countdownRunning && !menuOpen && !isCorrect;

  // On categories loaded or reset, choose random category
  useEffect(() => {
    if (categories.length > 0) {
      selectRandomCategory();
    }
  }, [categories]); // This effect now correctly depends on `categories` state

  useEffect(() => {
    if (menuOpen) {
      addNotification({
        message: "Drawing is disabled while the menu is open",
        duration: 3000, // This notification will disappear after 3 seconds
      });
    }
  }, [menuOpen, addNotification]);

  function selectRandomCategory() {
    setTimeRanOut(false);
    const source = selectedCategories.length ? selectedCategories : categories;
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
    setResetKey((k) => k + 1);
    setCountdownRunning(false);
    canvasRef.current?.clearCanvas();

    setRecentCategories(prev => {
      const updated = [...prev, newCategory];
      return updated.length > 15 ? updated.slice(updated.length - 15) : updated;
    });
  }

  // Start countdown only after user has drawn something
  useEffect(() => {
    if (userHasDrawn && !isCorrect) {
      setCountdownRunning(true);
    } else {
      setCountdownRunning(false);
    }
  }, [userHasDrawn, isCorrect]);

  // Poll prediction every 3 seconds only if userHasDrawn & !isCorrect
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
      console.log(strokes)
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

  function handleClear() {
    canvasRef.current?.clearCanvas();
    setUserHasDrawn(false); // Reset userHasDrawn on clear
  }

  return (
    <div className="app-layout">
      {/* CategoriesLoader ensures categories are fetched and notifications are handled */}
      <CategoriesLoader setCategoriesFromHook={handleSetCategories} />

      <main className="canvas-panel" aria-label="Drawing Canvas Area">
        <DrawingCanvas
          ref={canvasRef}
          isCorrect={isCorrect}
          userHasDrawn={userHasDrawn}
          onUserDrawnChange={setUserHasDrawn}
          className="drawing-canvas"
          isDrawingDisabled={menuOpen}
        />

        {/* Positioned items */}
        <div className="category-prompt-container">
          <HamburgerMenu
            categories={categories} // Use the categories from state
            selectedCategories={selectedCategories}
            setSelectedCategories={setSelectedCategories}
            isOpen={menuOpen}
            setIsOpen={setMenuOpen}
          />
          <div className="centered-items">
            <h1 className="category-prompt info-container">
              {!isCorrect && <><span className="hide-mobile">Draw this: </span><b>{currentCategory}</b></>}
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
        </div>

        <div className="actions">
          <button
            className="clear-btn info-container"
            onClick={handleClear}
            disabled={!userHasDrawn}
            aria-disabled={!userHasDrawn}
          >
            <span className="hide-mobile">Clear</span><span className="show-mobile"><FontAwesomeIcon icon={faTrash} size="2x" color="#FFFFFF" /></span>
          </button>
          <button className="tryagain-btn info-container" onClick={selectRandomCategory}>
            <span className="hide-mobile">Try Again</span><span className="show-mobile"><FontAwesomeIcon icon={faPlus} size="2x" color="#FFFFFF" /></span>
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
              setUserHasDrawn(
                (prev) => {
                  // Check if after undo there are no strokes
                  const strokes = canvasRef.current?.getStrokes() || [];
                  return strokes.length > 0 ? true : false;
                }
              );
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

// Main App component that wraps the content with the NotificationProvider
export default function App() {
  return (
    <NotificationProvider>
      <AppContent />
    </NotificationProvider>
  );
}
