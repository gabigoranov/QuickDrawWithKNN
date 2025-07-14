import { useState, useEffect } from "react";
import DrawingCanvas from "./components/DrawingCanvas";
import "./styles/App.css";

function App() {
  const [categories, setCategories] = useState<string[]>([]);
  const [currentCategory, setCurrentCategory] = useState<string>("");
  const [prediction, setPrediction] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [userHasDrawn, setUserHasDrawn] = useState<boolean>(false);

  const selectRandomCategory = () => {
    if (categories.length === 0) return;
    const randomIndex = Math.floor(Math.random() * categories.length);
    setCurrentCategory(categories[randomIndex]);
    setIsCorrect(false);
    setPrediction(null);
    setUserHasDrawn(false);
  };

  useEffect(() => {
    // Fetch categories once on app load
    fetch("http://localhost:8000/categories")
      .then((res) => res.json())
      .then((data) => {
        setCategories(data.categories);
      })
      .catch((err) => {
        console.error("Failed to fetch categories:", err);
      });
  }, []);

  useEffect(() => {
    if (categories.length > 0) {
      selectRandomCategory();
    }
  }, [categories]);

  const handlePrediction = async (imageDataUrl: string) => {
    if (!userHasDrawn) return;

    try {
      const response = await fetch("http://localhost:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageDataUrl }),
      });

      const data = await response.json();
      setPrediction(data.prediction);

      if (data.prediction === currentCategory) {
        setIsCorrect(true);
      }
    } catch (error) {
      console.error("Prediction request failed:", error);
    }
  };

  const handleUserDrawnChange = (hasDrawn: boolean) => {
    setUserHasDrawn(hasDrawn);
  };

  const handleTryAgain = () => {
    selectRandomCategory();
  };

  return (
    <div className="container">
      <h1>QuickDraw KNN Classifier</h1>

      {!isCorrect && currentCategory && (
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
          <button onClick={handleTryAgain}>Try Again</button>
        </div>
      )}

      <DrawingCanvas
        onPredict={handlePrediction}
        isCorrect={isCorrect}
        userHasDrawn={userHasDrawn}
        onUserDrawnChange={handleUserDrawnChange}
      />

      {prediction && !isCorrect && (
        <p className="prediction">
          Prediction: <strong>{prediction}</strong>
        </p>
      )}
    </div>
  );
}

export default App;
