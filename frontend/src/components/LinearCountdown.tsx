import { useEffect, useRef, useState } from "react";

interface LinearCountdownProps {
  duration: number; // in seconds
  onComplete?: () => void;
  running: boolean;
  resetTrigger?: number; // changing this value will reset the countdown
}

export default function LinearCountdown({
  duration,
  onComplete,
  running,
  resetTrigger,
}: LinearCountdownProps) {
  const [progress, setProgress] = useState(0); // 0 to 1
  const requestRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) {
      setProgress(0);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      return;
    }

    const start = performance.now();
    startTimeRef.current = start;

    const animate = (now: number) => {
      const elapsed = (now - start) / 1000;
      const ratio = Math.min(elapsed / duration, 1);
      setProgress(ratio);

      if (ratio < 1) {
        requestRef.current = requestAnimationFrame(animate);
      } else {
        onComplete?.();
      }
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [running, resetTrigger, duration]);

  return (
    <div style={{ width: "100%", backgroundColor: "#ddd", height: 12, borderRadius: 6 }}>
      <div
        style={{
          width: `${progress * 100}%`,
          height: "100%",
          backgroundColor: "#4caf50",
          transition: "width 0.1s linear",
          borderRadius: 6,
        }}
      />
    </div>
  );
}
