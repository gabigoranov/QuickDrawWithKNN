import React, {
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from "react";

export type DrawingCanvasRef = {
  getStrokes: () => [number[], number[]][];
  clearCanvas: () => void;
  undoLastStroke: () => void;
};

interface Props {
  isCorrect: boolean;
  userHasDrawn: boolean;
  onUserDrawnChange: (hasDrawn: boolean) => void;
  className?: string;
  isDrawingDisabled?: boolean;
}

type Point = { x: number; y: number };
type Stroke = Point[];

const getRelativePos = (e: MouseEvent | TouchEvent, rect: DOMRect) => {
  if ("touches" in e) {
    const touch = e.touches[0];
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
  } else {
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }
};

const DrawingCanvas = forwardRef<DrawingCanvasRef, Props>(
  ({ isCorrect, onUserDrawnChange, className, isDrawingDisabled }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawing = useRef(false);
    const hasDrawn = useRef(false);
    const lastPos = useRef<Point | null>(null);
    const strokesRef = useRef<Stroke[]>([]);
    const dpr = window.devicePixelRatio || 1;

    const redraw = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle =
        getComputedStyle(document.documentElement).getPropertyValue("--background") ||
        "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle =
        getComputedStyle(document.documentElement).getPropertyValue("--text") ||
        "#22223b";
      ctx.lineWidth = 12 * dpr;
      ctx.lineCap = "round";

      for (const stroke of strokesRef.current) {
        if (stroke.length < 2) continue;
        ctx.beginPath();
        ctx.moveTo(stroke[0].x * dpr, stroke[0].y * dpr);
        for (let i = 1; i < stroke.length; i++) {
          ctx.lineTo(stroke[i].x * dpr, stroke[i].y * dpr);
        }
        ctx.stroke();
      }
    }, [dpr]);

    const resizeCanvas = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      redraw();
    }, [dpr, redraw]);

    const pointerDown = (e: React.MouseEvent | React.TouchEvent) => {
      if (isCorrect || isDrawingDisabled) return;
      isDrawing.current = true;
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      let pos: Point;
      if ("touches" in e) {
        pos = getRelativePos(e.nativeEvent, rect);
      } else {
        pos = {
          x: (e as React.MouseEvent).clientX - rect.left,
          y: (e as React.MouseEvent).clientY - rect.top,
        };
      }
      lastPos.current = pos;
      strokesRef.current.push([pos]);
    };

    const pointerMove = (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing.current || isCorrect || isDrawingDisabled) return;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      const rect = canvas.getBoundingClientRect();
      let pos: Point;
      if ("touches" in e) {
        if ((e as React.TouchEvent).nativeEvent.touches.length === 0) return;
        pos = getRelativePos(e.nativeEvent, rect);
      } else {
        pos = {
          x: (e as React.MouseEvent).clientX - rect.left,
          y: (e as React.MouseEvent).clientY - rect.top,
        };
      }

      if (lastPos.current) {
        ctx.strokeStyle =
          getComputedStyle(document.documentElement).getPropertyValue("--text") ||
          "#22223b";
        ctx.lineWidth = 12 * dpr;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(lastPos.current.x * dpr, lastPos.current.y * dpr);
        ctx.lineTo(pos.x * dpr, pos.y * dpr);
        ctx.stroke();
      }

      lastPos.current = pos;
      strokesRef.current[strokesRef.current.length - 1].push(pos);

      if (!hasDrawn.current) {
        hasDrawn.current = true;
        onUserDrawnChange(true);
      }
    };

    const pointerUp = () => {
      isDrawing.current = false;
      lastPos.current = null;
    };

    const clearCanvas = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      ctx.fillStyle =
        getComputedStyle(document.documentElement).getPropertyValue("--background") ||
        "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      strokesRef.current = [];
      hasDrawn.current = false;
      onUserDrawnChange(false);
    };

    const undoLastStroke = useCallback(() => {
      if (strokesRef.current.length === 0) return;
      strokesRef.current.pop();
      redraw();

      if (strokesRef.current.length === 0) {
        hasDrawn.current = false;
        onUserDrawnChange(false);
      }
    }, [redraw, onUserDrawnChange]);  

    const getStrokes = (): [number[], number[]][] => {
      return strokesRef.current
        .filter((stroke) => stroke.length > 1)
        .map((stroke) => [stroke.map((p) => p.x), stroke.map((p) => p.y)]);
    };

    useImperativeHandle(ref, () => ({
      getStrokes,
      clearCanvas,
      undoLastStroke,
    }));

    useEffect(() => {
      resizeCanvas();
      window.addEventListener("resize", resizeCanvas);

      // Redraw on theme change
      const observer = new MutationObserver(redraw);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-theme"],
      });

      return () => {
        window.removeEventListener("resize", resizeCanvas);
        observer.disconnect();
      };
    }, [resizeCanvas, redraw]);

    useEffect(() => {
      clearCanvas();
    }, []);

    useEffect(() => {
      const preventScroll = (e: TouchEvent) => {
        if (isDrawing.current) {
          e.preventDefault();
        }
      };
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.addEventListener("touchmove", preventScroll, { passive: false });
      }
      return () => {
        if (canvas) {
          canvas.removeEventListener("touchmove", preventScroll);
        }
      };
    }, []);

    return (
      <canvas
        ref={canvasRef}
        className={className}
        style={{
          background: "var(--background)",
          touchAction: "none",
          cursor: isCorrect || isDrawingDisabled ? "not-allowed" : "crosshair",
          opacity: isDrawingDisabled ? 0.5 : 1, // faded look when disabled
          display: "block",
          borderRadius: "1.5rem",
          userSelect: "none",
        }}
        onMouseDown={pointerDown}
        onMouseMove={pointerMove}
        onMouseUp={pointerUp}
        onMouseLeave={pointerUp}
        onTouchStart={pointerDown}
        onTouchMove={pointerMove}
        onTouchEnd={pointerUp}
        tabIndex={0}
      />
    );
  }
);

export default DrawingCanvas;
