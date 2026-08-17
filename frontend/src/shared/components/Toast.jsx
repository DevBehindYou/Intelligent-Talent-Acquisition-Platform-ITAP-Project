import { useEffect } from "react";
import Icon from "./Icon.jsx";
import { useNotificationsStore } from "../store/notificationsStore.js";

const TONE_ICON = { success: "check_circle", danger: "error", warning: "warning", neutral: "info" };
const TONE_CLASSES = {
  success: "border-success/40 text-success",
  danger: "border-danger/40 text-danger",
  warning: "border-warning/40 text-warning",
  neutral: "border-outline-variant text-on-surface",
};

function ToastItem({ toast }) {
  const dismissToast = useNotificationsStore((s) => s.dismissToast);

  useEffect(() => {
    const timeout = setTimeout(() => dismissToast(toast.id), 5000);
    return () => clearTimeout(timeout);
  }, [toast.id, dismissToast]);

  return (
    <div
      role="status"
      aria-live="polite"
      onMouseEnter={(e) => e.currentTarget.dataset.paused === "true"}
      className={`flex items-start gap-sm bg-paper border rounded-lg shadow-md px-md py-sm min-w-[280px] max-w-sm ${TONE_CLASSES[toast.tone]}`}
    >
      <Icon name={TONE_ICON[toast.tone]} size={20} />
      <div className="flex-1">
        <p className="text-body-md text-on-surface">{toast.message}</p>
        {toast.action && (
          <button onClick={toast.action.onClick} className="text-body-sm text-prussian font-medium mt-1 underline">
            {toast.action.label}
          </button>
        )}
      </div>
      <button onClick={() => dismissToast(toast.id)} aria-label="Dismiss notification" className="text-outline">
        <Icon name="close" size={16} />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const toasts = useNotificationsStore((s) => s.toasts);
  return (
    <div className="fixed bottom-md right-md z-[100] flex flex-col gap-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
