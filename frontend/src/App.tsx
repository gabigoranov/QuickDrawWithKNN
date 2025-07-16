import { useRef, useState, useEffect } from "react";
import DrawingCanvas, { type DrawingCanvasRef } from "./components/DrawingCanvas";
import LinearCountdown from "./components/LinearCountdown"; // You should create this
import "./styles/App.css";

function App() {
  const canvasRef = useRef<DrawingCanvasRef>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [currentCategory, setCurrentCategory] = useState<string>("");
  const [prediction, setPrediction] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [userHasDrawn, setUserHasDrawn] = useState(false);
  const [resetKey, setResetKey] = useState(0); // ⬅ Trigger countdown reset

  useEffect(() => {
    fetch("http://localhost:8000/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.categories))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (categories.length > 0) {
      selectRandomCategory();
    }
  }, [categories]);

  const selectRandomCategory = () => {
    const randomIndex = Math.floor(Math.random() * categories.length);
    setCurrentCategory(categories[randomIndex]);
    setIsCorrect(false);
    setPrediction(null);
    setUserHasDrawn(false);
    setResetKey((prev) => prev + 1); // 🔄 Reset countdown
    canvasRef.current?.clearCanvas();
  };

  const handlePrediction = async () => {
    if (!userHasDrawn || !canvasRef.current) return;
    const strokes = canvasRef.current.getStrokes();

    try {
      const res = await fetch("http://localhost:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strokes }),
      });

      const data = await res.json();
      setPrediction(data.prediction);

      if (data.prediction === currentCategory) {
        setIsCorrect(true);
      }
    } catch (error) {
      console.error("Prediction failed:", error);
    }
  };

  return (
    <div className="container">
      <div className="canvas-container card">
        <DrawingCanvas
          ref={canvasRef}
          isCorrect={isCorrect}
          userHasDrawn={userHasDrawn}
          onUserDrawnChange={setUserHasDrawn}
        />
      </div>
      <div className="info-container">
        <div className="status-container card">
          {!isCorrect && (
            <p className="category-prompt">
              Draw this: <strong>{currentCategory}</strong>
            </p>
          )}

          {isCorrect && (
            <div className="congratulations">
              <h2>🎉 Congratulations! 🎉</h2>
              <p>
                You correctly drew a <strong>{currentCategory}</strong>!
              </p>
            </div>
          )}

          {prediction && !isCorrect && (
            <p className="prediction">
              Prediction: <strong>{prediction}</strong>
            </p>
          )}
        </div>

        <div className="countdown-container card">
          <LinearCountdown
            duration={3}
            running={userHasDrawn && !isCorrect}
            onComplete={handlePrediction}
            resetTrigger={resetKey}
          />
        </div>

        <div className="actions-controller card">
          <button onClick={() => canvasRef.current?.clearCanvas()} disabled={isCorrect}>
            Clear
          </button>
          <button onClick={selectRandomCategory}>Try Again</button>
        </div>
      </div>
    </div>
  );
}

export default App;
