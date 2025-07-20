import React, { createContext, useContext, useState, useCallback } from 'react';
import ToastNotification from './ToastNotification';

export interface Notification {
  id: string;
  message: string;
  duration?: number;
  onClose?: () => void;
  data?: any;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => string;
  removeNotification: (id: string) => void;  // <- add removeNotification here
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
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
      <div className="toast-notification-container">
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
            {data?.retryCountdown !== undefined && <div className="toast-extra">Retrying in {data.retryCountdown}s...</div>}
          </ToastNotification>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used inside NotificationProvider');
  }
  return context;
}
