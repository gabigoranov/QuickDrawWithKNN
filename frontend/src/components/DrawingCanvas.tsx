import React, {
  useRef,
  useEffect,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from "react";

export type DrawingCanvasRef = {
  getStrokes: () => [number[], number[]][];
  clearCanvas: () => void;
};

interface Props {
  isCorrect: boolean;
  userHasDrawn: boolean;
  onUserDrawnChange: (hasDrawn: boolean) => void;
}

type Point = { x: number; y: number };
type Stroke = Point[];

const DrawingCanvas = forwardRef<DrawingCanvasRef, Props>(
  ({ isCorrect, userHasDrawn, onUserDrawnChange }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawing = useRef(false);
    const hasDrawn = useRef(false);
    const lastPos = useRef<Point | null>(null);
    const strokesRef = useRef<Stroke[]>([]);

    const startDrawing = (e: React.MouseEvent) => {
      if (isCorrect) return;
      isDrawing.current = true;
      const rect = canvasRef.current!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      lastPos.current = { x, y };
      strokesRef.current.push([{ x, y }]);
    };

    const draw = (e: React.MouseEvent) => {
      if (!isDrawing.current || isCorrect) return;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

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
      strokesRef.current[strokesRef.current.length - 1].push({ x, y });

      if (!hasDrawn.current) {
        hasDrawn.current = true;
        onUserDrawnChange(true);
      }
    };

    const endDrawing = () => {
      isDrawing.current = false;
      lastPos.current = null;
    };

    const clearCanvas = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      strokesRef.current = [];
      hasDrawn.current = false;
      onUserDrawnChange(false);
    };

    const getStrokes = (): [number[], number[]][] => {
      return strokesRef.current
        .filter((stroke) => stroke.length > 1)
        .map((stroke) => [
          stroke.map((p) => p.x),
          stroke.map((p) => p.y),
        ]);
    };

    useImperativeHandle(ref, () => ({
      getStrokes,
      clearCanvas,
    }));

    useEffect(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }
    }, []);

    return (
      <canvas
        ref={canvasRef}
        width={380}
        height={380}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={endDrawing}
        onMouseOut={endDrawing}
        style={{
          backgroundColor: "white",
          cursor: isCorrect ? "not-allowed" : "crosshair",
        }}
      />
    );
  }
);

export default DrawingCanvas;
