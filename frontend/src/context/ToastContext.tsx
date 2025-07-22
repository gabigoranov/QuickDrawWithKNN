import React, {
  createContext,
  type ReactNode,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import ToastContainer from "../components/ToastContainer";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  type: ToastType;
  message: ReactNode;
  duration?: number; // ms; if undefined or 0 means persistent until manual dismiss
  customContent?: ReactNode;
}

interface ToastContextProps {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => string;
  removeToast: (id: string) => void;
  updateToast: (id: string, updated: Partial<Omit<Toast, "id">>) => void;
}

export type ToastReturnType = {
  id: string;
  update: (updated: Partial<Omit<Toast, "id">>) => void;
  dismiss: () => void;
};

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = crypto.randomUUID();
    setToasts((curr) => [...curr, { ...toast, id }]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((curr) => curr.filter((t) => t.id !== id));
  }, []);

  const updateToast = useCallback(
    (id: string, updated: Partial<Omit<Toast, "id">>) => {
      setToasts((curr) =>
        curr.map((t) => (t.id === id ? { ...t, ...updated } : t))
      );
    },
    []
  );

  // Auto-dismiss feature
  useEffect(() => {
    if (toasts.length === 0) return;

    const timers: number[] = [];

    toasts.forEach((toast) => {
        if (toast.duration && toast.duration > 0) {
        const timer = window.setTimeout(() => {
            removeToast(toast.id);
        }, toast.duration);
        timers.push(timer);
        }
    });

    return () => {
        timers.forEach((timer) => window.clearTimeout(timer));
    };
    }, [toasts, removeToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, updateToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextProps => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

// Global toast API helper bindings, to be initialized once in app
let globalAddToast: ((toast: Omit<Toast, "id">) => string) | null = null;
let globalRemoveToast: ((id: string) => void) | null = null;
let globalUpdateToast: ((id: string, updated: Partial<Omit<Toast, "id">>) => void) | null = null;

export const ToastInitializer = () => {
  const { addToast, removeToast, updateToast } = useToast();

  React.useEffect(() => {
    globalAddToast = addToast;
    globalRemoveToast = removeToast;
    globalUpdateToast = updateToast;

    return () => {
      globalAddToast = null;
      globalRemoveToast = null;
      globalUpdateToast = null;
    };
  }, [addToast, removeToast, updateToast]);

  return null;
};

type ToastAPI = {
  (
    message: ReactNode,
    type?: ToastType,
    duration?: number
  ): {
    id: string;
    update: (updated: Partial<Omit<Toast, "id">>) => void;
    dismiss: () => void;
  };
  success: (
    message: ReactNode,
    duration?: number
  ) => ReturnType<ToastAPI>;
  error: (
    message: ReactNode,
    duration?: number
  ) => ReturnType<ToastAPI>;
  info: (
    message: ReactNode,
    duration?: number
  ) => ReturnType<ToastAPI>;
  warning: (
    message: ReactNode,
    duration?: number
  ) => ReturnType<ToastAPI>;
};

const toastFunction: ToastAPI = (
  message,
  type = "info",
  duration,
) => {
  if (
    !globalAddToast ||
    !globalRemoveToast ||
    !globalUpdateToast
  ) {
    throw new Error(
      "toast() called before ToastProvider is mounted or outside component tree"
    );
  }
  const id = globalAddToast({ message, type, duration });

  return {
    id,
    update: (updated) => globalUpdateToast!(id, updated),
    dismiss: () => globalRemoveToast!(id),
  };
};

// Add convenience methods
toastFunction.success = (message, duration) =>
  toastFunction(message, "success", duration);
toastFunction.error = (message, duration) =>
  toastFunction(message, "error", duration);
toastFunction.info = (message, duration) =>
  toastFunction(message, "info", duration);
toastFunction.warning = (message, duration) =>
  toastFunction(message, "warning", duration);

export const toast = toastFunction;
