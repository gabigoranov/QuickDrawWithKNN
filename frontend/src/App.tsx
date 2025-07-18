import { useRef, useState, useEffect } from "react";
import DrawingCanvas, { type DrawingCanvasRef } from "./components/DrawingCanvas";
import "./styles/AppLayout.css";
import "./styles/CanvasPanel.css";
import "./styles/InfoPanel.css";
import Countdown from "./components/Countdown";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from '@fortawesome/free-solid-svg-icons'; 
import { faArrowRotateLeft } from '@fortawesome/free-solid-svg-icons'; 

function App() {
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

  // Fetch categories once
  useEffect(() => {
    fetch("http://localhost:8000/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.categories))
      .catch(console.error);
  }, []);

  // On categories loaded or reset, choose random category
  useEffect(() => {
    if (categories.length > 0) {
      selectRandomCategory();
    }
    // eslint-disable-next-line
  }, [categories]);

  function selectRandomCategory() {
    setTimeRanOut(false);
    if (!categories.length) return;

    const available = categories.filter(cat => !recentCategories.includes(cat));
    const pool = available.length > 0 ? available : categories; // fallback if all have been used

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
    if (!userHasDrawn || isCorrect) return;

    const interval = setInterval(() => {
      pollPrediction();
    }, 3000);

    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [userHasDrawn, isCorrect, currentCategory]);

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
    }
  }

  function handleClear() {
    canvasRef.current?.clearCanvas();
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
        />

        {/* Positioned items */}
        <div className="category-prompt-container">
          <h1 className="category-prompt info-container">
            {!isCorrect && <><span className="hide-mobile">Draw this: </span><b>{currentCategory}</b></>}
          </h1>

          <Countdown
            duration={30}
            onComplete={() => {
              if (!isCorrect) {
                setTimeRanOut(true);
              }
            }}
            running={countdownRunning && !isCorrect}
            resetTrigger={resetKey}
          />
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
            <span className="hide-mobile">Try Again</span><span className="show-mobile"><FontAwesomeIcon icon={faArrowRotateLeft} size="2x" color="#FFFFFF" /></span>
          </button>
          {prediction && !isCorrect && (
            <div className="prediction info-container">
              <span className="hide-mobile">Prediction: </span><b>{prediction}</b>
            </div>
          )}
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

export default App;
