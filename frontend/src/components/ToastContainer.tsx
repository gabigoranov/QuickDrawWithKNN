import React from "react";
import "../styles/ToastNotification.css";
import { useToast } from "../context/ToastContext";
import Toast from "./Toast";

const ToastContainer: React.FC = () => {
  const { toasts } = useToast();

  return (
    <div
      className="toast-container"
      role="region"
      aria-live="polite"
      aria-relevant="additions"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
};

export default ToastContainer;
