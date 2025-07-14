import React, { useRef, useEffect, useCallback, useState } from "react";

interface Props {
  onPredict: (image: string) => void;
  isCorrect: boolean;
  userHasDrawn: boolean;
  onUserDrawnChange: (hasDrawn: boolean) => void;
}

export default function DrawingCanvas({
  onPredict,
  isCorrect,
  userHasDrawn,
  onUserDrawnChange,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef<boolean>(false);
  const predictionInterval = useRef<number | null>(null);
  const countdownInterval = useRef<number | null>(null);
  const hasDrawn = useRef<boolean>(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  // Countdown state (seconds left until next prediction)
  const [countdown, setCountdown] = useState<number>(3);

  // Drawing handlers (same as before) ...
  const startDrawing = useCallback(
    (e: React.MouseEvent) => {
      if (isCorrect) return;
      isDrawing.current = true;
      const rect = canvasRef.current!.getBoundingClientRect();
      lastPos.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    },
    [isCorrect]
  );

  const draw = useCallback(
    (e: React.MouseEvent) => {
      if (isCorrect) return;
      if (!isDrawing.current) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      ctx.strokeStyle = "black";
      ctx.lineWidth = 12;
      ctx.lineCap = "round";

      if (lastPos.current) {
        ctx.beginPath();
        ctx.moveTo(lastPos.current.x, lastPos.current.y);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
      lastPos.current = { x, y };

      if (!hasDrawn.current) {
        hasDrawn.current = true;
        onUserDrawnChange(true);
      }
    },
    [isCorrect, onUserDrawnChange]
  );

  const endDrawing = useCallback(() => {
    isDrawing.current = false;
    lastPos.current = null;
  }, []);

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    hasDrawn.current = false;
    onUserDrawnChange(false);
    setCountdown(3); // reset countdown on clear
  }, [onUserDrawnChange]);

  const resizeAndCenterImage = useCallback((sourceCanvas: HTMLCanvasElement): string => {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = 28;
    tempCanvas.height = 28;
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return "";

    tempCtx.fillStyle = "white";
    tempCtx.fillRect(0, 0, 28, 28);

    const scale = 28 / Math.max(sourceCanvas.width, sourceCanvas.height);
    const scaledWidth = sourceCanvas.width * scale;
    const scaledHeight = sourceCanvas.height * scale;
    const offsetX = (28 - scaledWidth) / 2;
    const offsetY = (28 - scaledHeight) / 2;

    tempCtx.drawImage(
      sourceCanvas,
      0,
      0,
      sourceCanvas.width,
      sourceCanvas.height,
      offsetX,
      offsetY,
      scaledWidth,
      scaledHeight
    );

    return tempCanvas.toDataURL("image/png");
  }, []);

  const handlePredict = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const smallImage = resizeAndCenterImage(canvas);
    onPredict(smallImage);
    setCountdown(3); // reset countdown after sending prediction
  }, [resizeAndCenterImage, onPredict]);

  // Manage prediction interval and countdown timer
  useEffect(() => {
    if (!isCorrect && userHasDrawn) {
      // Start prediction interval
      predictionInterval.current = window.setInterval(handlePredict, 3000);

      // Start countdown interval (every 1 second)
      setCountdown(3);
      countdownInterval.current = window.setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 3));
      }, 1000);
    } else {
      // Clear intervals when not predicting
      if (predictionInterval.current) {
        window.clearInterval(predictionInterval.current);
        predictionInterval.current = null;
      }
      if (countdownInterval.current) {
        window.clearInterval(countdownInterval.current);
        countdownInterval.current = null;
      }
      setCountdown(3);
    }

    return () => {
      if (predictionInterval.current) {
        window.clearInterval(predictionInterval.current);
      }
      if (countdownInterval.current) {
        window.clearInterval(countdownInterval.current);
      }
    };
  }, [isCorrect, userHasDrawn, handlePredict]);

  return (
    <div className="canvas-wrapper">
      <canvas
        ref={canvasRef}
        width={280}
        height={280}
        className="drawing-canvas"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={endDrawing}
        onMouseOut={endDrawing}
        style={{ backgroundColor: "white", cursor: isCorrect ? "not-allowed" : "crosshair" }}
      />
      <div className="button-row">
        <button onClick={clear} disabled={isCorrect}>
          Clear
        </button>
      </div>
      <div className="countdown-timer" style={{ marginTop: 10, fontSize: 16, color: "#555" }}>
        Next prediction in: {countdown} second{countdown !== 1 ? "s" : ""}
      </div>
    </div>
  );
}
