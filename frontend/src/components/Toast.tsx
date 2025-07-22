import React, { useEffect, useState } from "react";
import { type Toast as ToastType, useToast } from "../context/ToastContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faExclamationCircle,
  faInfoCircle,
  faTriangleExclamation,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

interface Props {
  toast: ToastType;
}

const icons: Record<string, any> = {
  success: faCheckCircle,
  error: faExclamationCircle,
  info: faInfoCircle,
  warning: faTriangleExclamation,
};

const Toast: React.FC<Props> = ({ toast }) => {
  const { removeToast } = useToast();
  const [hiding, setHiding] = useState(false);

  const onDismiss = () => {
    setHiding(true);
    setTimeout(() => removeToast(toast.id), 300);
  };

  return (
    <div
      className={`toast toast-${toast.type} ${hiding ? "hide" : "show"} ${
        hiding ? "hide" : ""
      }`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      tabIndex={0}
    >
      <div className="toast-icon" aria-hidden="true">
        <FontAwesomeIcon icon={icons[toast.type] || faInfoCircle} size="lg" />
      </div>
      <div className="toast-info-container">
        <div className="toast-content">
          {toast.customContent ? toast.customContent : toast.message}
        </div>
      </div>
    </div>
  );
};

export default Toast;
