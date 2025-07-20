import React, { createContext, useContext, useState, useCallback } from 'react';
import ToastNotification from './ToastNotification'; // Assuming ToastNotification is in the same components folder

export interface Notification {
  id: string;
  message: string;
  duration?: number; // auto-dismiss in ms, omit for persistent
  onClose?: () => void;
  data?: any; // optional extra data for UI, e.g., retryCountdown
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => string; // returns generated ID
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setNotifications((prev) => [...prev, { id, ...notification }]);
    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter(n => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
      <div className="toast-notification-container"> {/* This is the container for stacked toasts */}
        {notifications.map(({ id, message, duration, onClose, data }) => (
          <ToastNotification
            key={id}
            message={message}
            duration={duration}
            onClose={() => {
              removeNotification(id);
              if (onClose) onClose();
            }}
          >
            {/* Render retry countdown if data.retryCountdown exists */}
            {data?.retryCountdown !== undefined && (
              <div className="toast-extra">Retrying in {data.retryCountdown}s...</div>
            )}
          </ToastNotification>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used inside NotificationProvider');
  return context;
}

