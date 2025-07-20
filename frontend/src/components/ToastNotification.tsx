import React, { useEffect, useState } from 'react';

interface ToastNotificationProps {
  message: string;
  duration?: number;
  onClose?: () => void;
  children?: React.ReactNode;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({
  message,
  duration,
  onClose,
  children,
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const enterTimeout: number = window.setTimeout(() => setVisible(true), 10);
    const exitTimeout: number = window.setTimeout(() => setVisible(false), duration);
    const removeTimeout: number = window.setTimeout(() => { if (onClose) onClose(); }, duration! + 300);

    return () => {
        window.clearTimeout(enterTimeout);
        window.clearTimeout(exitTimeout);
        window.clearTimeout(removeTimeout);
    };
    }, [duration, onClose]);


  // When visible is false, applies styles for hidden/offscreen
  // When true, applies `.show` styles (slide in)

  return (
    <div className={`toast-notification${visible ? ' show' : ''}`}>
      <div className="toast-message">{message}</div>
      {children}
    </div>
  );
};

export default ToastNotification;
