import { useEffect, useState } from "react";

interface CountdownProps {
  duration: number; // seconds
  onComplete?: () => void;
  running: boolean;
  resetTrigger?: number;
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

export default function Countdown({
  duration,
  onComplete,
  running,
  resetTrigger,
}: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    setTimeLeft(duration);
  }, [duration, resetTrigger]);

  useEffect(() => {
    if (!running) {
      return;
    }
    if (timeLeft <= 0) {
      onComplete?.();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((t) => (t > 0 ? t - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [running, timeLeft, onComplete]);

  return (
    <div className="countdown-timer info-container" aria-live="polite" aria-atomic="true">
      <span className="countdown-value">{formatTime(timeLeft)}</span>
    </div>
  );
}
