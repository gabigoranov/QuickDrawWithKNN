import React, { useEffect, useState, useRef } from "react";

interface ToastNotificationProps {
  message: string;
  duration?: number; // ms, omit for persistent
  onClose: () => void;
  children?: React.ReactNode; // Add children type
}

export default function ToastNotification({
  message,
  duration,
  onClose,
  children,
}: ToastNotificationProps) {
  const [timeLeft, setTimeLeft] = useState(duration || 0);
  const startTimeRef = useRef<number | null>(null);
  const animationFrame = useRef<number | null>(null);

  useEffect(() => {
    if (duration === undefined) { // If no duration, it's a persistent toast, no timer needed
      setTimeLeft(0); // Explicitly set to 0 as no progress bar needed
      if (animationFrame.current !== null) {
        cancelAnimationFrame(animationFrame.current);
        animationFrame.current = null;
      }
      return;
    }

    setTimeLeft(duration);
    startTimeRef.current = null;

    function update(timestamp: number) {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const remaining = Math.max(duration! - elapsed, 0);
      setTimeLeft(remaining);

      if (remaining > 0) {
        animationFrame.current = requestAnimationFrame(update);
      } else {
        onClose();
      }
    }

    animationFrame.current = requestAnimationFrame(update);

    return () => {
      if (animationFrame.current !== null) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [message, duration, onClose]); // reset timer if message or duration changes

  return (
    <div className="toast-notification show" role="alert" aria-live="assertive">
      <div className="toast-message">
        {message}
      </div>
      {children} {/* Render children here if present */}
    </div>
  );
}
